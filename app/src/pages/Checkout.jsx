import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Sprout, ShieldCheck } from 'lucide-react';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';
import { useCart } from '@/lib/cartContext';
import { formatCurrency } from '@/lib/format';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';

export default function Checkout() {
  const { items, total, clearCart, groupedByFarmer } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', city: '', state: '', pincode: ''
  });
  const [fulfilment, setFulfilment] = useState('delivery');

  useEffect(() => {
    if (!user) return;
    setForm(prev => ({
      ...prev,
      name: prev.name || user.full_name || '',
      email: prev.email || user.email || '',
      phone: prev.phone || user.phone || '',
    }));
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;

    // Check if running in iframe
    if (window.self !== window.top) {
      toast({ title: 'Checkout unavailable', description: 'Please open the published app to complete checkout.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const deliveryAddress = fulfilment === 'delivery'
        ? `${form.address}, ${form.city}, ${form.state} ${form.pincode}`
        : 'Farm pickup';

      const fullAddress = `${form.name} | ${form.phone} | ${deliveryAddress}`;

      // Create one order per farmer
      const orders = await Promise.all(groupedByFarmer.map(async (group) => {
        const subtotal = group.items.reduce((s, i) => s + i.price_per_unit * i.quantity, 0);
        const orderItems = group.items.map(i => ({
          product_id: i.product_id,
          product_name: i.product_name,
          quantity: i.quantity,
          unit: i.unit,
          price_per_unit: i.price_per_unit,
          line_total: i.price_per_unit * i.quantity
        }));

        const order = await api.entities.Order.create({
          customer_id: user.id,
          customer_name: form.name,
          customer_email: form.email,
          customer_phone: form.phone,
          farmer_id: group.farmer_id,
          farmer_name: group.farmer_name,
          items: orderItems,
          subtotal,
          delivery_fee: 0,
          total: subtotal,
          fulfilment_type: fulfilment,
          delivery_address: fullAddress,
          payment_status: 'pending',
          delivery_status: 'placed'
        });

        // Create Stripe checkout session
        const res = await api.functions.invoke('createCheckoutSession', {
          order_id: order.id,
          amount: Math.round(subtotal * 100),
          customer_email: form.email,
          customer_name: form.name,
          farmer_name: group.farmer_name
        });

        return res;
      }));

      clearCart();

      // Redirect to first checkout session (if multiple farmers, others are paid separately)
      if (orders[0]?.url) {
        window.location.href = orders[0].url;
      } else {
        navigate('/orders');
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Checkout failed', description: err.message || 'Please try again.', variant: 'destructive' });
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <PublicNavbar />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <Sprout className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-3 text-lg font-semibold">Your cart is empty</h2>
          <Link to="/" className="mt-4 inline-block"><Button>Browse marketplace</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />
      <main className="flex-1">
        {/* Mobile: total + pay stays reachable via a fixed bottom bar instead of
            requiring a scroll past the whole form to reach the summary card. */}
        <div className="mx-auto max-w-5xl px-4 py-6 pb-28 sm:px-6 lg:pb-6">
          <Link to="/cart" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to cart
          </Link>
          <h1 className="mt-3 font-heading text-2xl font-bold sm:text-3xl">Checkout</h1>

          <form id="checkout-form" onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
            <div className="space-y-6">
              <div className="rounded-2xl border border-border p-5">
                <h2 className="font-heading text-base font-semibold">Contact & delivery</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div><Label htmlFor="name">Full name *</Label><Input id="name" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                  <div><Label htmlFor="phone">Phone *</Label><Input id="phone" required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                  <div><Label htmlFor="email">Email *</Label><Input id="email" type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
                  <div><Label htmlFor="pincode">Pincode *</Label><Input id="pincode" required value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value})} /></div>
                  <div className="sm:col-span-2"><Label htmlFor="address">Address *</Label><Input id="address" required value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
                  <div><Label htmlFor="city">City *</Label><Input id="city" required value={form.city} onChange={e => setForm({...form, city: e.target.value})} /></div>
                  <div><Label htmlFor="state">State *</Label><Input id="state" required value={form.state} onChange={e => setForm({...form, state: e.target.value})} /></div>
                </div>
              </div>

              <div className="rounded-2xl border border-border p-5">
                <h2 className="font-heading text-base font-semibold">Delivery method</h2>
                <RadioGroup value={fulfilment} onValueChange={setFulfilment} className="mt-3 space-y-2">
                  <label className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer ${fulfilment === 'delivery' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <RadioGroupItem value="delivery" />
                    <div><div className="font-medium text-sm">Home delivery</div><div className="text-xs text-muted-foreground">Delivered to your address</div></div>
                  </label>
                  <label className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer ${fulfilment === 'pickup' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <RadioGroupItem value="pickup" />
                    <div><div className="font-medium text-sm">Farm pickup</div><div className="text-xs text-muted-foreground">Pick up directly from the farm</div></div>
                  </label>
                </RadioGroup>
              </div>
            </div>

            <div className="h-fit rounded-2xl border border-border p-5">
              <h2 className="font-heading text-base font-semibold">Order summary</h2>
              <div className="mt-3 space-y-2 text-sm">
                {items.map(item => (
                  <div key={item.product_id} className="flex justify-between">
                    <span className="text-muted-foreground">{item.product_name} × {item.quantity}</span>
                    <span className="font-semibold">{formatCurrency(item.price_per_unit * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 border-t border-border pt-3">
                <div className="flex justify-between"><span className="font-semibold">Total</span><span className="font-heading text-xl font-bold text-primary">{formatCurrency(total)}</span></div>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-primary/5 p-3 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" /> Secure payment via Stripe. Test card: 4242 4242 4242 4242
              </div>
              {/* Desktop/tablet: submit button lives in the visible sidebar.
                  Hidden below lg since the fixed bottom bar covers it there. */}
              <Button type="submit" size="lg" className="mt-4 hidden w-full lg:flex" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Processing...</> : `Pay ${formatCurrency(total)}`}
              </Button>
            </div>
          </form>
        </div>
      </main>

      {/* Mobile-only fixed action bar: total + pay button always reachable
          without scrolling past the form. Submits the form above by id. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur-md lg:hidden" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-1">
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">Total</div>
            <div className="font-heading text-lg font-bold text-primary">{formatCurrency(total)}</div>
          </div>
          <Button type="submit" form="checkout-form" size="lg" disabled={loading} className="min-w-[140px]">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Processing...</> : 'Pay now'}
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}

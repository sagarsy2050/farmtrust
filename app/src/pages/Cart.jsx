import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Minus, Plus, ShoppingCart, Sprout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';
import { useCart } from '@/lib/cartContext';
import { formatCurrency } from '@/lib/format';

export default function Cart() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Continue shopping
          </Link>

          <h1 className="mt-3 font-heading text-2xl font-bold sm:text-3xl">Your cart</h1>

          {items.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-border py-16 text-center">
              <ShoppingCart className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-muted-foreground">Your cart is empty.</p>
              <Link to="/" className="mt-4 inline-block"><Button>Browse marketplace</Button></Link>
            </div>
          ) : (
            <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.product_id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {item.photo_url ? (
                        <Image src={item.photo_url} alt={item.product_name} fittingType="fill" className="h-full w-full" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center"><Sprout className="h-6 w-6 text-muted-foreground" aria-hidden="true" /></div>
                      )}
                    </div>
                    <div className="min-w-[140px] flex-1">
                      <h3 className="font-heading text-sm font-semibold">{item.product_name}</h3>
                      <p className="text-xs text-muted-foreground">{item.farmer_name}</p>
                      <p className="mt-1 text-sm font-semibold text-primary">{formatCurrency(item.price_per_unit)}/{item.unit}</p>
                    </div>
                    <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
                      <div className="flex items-center gap-1 rounded-lg border border-border">
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          className="flex h-9 w-9 items-center justify-center hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={`Decrease quantity of ${item.product_name}`}
                        >
                          <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold" aria-live="polite">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          className="flex h-9 w-9 items-center justify-center hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={`Increase quantity of ${item.product_name}`}
                        >
                          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                      <div className="w-20 text-right font-heading text-sm font-bold">{formatCurrency(item.price_per_unit * item.quantity)}</div>
                      <button
                        onClick={() => removeItem(item.product_id)}
                        className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`Remove ${item.product_name} from cart`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
                <button onClick={clearCart} className="min-h-[44px] text-sm text-muted-foreground hover:text-destructive">Clear cart</button>
              </div>

              <div className="h-fit rounded-2xl border border-border p-5">
                <h2 className="font-heading text-lg font-semibold">Order summary</h2>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-semibold">{formatCurrency(total)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="font-semibold">Calculated at checkout</span></div>
                </div>
                <div className="mt-3 border-t border-border pt-3">
                  <div className="flex justify-between"><span className="font-semibold">Total</span><span className="font-heading text-xl font-bold text-primary">{formatCurrency(total)}</span></div>
                </div>
                <Link to="/checkout"><Button className="mt-4 w-full" size="lg">Proceed to checkout</Button></Link>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

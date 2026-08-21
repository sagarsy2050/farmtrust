import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, Sprout } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';

export default function OrderSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        if (sessionId) {
          // Verify payment status via backend function
          const res = await base44.functions.invoke('verifyPayment', { session_id: sessionId });
          setOrder(res);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
          {loading ? (
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          ) : (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle className="h-9 w-9 text-primary" />
              </div>
              <h1 className="mt-4 font-heading text-2xl font-bold sm:text-3xl">Order confirmed!</h1>
              <p className="mt-2 text-muted-foreground">
                Thank you for your order. Your farmer has been notified and will prepare your produce.
              </p>

              {order && (
                <div className="mt-6 rounded-2xl border border-border p-5 text-left">
                  <div className="flex items-center justify-between">
                    <h2 className="font-heading text-base font-semibold">Order details</h2>
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div className="mt-3 space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Farmer</span><span className="font-medium">{order.farmer_name}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="font-medium capitalize">{order.delivery_status || 'placed'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><span className="font-medium capitalize">{order.payment_status || 'paid'}</span></div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-center gap-3">
                <Link to="/"><Button variant="outline">Continue shopping</Button></Link>
                <Link to="/orders"><Button>View orders</Button></Link>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

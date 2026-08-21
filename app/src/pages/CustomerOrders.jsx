import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';
import ReviewStars from '@/components/ReviewStars';
import ReviewForm from '@/components/ReviewForm';
import { formatCurrency, formatDate } from '@/lib/format';
import { Package, Clock, CheckCircle, Truck, XCircle, Sprout, Star } from 'lucide-react';

const STATUS_ICON = {
  placed: <Clock className="h-4 w-4 text-yellow-600" />,
  accepted: <CheckCircle className="h-4 w-4 text-blue-600" />,
  preparing: <Package className="h-4 w-4 text-blue-600" />,
  dispatched: <Truck className="h-4 w-4 text-purple-600" />,
  delivered: <CheckCircle className="h-4 w-4 text-green-600" />,
  completed: <CheckCircle className="h-4 w-4 text-primary" />,
  cancelled: <XCircle className="h-4 w-4 text-red-600" />,
};

const STEPS = ['placed', 'accepted', 'preparing', 'dispatched', 'delivered', 'completed'];

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // order_id -> review (null while unchecked, false = confirmed none exists)
  const [reviews, setReviews] = useState({});
  const [reviewingId, setReviewingId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.Order.list('-created_date', 100);
        setOrders(list);
        const completed = list.filter(o => o.delivery_status === 'completed');
        if (completed.length) {
          const pairs = await Promise.all(completed.map(async o => {
            try {
              const existing = await base44.entities.Review.filter({ order_id: o.id });
              return [o.id, existing?.[0] || false];
            } catch {
              return [o.id, false];
            }
          }));
          setReviews(Object.fromEntries(pairs));
        }
      } catch (e) {
        console.error(e);
        setError('Could not load your orders. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">My orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track your purchases from verified farmers.</p>

          {loading ? (
            <div className="mt-6 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : error ? (
            <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
              {error}
            </div>
          ) : orders.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border py-16 text-center">
              <Sprout className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-muted-foreground">You haven't placed any orders yet.</p>
              <Link to="/" className="mt-4 inline-block"><Button>Browse marketplace</Button></Link>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {orders.map(o => {
                const stepIndex = STEPS.indexOf(o.delivery_status);
                return (
                  <div key={o.id} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          {STATUS_ICON[o.delivery_status] || STATUS_ICON.placed}
                          <h3 className="font-heading text-sm font-semibold capitalize">{o.delivery_status?.replace('_', ' ')}</h3>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">From {o.farmer_name} · {formatDate(o.created_date)}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-heading text-lg font-bold text-primary">{formatCurrency(o.total)}</div>
                        <div className="text-xs capitalize text-muted-foreground">{o.payment_status}</div>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1 rounded-lg bg-muted/30 p-3 text-sm">
                      {o.items?.map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{item.product_name} × {item.quantity} {item.unit}</span>
                          <span className="font-medium">{formatCurrency(item.line_total)}</span>
                        </div>
                      ))}
                    </div>

                    {o.delivery_status !== 'cancelled' && stepIndex >= 0 && (
                      <div className="mt-4 flex items-center gap-1">
                        {STEPS.map((s, i) => (
                          <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? 'bg-primary' : 'bg-muted'}`} title={s} />
                        ))}
                      </div>
                    )}

                    {o.fulfilment_type === 'pickup' ? (
                      <p className="mt-2 text-xs text-muted-foreground">Farm pickup</p>
                    ) : o.delivery_address && (
                      <p className="mt-2 text-xs text-muted-foreground">{o.delivery_address}</p>
                    )}

                    {o.delivery_status === 'completed' && (
                      <div className="mt-3 border-t border-border pt-3">
                        {reviews[o.id] ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Star className="h-4 w-4 fill-secondary text-secondary" aria-hidden="true" />
                            You rated this order <ReviewStars value={reviews[o.id].overall_rating} size="sm" />
                          </div>
                        ) : reviewingId === o.id ? (
                          <ReviewForm
                            order={o}
                            onCancel={() => setReviewingId(null)}
                            onSubmitted={(review) => { setReviews(prev => ({ ...prev, [o.id]: review })); setReviewingId(null); }}
                          />
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => setReviewingId(o.id)}>Leave a review</Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

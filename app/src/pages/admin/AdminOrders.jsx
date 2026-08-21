import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ShoppingCart, Search } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setOrders(await base44.asServiceRole.entities.Order.list('-created_date', 100));
      } catch (e) {
        console.error(e);
        setError('Could not load orders. Please try again.');
      }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = orders.filter(o =>
    !search || o.customer_name?.toLowerCase().includes(search.toLowerCase()) || o.farmer_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">View all marketplace orders.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..."
          className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <ShoppingCart className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(o => (
            <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-4">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{o.customer_name} → {o.farmer_name}</div>
                <div className="text-xs text-muted-foreground">{o.items?.length} items · {formatDate(o.created_date)}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-semibold text-primary">{formatCurrency(o.total)}</div>
                <div className="text-xs capitalize text-muted-foreground">{o.payment_status} · {o.delivery_status}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

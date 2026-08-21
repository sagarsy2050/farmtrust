import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/format';
import { Package, CheckCircle, Truck, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const STATUSES = ['placed', 'accepted', 'preparing', 'dispatched', 'delivered', 'completed', 'cancelled'];

export default function FarmerOrders() {
  const { user: ctxUser } = useOutletContext();
  const { toast } = useToast();
  const [user, setUser] = useState(ctxUser);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!ctxUser) base44.auth.me().then(setUser).catch(() => {});
    else setUser(ctxUser);
  }, [ctxUser]);

  const loadOrders = React.useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try { setOrders(await base44.entities.Order.filter({ farmer_id: user.id }, '-created_date')); }
    catch (e) { console.error(e); setError('Could not load your orders.'); }
    finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const updateStatus = async (orderId, status) => {
    try {
      await base44.entities.Order.update(orderId, { delivery_status: status });
      await loadOrders();
    } catch (e) {
      toast({ title: 'Could not update order', description: e.message, variant: 'destructive' });
    }
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.delivery_status === filter);

  const statusIcon = {
    placed: <Clock className="h-4 w-4 text-yellow-600" />,
    accepted: <CheckCircle className="h-4 w-4 text-blue-600" />,
    preparing: <Package className="h-4 w-4 text-blue-600" />,
    dispatched: <Truck className="h-4 w-4 text-purple-600" />,
    delivered: <CheckCircle className="h-4 w-4 text-green-600" />,
    completed: <CheckCircle className="h-4 w-4 text-primary" />,
    cancelled: <XCircle className="h-4 w-4 text-red-600" />,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage customer orders for your products.</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All orders</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 shrink-0" /> {error}</span>
          <Button size="sm" variant="outline" onClick={loadOrders}>Retry</Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(o => (
            <div key={o.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    {statusIcon[o.delivery_status]}
                    <h3 className="font-heading text-sm font-semibold capitalize">{o.delivery_status}</h3>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{o.customer_name} · {formatDate(o.created_date)}</p>
                  <p className="text-xs text-muted-foreground">{o.customer_phone} · {o.fulfilment_type}</p>
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

              {o.delivery_address && (
                <p className="mt-2 text-xs text-muted-foreground">{o.delivery_address}</p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {o.delivery_status === 'placed' && <Button size="sm" onClick={() => updateStatus(o.id, 'accepted')}>Accept order</Button>}
                {o.delivery_status === 'accepted' && <Button size="sm" onClick={() => updateStatus(o.id, 'preparing')}>Mark preparing</Button>}
                {o.delivery_status === 'preparing' && <Button size="sm" onClick={() => updateStatus(o.id, 'dispatched')}>Mark dispatched</Button>}
                {o.delivery_status === 'dispatched' && <Button size="sm" onClick={() => updateStatus(o.id, 'delivered')}>Mark delivered</Button>}
                {o.delivery_status === 'delivered' && <Button size="sm" onClick={() => updateStatus(o.id, 'completed')}>Complete order</Button>}
                {(o.delivery_status === 'placed' || o.delivery_status === 'accepted') && <Button size="sm" variant="outline" onClick={() => updateStatus(o.id, 'cancelled')}>Cancel</Button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

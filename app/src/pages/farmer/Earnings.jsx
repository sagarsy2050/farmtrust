import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/format';
import { Wallet, TrendingUp, Package, Users, ArrowDownToLine } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Earnings() {
  const { user: ctxUser } = useOutletContext();
  const [user, setUser] = useState(ctxUser);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ctxUser) base44.auth.me().then(setUser).catch(() => {});
    else setUser(ctxUser);
  }, [ctxUser]);

  const loadOrders = React.useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try { setOrders(await base44.entities.Order.filter({ farmer_id: user.id }, '-created_date')); }
    catch (e) { console.error(e); setError('Could not load your earnings.'); }
    finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const stats = useMemo(() => {
    const paid = orders.filter(o => o.payment_status === 'paid');
    const pending = orders.filter(o => o.payment_status === 'pending' && o.delivery_status !== 'cancelled');
    const today = new Date().toISOString().slice(0, 10);
    const todaySales = paid.filter(o => o.created_date?.slice(0, 10) === today).reduce((s, o) => s + o.total, 0);
    const totalEarnings = paid.reduce((s, o) => s + o.total, 0);
    const pendingSettlement = pending.reduce((s, o) => s + o.total, 0);
    const totalQty = orders.flatMap(o => o.items || []).reduce((s, i) => s + i.quantity, 0);
    const uniqueCustomers = new Set(orders.map(o => o.customer_id)).size;

    return { todaySales, totalEarnings, pendingSettlement, totalQty, uniqueCustomers, orderCount: orders.length };
  }, [orders]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">My Earnings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track your sales and earnings.</p>
      </div>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={loadOrders}>Retry</Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />)}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}
          </div>
        </div>
      ) : (
      <>
      {/* Earnings cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground">
          <Wallet className="h-5 w-5 opacity-80" />
          <div className="mt-2 text-xs opacity-80">Today's sales</div>
          <div className="font-heading text-2xl font-bold">{formatCurrency(stats.todaySales)}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <TrendingUp className="h-5 w-5 text-yellow-600" />
          <div className="mt-2 text-xs text-muted-foreground">Pending settlement</div>
          <div className="font-heading text-2xl font-bold">{formatCurrency(stats.pendingSettlement)}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <Wallet className="h-5 w-5 text-green-600" />
          <div className="mt-2 text-xs text-muted-foreground">Total earnings</div>
          <div className="font-heading text-2xl font-bold">{formatCurrency(stats.totalEarnings)}</div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <Package className="h-4 w-4 text-primary" />
          <div className="mt-1 text-xs text-muted-foreground">Orders</div>
          <div className="font-heading text-xl font-bold">{stats.orderCount}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <Package className="h-4 w-4 text-primary" />
          <div className="mt-1 text-xs text-muted-foreground">Products sold</div>
          <div className="font-heading text-xl font-bold">{stats.totalQty} kg</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <Users className="h-4 w-4 text-primary" />
          <div className="mt-1 text-xs text-muted-foreground">Customers</div>
          <div className="font-heading text-xl font-bold">{stats.uniqueCustomers}</div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <ArrowDownToLine className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-base font-semibold">Withdrawal</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Available balance: <span className="font-bold text-foreground">{formatCurrency(stats.totalEarnings)}</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Withdrawals are processed via compliant payment providers with appropriate KYC and tax requirements. Bank credentials are never stored on this platform.
        </p>
      </div>
      </>
      )}
    </div>
  );
}

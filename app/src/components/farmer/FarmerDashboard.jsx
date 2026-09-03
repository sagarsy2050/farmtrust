import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, MapPin, FileText, Package, ShoppingCart, Wallet, Plus, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VerifiedBadge from '@/components/VerifiedBadge';
import { formatCurrency } from '@/lib/format';

export default function FarmerDashboard({ user, farms = [], products = [], orders = [], loading, error, onRetry }) {
  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter(o => o.created_date?.slice(0, 10) === today);
  const todaySales = todayOrders.reduce((s, o) => s + (o.total || 0), 0);
  const pendingOrders = orders.filter(o => o.delivery_status === 'placed' || o.delivery_status === 'accepted');
  const totalRevenue = orders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + (o.total || 0), 0);

  const verificationPct = user?.verified_farmer ? 100
    : user?.verification_level === 'documents' ? 80
    : user?.verification_level === 'location' ? 60
    : user?.verification_level === 'identity' ? 40
    : user?.verification_level === 'none' ? 20 : 20;

  const actions = [
    { label: 'Add Product', to: '/farmer/products/new', icon: Plus },
    { label: 'Orders', to: '/farmer/orders', icon: ShoppingCart },
    { label: 'Earnings', to: '/farmer/earnings', icon: Wallet },
    { label: 'My Farms', to: '/farmer/farms', icon: MapPin },
    { label: 'Documents', to: '/farmer/documents', icon: FileText },
    { label: 'Verification', to: '/farmer/verification', icon: ShieldCheck },
  ];

  const stats = [
    { label: "Today's Sales", value: formatCurrency(todaySales), icon: TrendingUp },
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: Wallet },
    { label: 'Orders', value: orders.length, icon: ShoppingCart },
    { label: 'Products', value: products.length, icon: Package },
    { label: 'Pending Orders', value: pendingOrders.length, icon: ShoppingCart },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-xl font-bold sm:text-2xl">Welcome, {user?.full_name?.split(' ')[0] || 'Farmer'} 👋</h1>
            <p className="mt-1 text-sm text-primary-foreground/80">Here's what's happening on your farm today.</p>
          </div>
          <div className="sm:text-right">
            <VerifiedBadge level={user?.verification_level || 'none'} className="bg-white/20 text-white ring-white/30" />
            <div className="mt-2 text-xs text-primary-foreground/80">Verification: {verificationPct}%</div>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-white transition-all" style={{ width: `${verificationPct}%` }} />
        </div>
      </div>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <span>{error}</span>
          {onRetry && <Button size="sm" variant="outline" onClick={onRetry}>Retry</Button>}
        </div>
      )}

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-1 font-heading text-xl font-bold">{s.value}</div>
            </div>
          );
        })}
      </div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="font-heading text-base font-semibold">Quick actions</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {actions.map(a => {
            const Icon = a.icon;
            return (
              <Link key={a.to} to={a.to}
                className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-colors hover:border-primary hover:bg-primary/5">
                <Icon className="h-5 w-5 text-primary" />
                <span className="text-xs font-medium">{a.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent orders */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-base font-semibold">Recent orders</h2>
          <Link to="/farmer/orders"><Button variant="ghost" size="sm">View all</Button></Link>
        </div>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {orders.slice(0, 5).map(o => (
              <div key={o.id} className="flex items-center justify-between rounded-lg bg-muted/30 p-3 text-sm">
                <div>
                  <div className="font-medium">{o.customer_name}</div>
                  <div className="text-xs text-muted-foreground">{o.items?.length} items · {o.created_date?.slice(0, 10)}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatCurrency(o.total)}</div>
                  <div className="text-xs capitalize text-muted-foreground">{o.delivery_status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

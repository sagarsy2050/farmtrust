import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { formatCurrency } from '@/lib/format';
import { TrendingUp, Package, Star, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

export default function FarmerAnalytics() {
  const { user: ctxUser } = useOutletContext();
  const [user, setUser] = useState(ctxUser);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMobile = useIsMobile();
  const chartHeight = isMobile ? 220 : 300;

  useEffect(() => {
    if (!ctxUser) base44.auth.me().then(setUser).catch(() => {});
    else setUser(ctxUser);
  }, [ctxUser]);

  const loadData = React.useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [o, p, r] = await Promise.all([
        base44.entities.Order.filter({ farmer_id: user.id }, '-created_date'),
        base44.entities.Product.filter({ farmer_id: user.id }),
        base44.entities.Review.filter({ farmer_id: user.id }),
      ]);
      setOrders(o); setProducts(p); setReviews(r);
    } catch (e) {
      console.error(e);
      setError('Could not load your analytics.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  // Monthly sales
  const monthlyData = useMemo(() => {
    const months = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    orders.forEach(o => {
      const d = new Date(o.created_date);
      const key = `${monthNames[d.getMonth()]}`;
      months[key] = (months[key] || 0) + (o.total || 0);
    });
    return Object.entries(months).map(([month, revenue]) => ({ month, revenue }));
  }, [orders]);

  // Top products
  const topProducts = useMemo(() => {
    const sales = {};
    orders.forEach(o => {
      o.items?.forEach(i => {
        sales[i.product_name] = (sales[i.product_name] || 0) + (i.line_total || 0);
      });
    });
    return Object.entries(sales).map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [orders]);

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + (r.overall_rating || 0), 0) / reviews.length).toFixed(1) : '—';
  const totalRevenue = orders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + o.total, 0);
  const totalQty = orders.flatMap(o => o.items || []).reduce((s, i) => s + i.quantity, 0);
  const repeatCustomers = Object.values(orders.reduce((acc, o) => {
    acc[o.customer_id] = (acc[o.customer_id] || 0) + 1;
    return acc;
  }, {})).filter(c => c > 1).length;

  const COLORS = ['#15803d', '#eab308', '#f97316', '#84cc16', '#06b6d4'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track your farm performance and sales.</p>
      </div>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={loadData}>Retry</Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}
          </div>
          <div className="h-72 animate-pulse rounded-2xl bg-muted" />
        </div>
      ) : (
      <>
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <TrendingUp className="h-4 w-4 text-primary" />
          <div className="mt-1 text-xs text-muted-foreground">Total revenue</div>
          <div className="font-heading text-xl font-bold">{formatCurrency(totalRevenue)}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <Package className="h-4 w-4 text-primary" />
          <div className="mt-1 text-xs text-muted-foreground">Quantity sold</div>
          <div className="font-heading text-xl font-bold">{totalQty} kg</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <Star className="h-4 w-4 text-primary" />
          <div className="mt-1 text-xs text-muted-foreground">Avg rating</div>
          <div className="font-heading text-xl font-bold">{avgRating}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <Repeat className="h-4 w-4 text-primary" />
          <div className="mt-1 text-xs text-muted-foreground">Repeat customers</div>
          <div className="font-heading text-xl font-bold">{repeatCustomers}</div>
        </div>
      </div>

      {/* Monthly sales chart */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading text-base font-semibold">Monthly sales</h2>
        {monthlyData.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No sales data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={v => formatCurrency(v)} />
              <Bar dataKey="revenue" fill="#15803d" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top products */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading text-base font-semibold">Top selling products</h2>
        {topProducts.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No product sales yet.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {topProducts.map((p, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
                <span className="text-sm font-medium">{p.name}</span>
                <span className="font-heading text-sm font-bold text-primary">{formatCurrency(p.revenue)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
}

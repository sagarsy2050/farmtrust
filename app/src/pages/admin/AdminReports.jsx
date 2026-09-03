import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/format';
import { Users, MapPin, Package, ShoppingCart } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export default function AdminReports() {
  const [data, setData] = useState({ users: [], farms: [], products: [], orders: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    (async () => {
      try {
        const [u, f, p, o] = await Promise.all([
          api.asServiceRole.entities.User.list('-created_date', 100),
          api.asServiceRole.entities.Farm.list('-created_date', 100),
          api.asServiceRole.entities.Product.list('-created_date', 100),
          api.asServiceRole.entities.Order.list('-created_date', 100),
        ]);
        setData({ users: u, farms: f, products: p, orders: o });
      } catch (e) {
        console.error(e);
        setError('Could not load reports. Please try again.');
      }
      finally { setLoading(false); }
    })();
  }, []);

  const stats = [
    { label: 'Total Users', value: data.users.length, icon: Users },
    { label: 'Total Farms', value: data.farms.length, icon: MapPin },
    { label: 'Total Products', value: data.products.length, icon: Package },
    { label: 'Total Orders', value: data.orders.length, icon: ShoppingCart },
  ];

  // Monthly revenue
  const monthlyData = (() => {
    const months = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    data.orders.forEach(o => {
      const d = new Date(o.created_date);
      const key = monthNames[d.getMonth()];
      months[key] = (months[key] || 0) + (o.total || 0);
    });
    return Object.entries(months).map(([month, revenue]) => ({ month, revenue }));
  })();

  const totalRevenue = data.orders.reduce((s, o) => s + (o.total || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">Platform overview and analytics.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
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
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4">
              <Icon className="h-4 w-4 text-primary" />
              <div className="mt-1 font-heading text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-heading text-base font-semibold">Total Revenue: {formatCurrency(totalRevenue)}</h2>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading text-base font-semibold">Monthly Revenue</h2>
        {monthlyData.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
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
      </>
      )}
    </div>
  );
}

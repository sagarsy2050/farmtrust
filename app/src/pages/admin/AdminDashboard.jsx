import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { Users, MapPin, FileText, Package, ShoppingCart, Clock, CheckCircle, XCircle, AlertTriangle, ShieldCheck, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';

export default function AdminDashboard() {
  const [overview, setOverview] = useState({ farmers: 0, farms: 0, pendingVerification: 0, orders: 0, revenue: 0 });
  const [stats, setStats] = useState({ pendingReviews: 0, approvedToday: 0, rejectedToday: 0, needsInfo: 0 });
  const [recentDocs, setRecentDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [docs, users, farms, orders] = await Promise.all([
          api.asServiceRole.entities.Document.list('-created_date', 100),
          api.asServiceRole.entities.User.list('-created_date', 200),
          api.asServiceRole.entities.Farm.list('-created_date', 200),
          api.asServiceRole.entities.Order.list('-created_date', 200),
        ]);

        setRecentDocs(docs.slice(0, 10));
        const today = new Date().toISOString().slice(0, 10);
        setStats({
          pendingReviews: docs.filter(d => d.status === 'pending').length,
          approvedToday: docs.filter(d => d.status === 'approved' && d.updated_date?.slice(0, 10) === today).length,
          rejectedToday: docs.filter(d => d.status === 'rejected' && d.updated_date?.slice(0, 10) === today).length,
          needsInfo: docs.filter(d => d.status === 'needs_info').length,
        });

        setOverview({
          farmers: users.filter(u => u.account_type === 'farmer').length,
          farms: farms.length,
          pendingVerification: farms.filter(f => f.verification_status !== 'verified' && f.verification_status !== 'rejected').length,
          orders: orders.length,
          revenue: orders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + (o.total || 0), 0),
        });
      } catch (e) {
        console.error(e);
        setError('Could not load the dashboard. Please refresh and try again.');
      }
      finally { setLoading(false); }
    })();
  }, []);

  const overviewCards = [
    { label: 'Farmers', value: overview.farmers, icon: Users, color: 'text-primary bg-primary/10' },
    { label: 'Farms', value: overview.farms, icon: MapPin, color: 'text-blue-600 bg-blue-50' },
    { label: 'Pending Verification', value: overview.pendingVerification, icon: ShieldCheck, color: 'text-orange-600 bg-orange-50' },
    { label: 'Orders', value: overview.orders, icon: ShoppingCart, color: 'text-purple-600 bg-purple-50' },
    { label: 'Revenue', value: formatCurrency(overview.revenue), icon: TrendingUp, color: 'text-green-600 bg-green-50' },
  ];

  const statCards = [
    { label: 'Pending Reviews', value: stats.pendingReviews, icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
    { label: 'Approved Today', value: stats.approvedToday, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
    { label: 'Rejected Today', value: stats.rejectedToday, icon: XCircle, color: 'text-red-600 bg-red-50' },
    { label: 'Needs More Info', value: stats.needsInfo, icon: AlertTriangle, color: 'text-orange-600 bg-orange-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Platform overview and pending verification work.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Platform overview */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {overviewCards.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-xl border border-border bg-card p-4">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="mt-2 font-heading text-xl font-bold sm:text-2xl">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Verification queue */}
      <div>
        <h2 className="font-heading text-base font-semibold">Document verification queue</h2>
        <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-xl border border-border bg-card p-4">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="mt-2 font-heading text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-base font-semibold">Recent document submissions</h2>
          <Link to="/admin/documents"><Button variant="ghost" size="sm">View all</Button></Link>
        </div>
        {loading ? (
          <div className="mt-4 h-32 animate-pulse rounded-lg bg-muted" />
        ) : recentDocs.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No submissions yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {recentDocs.map(doc => (
              <div key={doc.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/30 p-3 text-sm">
                <div>
                  <div className="font-medium">{doc.farmer_name}</div>
                  <div className="text-xs text-muted-foreground">{doc.document_type?.replace('_', ' ')} · {doc.farm_name}</div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  doc.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                  doc.status === 'approved' ? 'bg-green-50 text-green-700' :
                  doc.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'
                }`}>{doc.status?.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <Link to="/admin/farmers"><Button variant="outline" className="w-full"><Users className="mr-2 h-4 w-4" /> Farmers</Button></Link>
        <Link to="/admin/farms"><Button variant="outline" className="w-full"><MapPin className="mr-2 h-4 w-4" /> Farms</Button></Link>
        <Link to="/admin/documents"><Button variant="outline" className="w-full"><FileText className="mr-2 h-4 w-4" /> Documents</Button></Link>
        <Link to="/admin/verification"><Button variant="outline" className="w-full"><ShieldCheck className="mr-2 h-4 w-4" /> Verification</Button></Link>
        <Link to="/admin/products"><Button variant="outline" className="w-full"><Package className="mr-2 h-4 w-4" /> Products</Button></Link>
        <Link to="/admin/orders"><Button variant="outline" className="w-full"><ShoppingCart className="mr-2 h-4 w-4" /> Orders</Button></Link>
      </div>
    </div>
  );
}

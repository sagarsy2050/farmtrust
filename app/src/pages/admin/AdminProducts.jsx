import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { Package, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const loadProducts = async () => {
    try {
      setError(null);
      setProducts(await api.asServiceRole.entities.Product.list('-created_date', 100));
    } catch (e) {
      console.error(e);
      setError('Could not load products. Please try again.');
    }
    finally { setLoading(false); }
  };

  useEffect(() => { loadProducts(); }, []);

  const filtered = products.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.farmer_name?.toLowerCase().includes(search.toLowerCase())
  );

  const unpublish = async (product) => {
    try {
      await api.asServiceRole.entities.Product.update(product.id, { status: 'archived' });
      await loadProducts();
    } catch (e) {
      console.error(e);
      setError('Could not archive this product. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Products</h1>
        <p className="mt-1 text-sm text-muted-foreground">Monitor and moderate product listings.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
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
          <Package className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">No products found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                {p.photo_url ? <img src={p.photo_url} alt={p.name} className="h-full w-full object-cover" /> : <Package className="m-auto mt-3 h-6 w-6 text-muted-foreground" aria-hidden="true" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{p.name}</div>
                <div className="truncate text-xs text-muted-foreground">{p.farmer_name} · {p.farm_name}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-semibold text-primary">{formatCurrency(p.price_per_unit)}/{p.unit}</div>
                <div className="text-xs text-muted-foreground">{p.status}</div>
              </div>
              {p.status === 'published' && <Button size="sm" variant="outline" onClick={() => unpublish(p)}>Archive</Button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

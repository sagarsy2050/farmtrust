import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Search, MapPin, Carrot, Apple, Wheat, Flame, Milk, Star, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VerifiedBadge from '@/components/VerifiedBadge';
import { Image } from '@/components/ui/image';
import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';
import { formatCurrency, formatUnit } from '@/lib/format';

const CATEGORIES = [
  { id: 'vegetables', label: 'Vegetables', icon: Carrot },
  { id: 'fruits', label: 'Fruits', icon: Apple },
  { id: 'grains', label: 'Grains', icon: Wheat },
  { id: 'spices', label: 'Spices', icon: Flame },
  { id: 'dairy', label: 'Dairy', icon: Milk },
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await base44.entities.Product.filter({ status: 'published' }, '-created_date', 48);
        setProducts(data);
      } catch (e) {
        console.error(e);
        setError('Could not load products. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.farmer_name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'all' || p.category === category;
    return matchSearch && matchCat;
  });

  const verifiedFarmers = [...new Set(products.map(p => p.farmer_id))].slice(0, 6);

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified farmers · Mapped farms · Trusted produce
              </span>
              <h1 className="mt-4 font-heading text-4xl font-bold tracking-tight sm:text-5xl">
                Know your farmer.<br/>
                <span className="text-primary">Know where your food comes from.</span>
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Buy directly from verified farmers. Every farm is mapped, every farmer is verified, every harvest is traceable.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="#marketplace"><Button size="lg">Browse marketplace</Button></Link>
                <Link to="/register?as=farmer"><Button size="lg" variant="outline">Become a Farmer</Button></Link>
                <Link to="/how-it-works"><Button size="lg" variant="ghost">How verification works</Button></Link>
              </div>
            </div>
          </div>
        </section>

        {/* Search + Categories */}
        <section id="marketplace" className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <label htmlFor="marketplace-search" className="sr-only">Search products or farmers</label>
              <Input id="marketplace-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products or farmers..." className="pl-9" />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            <button onClick={() => setCategory('all')}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${category === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}>
              All
            </button>
            {CATEGORIES.map(c => {
              const Icon = c.icon;
              return (
                <button key={c.id} onClick={() => setCategory(c.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${category === c.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}>
                  <Icon className="h-3.5 w-3.5" /> {c.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Product grid */}
        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 py-16 text-center text-sm text-destructive">
              <p>{error}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => window.location.reload()}>Refresh</Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center">
              <Sprout className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-muted-foreground">No products found. Try a different search or category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map(p => (
                <Link key={p.id} to={`/product/${p.id}`}
                  className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-lg hover:shadow-primary/5">
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {p.photo_url ? (
                      <Image src={p.photo_url} alt={p.name} fittingType="fill" className="h-full w-full transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground"><Sprout className="h-8 w-8" /></div>
                    )}
                    <span className="absolute left-2 top-2">
                      <VerifiedBadge level={p.farmer_verified ? 'fully_verified' : 'none'} size="sm" />
                    </span>
                  </div>
                  <div className="p-3">
                    <h3 className="font-heading text-sm font-semibold leading-tight line-clamp-2">
                      {p.name}{p.name_local && <span className="ml-1 font-normal text-muted-foreground">({p.name_local})</span>}
                    </h3>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="font-heading text-base font-bold text-primary">{formatCurrency(p.price_per_unit)}</span>
                      <span className="text-xs text-muted-foreground">/{p.unit}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{p.available_quantity} {p.unit} available</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

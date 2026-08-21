import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Image as ImageIcon, Plus, Package, Loader2, Pencil, Archive, PackageX, RotateCcw, TrendingUp } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/format';
import { foodNamesFor } from '@/lib/foodNames';

export default function ProductsManager() {
  const { user: ctxUser } = useOutletContext();
  const { toast } = useToast();
  const [user, setUser] = useState(ctxUser);
  const [farms, setFarms] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [form, setForm] = useState({
    name: '', name_local: '', category: 'vegetables', description: '', price_per_unit: '', available_quantity: '',
    unit: 'kg', minimum_order: 1, harvest_date: '', expected_availability: '',
    pickup_available: true, delivery_available: true, status: 'draft', farm_id: '', photo_url: ''
  });

  useEffect(() => {
    if (!ctxUser) base44.auth.me().then(setUser).catch(() => {});
    else setUser(ctxUser);
  }, [ctxUser]);

  const loadData = React.useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [f, p] = await Promise.all([
        base44.entities.Farm.filter({ farmer_id: user.id }),
        base44.entities.Product.filter({ farmer_id: user.id }, '-created_date'),
      ]);
      setFarms(f); setProducts(p);
    } catch (e) {
      console.error(e);
      setError('Could not load your products.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  // Market-price advisory context for the form — never sets/overwrites
  // price_per_unit, purely informational (spec: market reference != selling price).
  const [marketRef, setMarketRef] = useState(null);
  useEffect(() => {
    if (!showForm || !form.category) { setMarketRef(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await base44.marketPrices.list({ category: form.category });
        const nameLower = (form.name || '').toLowerCase();
        const match = nameLower
          ? res.records.find(r => nameLower.includes(r.commodity.toLowerCase()))
          : res.records[0];
        if (!cancelled) setMarketRef(match || null);
      } catch {
        if (!cancelled) setMarketRef(null);
      }
    })();
    return () => { cancelled = true; };
  }, [showForm, form.category, form.name]);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: '', category: 'vegetables', description: '', price_per_unit: '', available_quantity: '',
      unit: 'kg', minimum_order: 1, harvest_date: '', expected_availability: '',
      pickup_available: true, delivery_available: true, status: 'draft', farm_id: '', photo_url: ''
    });
  };

  const openEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name || '', name_local: product.name_local || '', category: product.category || 'vegetables', description: product.description || '',
      price_per_unit: product.price_per_unit ?? '', available_quantity: product.available_quantity ?? '',
      unit: product.unit || 'kg', minimum_order: product.minimum_order ?? 1,
      harvest_date: product.harvest_date || '', expected_availability: product.expected_availability || '',
      pickup_available: !!product.pickup_available, delivery_available: !!product.delivery_available,
      status: product.status || 'draft', farm_id: product.farm_id || '', photo_url: product.photo_url || ''
    });
    setShowForm(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(prev => ({ ...prev, photo_url: file_url }));
    } catch (err) {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally { setUploadingImage(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    if (!form.farm_id && farms.length > 0) setForm(prev => ({ ...prev, farm_id: farms[0].id }));
    const selectedFarm = farms.find(f => f.id === form.farm_id) || farms[0];
    if (!selectedFarm) { toast({ title: 'Add a farm first', variant: 'destructive' }); return; }

    setSaving(true);
    try {
      const payload = {
        ...form,
        price_per_unit: parseFloat(form.price_per_unit),
        available_quantity: parseFloat(form.available_quantity),
        minimum_order: parseFloat(form.minimum_order) || 1,
        farmer_id: user.id,
        farmer_name: user.full_name,
        farm_id: selectedFarm.id,
        farm_name: selectedFarm.farm_name,
      };
      if (editingId) {
        await base44.entities.Product.update(editingId, payload);
        toast({ title: 'Product updated', description: 'Your changes have been saved.' });
      } else {
        await base44.entities.Product.create(payload);
        toast({ title: 'Product added', description: 'Your product has been created.' });
      }
      resetForm();
      setShowForm(false);
      await loadData();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const setStatus = async (product, status) => {
    try {
      await base44.entities.Product.update(product.id, { status });
      await loadData();
      toast({ title: `Product ${status.replace('_', ' ')}` });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your farm produce and listings.</p>
        </div>
        <Button onClick={() => { if (showForm) { resetForm(); setShowForm(false); } else { resetForm(); setShowForm(true); } }}>
          <Plus className="mr-1 h-4 w-4" /> Add Product
        </Button>
      </div>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={loadData}>Retry</Button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-heading text-base font-semibold">{editingId ? 'Edit product' : 'Add product'}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Product name *</Label>
              <Input id="name" required list="food-name-suggestions" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              {/* Suggestions from a ~1000-name reference vocabulary, filtered to the
                  selected category — free text is still accepted, this only assists. */}
              <datalist id="food-name-suggestions">
                {foodNamesFor(form.category).map(n => <option key={n} value={n} />)}
              </datalist>
            </div>
            <div>
              <Label htmlFor="name_local">Local / regional name (optional)</Label>
              <Input id="name_local" placeholder="e.g. टमाटर" value={form.name_local} onChange={e => setForm({...form, name_local: e.target.value})} />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                <SelectTrigger id="category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vegetables">Vegetables</SelectItem>
                  <SelectItem value="fruits">Fruits</SelectItem>
                  <SelectItem value="grains">Grains</SelectItem>
                  <SelectItem value="spices">Spices</SelectItem>
                  <SelectItem value="dairy">Dairy</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="farm">Farm</Label>
              <Select value={form.farm_id} onValueChange={v => setForm({...form, farm_id: v})}>
                <SelectTrigger id="farm"><SelectValue placeholder="Select farm" /></SelectTrigger>
                <SelectContent>{farms.map(f => <SelectItem key={f.id} value={f.id}>{f.farm_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="price">Price per unit (₹) *</Label>
              <Input id="price" type="number" step="0.01" required value={form.price_per_unit} onChange={e => setForm({...form, price_per_unit: e.target.value})} />
              {marketRef && (
                <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="mt-0.5 h-3 w-3 shrink-0 text-primary" aria-hidden="true" />
                  <span>
                    Market reference for {marketRef.commodity}: {formatCurrency(marketRef.minPriceKg)}–{formatCurrency(marketRef.maxPriceKg)}/kg
                    (modal {formatCurrency(marketRef.modalPriceKg)}, {marketRef.market}). Advisory only — does not set your price.
                  </span>
                </p>
              )}
            </div>
            <div><Label htmlFor="qty">Available quantity *</Label><Input id="qty" type="number" step="0.01" required value={form.available_quantity} onChange={e => setForm({...form, available_quantity: e.target.value})} /></div>
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Select value={form.unit} onValueChange={v => setForm({...form, unit: v})}>
                <SelectTrigger id="unit"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem><SelectItem value="litre">litre</SelectItem>
                  <SelectItem value="dozen">dozen</SelectItem><SelectItem value="piece">piece</SelectItem>
                  <SelectItem value="quintal">quintal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label htmlFor="min_order">Minimum order</Label><Input id="min_order" type="number" value={form.minimum_order} onChange={e => setForm({...form, minimum_order: e.target.value})} /></div>
            <div><Label htmlFor="harvest">Harvest date</Label><Input id="harvest" type="date" value={form.harvest_date} onChange={e => setForm({...form, harvest_date: e.target.value})} /></div>
            <div className="sm:col-span-2"><Label htmlFor="desc">Description</Label><Input id="desc" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div className="sm:col-span-2">
              <Label htmlFor="photo">Product photo</Label>
              <div className="flex items-center gap-3">
                <Input id="photo" type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                {uploadingImage && <Loader2 className="h-4 w-4 animate-spin" />}
                {form.photo_url && <img src={form.photo_url} className="h-10 w-10 rounded-lg object-cover" />}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.pickup_available} onCheckedChange={v => setForm({...form, pickup_available: v})} /> Pickup available
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.delivery_available} onCheckedChange={v => setForm({...form, delivery_available: v})} /> Delivery available
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : editingId ? 'Save changes' : 'Save product'}</Button>
            <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">No products yet. Add your first product.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.map(p => (
            <div key={p.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {p.photo_url ? <img src={p.photo_url} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center"><ImageIcon className="h-6 w-6 text-muted-foreground" /></div>}
                </div>
                <div className="flex-1">
                  <h3 className="font-heading text-sm font-semibold">{p.name}</h3>
                  <p className="text-xs text-muted-foreground">{formatCurrency(p.price_per_unit)}/{p.unit}</p>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                    p.status === 'published' ? 'bg-green-50 text-green-700' :
                    p.status === 'sold_out' ? 'bg-orange-50 text-orange-700' :
                    p.status === 'archived' ? 'bg-muted text-muted-foreground' : 'bg-yellow-50 text-yellow-700'
                  }`}>
                    {p.status?.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">{p.available_quantity} {p.unit} available</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                  <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                </Button>
                {p.status !== 'archived' && (
                  <Button variant="outline" size="sm" onClick={() => setStatus(p, p.status === 'published' ? 'draft' : 'published')}>
                    {p.status === 'published' ? 'Unpublish' : 'Publish'}
                  </Button>
                )}
                {(p.status === 'published' || p.status === 'sold_out') && (
                  <Button variant="outline" size="sm" onClick={() => setStatus(p, p.status === 'sold_out' ? 'published' : 'sold_out')}>
                    {p.status === 'sold_out' ? <><RotateCcw className="mr-1 h-3.5 w-3.5" /> Back in stock</> : <><PackageX className="mr-1 h-3.5 w-3.5" /> Sold out</>}
                  </Button>
                )}
                {p.status !== 'archived' ? (
                  <Button variant="outline" size="sm" onClick={() => setStatus(p, 'archived')}>
                    <Archive className="mr-1 h-3.5 w-3.5" /> Archive
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setStatus(p, 'draft')}>
                    <RotateCcw className="mr-1 h-3.5 w-3.5" /> Restore
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

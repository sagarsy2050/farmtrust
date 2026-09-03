import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import FarmBoundaryMap from '@/components/FarmBoundaryMap';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FarmEditor() {
  const { id } = useParams();
  const { user: ctxUser } = useOutletContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState(ctxUser);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    farm_name: '', village: '', district: '', state: '', country: 'India',
    declared_area_hectares: '', crops: '', farming_methods: '',
  });
  const [boundary, setBoundary] = useState([]);
  const [area, setArea] = useState(0);
  const [center, setCenter] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [loadingFarm, setLoadingFarm] = useState(!!id);

  useEffect(() => {
    if (!ctxUser) api.auth.me().then(setUser).catch(() => {});
    else setUser(ctxUser);
  }, [ctxUser]);

  const loadFarm = React.useCallback(async () => {
    if (!id) return;
    setLoadingFarm(true);
    setLoadError(null);
    try {
      const farm = await api.entities.Farm.get(id);
      setForm({
        farm_name: farm.farm_name || '', village: farm.village || '', district: farm.district || '',
        state: farm.state || '', country: farm.country || 'India',
        declared_area_hectares: farm.declared_area_hectares || '',
        crops: farm.crops?.join(', ') || '', farming_methods: farm.farming_methods || '',
      });
      setBoundary(farm.boundary || []);
      setArea(farm.calculated_area_hectares || 0);
      setCenter(farm.center_lat ? { lat: farm.center_lat, lng: farm.center_lng } : null);
    } catch (e) {
      console.error(e);
      setLoadError('Could not load this farm.');
    } finally {
      setLoadingFarm(false);
    }
  }, [id]);

  useEffect(() => { loadFarm(); }, [loadFarm]);

  const handleSave = (data) => {
    setBoundary(data.boundary);
    setArea(data.calculated_area_hectares);
    setCenter({ lat: data.center_lat, lng: data.center_lng });
    toast({ title: 'Boundary saved', description: `${data.calculated_area_hectares.toFixed(2)} hectares` });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    try {
      const farmData = {
        ...form,
        farmer_id: user.id,
        farmer_name: user.full_name,
        declared_area_hectares: parseFloat(form.declared_area_hectares) || area,
        calculated_area_hectares: area,
        boundary,
        center_lat: center?.lat,
        center_lng: center?.lng,
        crops: form.crops.split(',').map(s => s.trim()).filter(Boolean),
        verification_status: id ? undefined : 'location_submitted',
      };

      if (id) {
        await api.entities.Farm.update(id, farmData);
      } else {
        await api.entities.Farm.create(farmData);
      }

      toast({ title: 'Farm saved', description: 'Your farm has been saved.' });
      navigate('/farmer/farms');
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/farmer/farms" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to farms
      </Link>
      <h1 className="font-heading text-2xl font-bold">{id ? 'Edit Farm' : 'Add Farm'}</h1>

      {loadError && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 shrink-0" /> {loadError}</span>
          <Button size="sm" variant="outline" onClick={loadFarm}>Retry</Button>
        </div>
      )}

      {loadingFarm ? (
        <div className="space-y-3">
          <div className="h-48 animate-pulse rounded-2xl bg-muted" />
          <div className="h-64 animate-pulse rounded-2xl bg-muted" />
        </div>
      ) : (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-heading text-base font-semibold">Farm details</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div><Label htmlFor="farm_name">Farm name *</Label><Input id="farm_name" required value={form.farm_name} onChange={e => setForm({...form, farm_name: e.target.value})} /></div>
            <div><Label htmlFor="village">Village / Town</Label><Input id="village" value={form.village} onChange={e => setForm({...form, village: e.target.value})} /></div>
            <div><Label htmlFor="district">District</Label><Input id="district" value={form.district} onChange={e => setForm({...form, district: e.target.value})} /></div>
            <div><Label htmlFor="state">State</Label><Input id="state" value={form.state} onChange={e => setForm({...form, state: e.target.value})} /></div>
            <div><Label htmlFor="declared_area">Declared area (hectares)</Label><Input id="declared_area" type="number" step="0.01" value={form.declared_area_hectares} onChange={e => setForm({...form, declared_area_hectares: e.target.value})} /></div>
            <div><Label htmlFor="crops">Crops (comma separated)</Label><Input id="crops" placeholder="Mango, Wheat, Vegetables" value={form.crops} onChange={e => setForm({...form, crops: e.target.value})} /></div>
            <div className="sm:col-span-2"><Label htmlFor="methods">Farming methods</Label><Input id="methods" placeholder="Traditional + drip irrigation" value={form.farming_methods} onChange={e => setForm({...form, farming_methods: e.target.value})} /></div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-heading text-base font-semibold">Farm boundary</h2>
          <p className="mt-1 text-sm text-muted-foreground">Mark your farm boundary on the map. Click to drop points around your farm.</p>
          <div className="mt-4">
            <FarmBoundaryMap
              initialBoundary={boundary}
              initialCenter={center}
              onSave={handleSave}
            />
          </div>
        </div>

        <Button type="submit" size="lg" disabled={saving}>
          {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save farm'}
        </Button>
      </form>
      )}
    </div>
  );
}

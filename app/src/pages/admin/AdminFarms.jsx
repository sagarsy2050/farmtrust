import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { MapPin, Search } from 'lucide-react';
import VerifiedBadge from '@/components/VerifiedBadge';
import { Button } from '@/components/ui/button';

export default function AdminFarms() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const loadFarms = async () => {
    try {
      setError(null);
      setFarms(await api.asServiceRole.entities.Farm.list('-created_date', 100));
    } catch (e) {
      console.error(e);
      setError('Could not load farms. Please try again.');
    }
    finally { setLoading(false); }
  };

  useEffect(() => { loadFarms(); }, []);

  const filtered = farms.filter(f =>
    !search || f.farm_name?.toLowerCase().includes(search.toLowerCase()) || f.farmer_name?.toLowerCase().includes(search.toLowerCase())
  );

  const updateStatus = async (farm, status) => {
    try {
      await api.asServiceRole.entities.Farm.update(farm.id, { verification_status: status });
      await loadFarms();
    } catch (e) {
      console.error(e);
      setError('Could not update this farm. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Farms</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review farm boundaries and verification.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search farms..."
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
          <MapPin className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">No farms found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(farm => (
            <div key={farm.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-base font-semibold">{farm.farm_name}</h3>
                    <VerifiedBadge level={farm.verification_status === 'verified' ? 'fully_verified' : 'none'} size="sm" />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{farm.farmer_name} · {farm.village}, {farm.state}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>Area: {(farm.calculated_area_hectares || farm.declared_area_hectares)?.toFixed(2)} ha</span>
                    <span>Boundary points: {farm.boundary?.length || 0}</span>
                    {farm.crops?.length > 0 && <span>Crops: {farm.crops.join(', ')}</span>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  {farm.verification_status !== 'verified' && (
                    <Button size="sm" onClick={() => updateStatus(farm, 'verified')}>Approve</Button>
                  )}
                  {farm.verification_status !== 'rejected' && (
                    <Button size="sm" variant="destructive" onClick={() => updateStatus(farm, 'rejected')}>Reject</Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

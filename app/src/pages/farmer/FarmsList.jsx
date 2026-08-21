import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Plus, MapPin, Ruler, Leaf } from 'lucide-react';
import VerifiedBadge from '@/components/VerifiedBadge';
import { Link } from 'react-router-dom';

export default function FarmsList() {
  const { user: ctxUser } = useOutletContext();
  const [user, setUser] = useState(ctxUser);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ctxUser) base44.auth.me().then(setUser).catch(() => {});
    else setUser(ctxUser);
  }, [ctxUser]);

  const loadFarms = React.useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try { setFarms(await base44.entities.Farm.filter({ farmer_id: user.id }, '-created_date')); }
    catch (e) { console.error(e); setError('Could not load your farms.'); }
    finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { loadFarms(); }, [loadFarms]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">My Farms</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your farm boundaries and details.</p>
        </div>
        <Link to="/farmer/farms/new"><Button><Plus className="mr-1 h-4 w-4" /> Add Farm</Button></Link>
      </div>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={loadFarms}>Retry</Button>
        </div>
      )}

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      ) : farms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <MapPin className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">No farms yet. Add your first farm to get started.</p>
          <Link to="/farmer/farms/new" className="mt-4 inline-block"><Button>Add Farm</Button></Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {farms.map(farm => (
            <div key={farm.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-heading text-base font-semibold">{farm.farm_name}</h3>
                  <p className="text-sm text-muted-foreground">{farm.village}, {farm.state}</p>
                </div>
                <VerifiedBadge level={farm.verification_status === 'verified' ? 'fully_verified' : 'none'} size="sm" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Area</div>
                  <div className="font-semibold">{(farm.calculated_area_hectares || farm.declared_area_hectares)?.toFixed(2)} ha</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div className="font-semibold capitalize">{farm.verification_status?.replace('_', ' ')}</div>
                </div>
              </div>
              {farm.crops?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {farm.crops.map((c, i) => (
                    <span key={i} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{c}</span>
                  ))}
                </div>
              )}
              <Link to={`/farmer/farms/${farm.id}`}><Button variant="outline" size="sm" className="mt-4 w-full">Edit farm</Button></Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

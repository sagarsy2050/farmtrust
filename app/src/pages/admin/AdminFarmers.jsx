import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Users, ShieldCheck, Search } from 'lucide-react';
import VerifiedBadge from '@/components/VerifiedBadge';

export default function AdminFarmers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const loadUsers = async () => {
    try {
      setError(null);
      setUsers(await api.asServiceRole.entities.User.list('-created_date', 100));
    } catch (e) {
      console.error(e);
      setError('Could not load farmers. Please try again.');
    }
    finally { setLoading(false); }
  };

  useEffect(() => { loadUsers(); }, []);

  const filtered = users.filter(u =>
    !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  // verification_level now advances on its own as documents get approved
  // and a farm boundary gets drawn (see server/src/verification/compute.js).
  // This button is a manual override for edge cases (e.g. verified outside
  // the app) - use it to force fully_verified or force back to none. A
  // later document review or boundary edit will recompute and can move the
  // level again, overriding a manual override that no longer matches reality.
  const toggleVerified = async (user) => {
    const newLevel = user.verified_farmer ? 'none' : 'fully_verified';
    try {
      await api.asServiceRole.entities.User.update(user.id, {
        verified_farmer: !user.verified_farmer,
        verification_level: newLevel
      });
      await loadUsers();
    } catch (e) {
      console.error(e);
      setError('Could not update this farmer. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Farmers</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage farmer accounts and verification.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search farmers..."
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
          <Users className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">No farmers found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(u => (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                  {u.full_name?.[0]?.toUpperCase() || 'F'}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-medium">{u.full_name}</div>
                  <div className="truncate text-xs text-muted-foreground">{u.email} · {u.phone || 'No phone'}</div>
                  <div className="truncate text-xs text-muted-foreground">{u.village}, {u.state}</div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <VerifiedBadge level={u.verification_level || 'none'} size="sm" />
                <Button size="sm" variant={u.verified_farmer ? 'outline' : 'default'} onClick={() => toggleVerified(u)}
                  title="Manual override - normally verification_level advances automatically as documents are approved and a farm boundary is drawn.">
                  <ShieldCheck className="mr-1 h-4 w-4" />
                  {u.verified_farmer ? 'Force revoke' : 'Force fully verify'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

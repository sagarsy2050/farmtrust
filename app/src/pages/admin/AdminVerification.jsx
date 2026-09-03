import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { ShieldCheck, Search, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function AdminVerification() {
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setChecks(await api.asServiceRole.entities.VerificationCheck.list('-created_date', 100));
      } catch (e) {
        console.error(e);
        setError('Could not load verification checks. Please try again.');
      }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = checks.filter(c =>
    !search || c.farmer_name?.toLowerCase().includes(search.toLowerCase())
  );

  const resultIcons = {
    pass: <CheckCircle className="h-4 w-4 text-green-600" />,
    fail: <XCircle className="h-4 w-4 text-red-600" />,
    flag: <Clock className="h-4 w-4 text-orange-600" />,
    pending: <Clock className="h-4 w-4 text-yellow-600" />,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Verification Checks</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review verification check results and flagged cases.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by farmer..."
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
          <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">No verification checks found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-4">
              <div className="flex min-w-0 items-center gap-3">
                {resultIcons[c.result] || resultIcons.pending}
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{c.farmer_name}</div>
                  <div className="truncate text-xs text-muted-foreground">{c.check_type?.replace('_', ' ')} · {c.farm_name || '—'}</div>
                  {c.flagged_issues?.length > 0 && (
                    <div className="mt-1 text-xs text-orange-600">Flags: {c.flagged_issues.join(', ')}</div>
                  )}
                </div>
              </div>
              <span className="shrink-0 text-xs font-medium capitalize text-muted-foreground">{c.result}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

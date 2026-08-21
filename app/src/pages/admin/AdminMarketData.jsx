import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { TrendingUp, RefreshCw, Loader2, MapPin, Package } from 'lucide-react';
import { formatDate } from '@/lib/format';

export default function AdminMarketData() {
  const { toast } = useToast();
  const [status, setStatus] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, m] = await Promise.all([base44.marketPrices.adminStatus(), base44.marketPrices.meta()]);
      setStatus(s);
      setMeta(m);
    } catch (e) {
      console.error(e);
      setError('Could not load market data status.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const runSync = async () => {
    setSyncing(true);
    try {
      const res = await base44.marketPrices.adminSync();
      toast({ title: res.mode === 'local-seed' ? 'No live source configured' : 'Sync complete', description: res.message });
      await load();
    } catch (e) {
      toast({ title: 'Sync failed', description: e.message, variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-muted" />;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
        <p>{error}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={load}>Retry</Button>
      </div>
    );
  }

  const cards = [
    { label: 'Source', value: status.sourceStatus === 'local-seed' ? 'Local sample data' : 'Not implemented' },
    { label: 'Last sync', value: status.lastSync ? formatDate(status.lastSync) : '—' },
    { label: 'Records', value: status.recordCount },
    { label: 'Published', value: status.publishedCount },
    { label: 'Quarantined', value: status.quarantinedCount },
    { label: 'Stale', value: status.staleCount },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold"><TrendingUp className="h-5 w-5 text-primary" /> Market Data</h1>
          <p className="mt-1 text-sm text-muted-foreground">Live Market Prices source status and coverage.</p>
        </div>
        <Button onClick={runSync} disabled={syncing}>
          {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Run Sync
        </Button>
      </div>

      <div
        className={`rounded-xl border p-4 text-sm ${status.sourceConfigured ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/30'}`}
      >
        {status.sourceConfigured
          ? 'AGMARKNET_API_KEY is set, but live ingestion is not implemented yet — see server/src/market/ingest.js.'
          : 'No external market-data source configured. Serving local sample data (AGMARKNET_API_KEY unset). This is expected in a local-only setup.'}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        {cards.map(c => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground">{c.label}</div>
            <div className="mt-1 font-heading text-lg font-bold">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 font-heading text-base font-semibold"><MapPin className="h-4 w-4 text-primary" /> Markets by city</h2>
          {!meta?.cityRegions?.length ? (
            <p className="mt-3 text-sm text-muted-foreground">No markets found.</p>
          ) : (
            <div className="mt-3 space-y-2 text-sm">
              {meta.cityRegions.map(city => (
                <div key={city} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/30 p-2">
                  <span className="font-medium">{city}</span>
                  <span className="text-xs text-muted-foreground">{(meta.marketsByCity[city] || []).join(', ')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 font-heading text-base font-semibold"><Package className="h-4 w-4 text-primary" /> Commodities by category</h2>
          {!meta?.categories?.length ? (
            <p className="mt-3 text-sm text-muted-foreground">No commodities found.</p>
          ) : (
            <div className="mt-3 space-y-2 text-sm">
              {meta.categories.map(cat => (
                <div key={cat} className="rounded-lg bg-muted/30 p-2">
                  <span className="font-medium capitalize">{cat}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{(meta.commoditiesByCategory[cat] || []).join(', ') || '—'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

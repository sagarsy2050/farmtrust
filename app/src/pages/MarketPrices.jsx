import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, MapPin, Info, ChevronDown } from 'lucide-react';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';
import { formatCurrency, formatDate } from '@/lib/format';

const CATEGORY_LABELS = {
  vegetables: 'Vegetables', fruits: 'Fruits', grains: 'Grains', spices: 'Spices', dairy: 'Dairy',
};

function money(v) {
  return v == null ? '—' : formatCurrency(v);
}

export default function MarketPrices() {
  const [meta, setMeta] = useState(null);
  const [metaError, setMetaError] = useState(null);
  const [cityRegion, setCityRegion] = useState('');
  const [category, setCategory] = useState('');
  const [commodity, setCommodity] = useState('');
  const [market, setMarket] = useState('all');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [historyFor, setHistoryFor] = useState(null); // record being viewed
  const [historyDays, setHistoryDays] = useState(7);
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadMeta = React.useCallback(async () => {
    setMetaError(null);
    try {
      const m = await api.marketPrices.meta();
      setMeta(m);
      if (!cityRegion && m.cityRegions.length) setCityRegion(m.cityRegions[0]);
    } catch (e) {
      console.error(e);
      setMetaError('Could not load market filters. Please refresh the page.');
    }
     
  }, []);

  useEffect(() => { loadMeta(); }, [loadMeta]);

  const loadPrices = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {};
      if (cityRegion) filters.city_region = cityRegion;
      if (category) filters.category = category;
      if (commodity) filters.commodity = commodity;
      if (market && market !== 'all') filters.market = market;
      const res = await api.marketPrices.list(filters);
      setData(res);
    } catch (e) {
      console.error(e);
      setError('Could not load market prices. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, [cityRegion, category, commodity, market]);

  useEffect(() => { if (meta) loadPrices(); }, [meta, loadPrices]);

  const commodityOptions = useMemo(() => {
    if (!meta) return [];
    if (category) return meta.commoditiesByCategory[category] || [];
    return Object.values(meta.commoditiesByCategory).flat();
  }, [meta, category]);

  const marketOptions = useMemo(() => {
    if (!meta || !cityRegion) return [];
    return meta.marketsByCity[cityRegion] || [];
  }, [meta, cityRegion]);

  const openHistory = async (record) => {
    setHistoryFor(record);
    setHistoryDays(7);
    setHistoryLoading(true);
    try {
      const h = await api.marketPrices.history({ commodity: record.commodity, city_region: record.cityRegion, market: record.market, days: 7 });
      setHistory(h);
    } catch (e) {
      console.error(e);
      setHistory(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  const changeHistoryDays = async (days) => {
    setHistoryDays(days);
    if (!historyFor) return;
    setHistoryLoading(true);
    try {
      const h = await api.marketPrices.history({ commodity: historyFor.commodity, city_region: historyFor.cityRegion, market: historyFor.market, days });
      setHistory(h);
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" aria-hidden="true" />
            <h1 className="font-heading text-2xl font-bold sm:text-3xl">Live Market Prices</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Latest available market reference prices by city and commodity. This is a market reference,
            not a guaranteed FarmTrust selling price.
          </p>

          {metaError ? (
            <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
              <p>{metaError}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={loadMeta}>Retry</Button>
            </div>
          ) : (
            <>
              {/* Filters */}
              <div className="mt-5 grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground" htmlFor="mp-city">City / Region</label>
                  <Select value={cityRegion} onValueChange={setCityRegion}>
                    <SelectTrigger id="mp-city"><SelectValue placeholder="Select city" /></SelectTrigger>
                    <SelectContent>
                      {(meta?.cityRegions || []).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground" htmlFor="mp-category">Category</label>
                  <Select value={category || 'all'} onValueChange={v => { setCategory(v === 'all' ? '' : v); setCommodity(''); }}>
                    <SelectTrigger id="mp-category"><SelectValue placeholder="All categories" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {(meta ? Object.keys(meta.commoditiesByCategory) : []).map(c => (
                        <SelectItem key={c} value={c}>{CATEGORY_LABELS[c] || c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground" htmlFor="mp-commodity">Commodity</label>
                  <Select value={commodity || 'all'} onValueChange={v => setCommodity(v === 'all' ? '' : v)}>
                    <SelectTrigger id="mp-commodity"><SelectValue placeholder="All commodities" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All commodities</SelectItem>
                      {commodityOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground" htmlFor="mp-market">Market / Mandi</label>
                  <Select value={market} onValueChange={setMarket}>
                    <SelectTrigger id="mp-market"><SelectValue placeholder="All markets" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All markets</SelectItem>
                      {marketOptions.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {data?.lastUpdated && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Last updated: {formatDate(data.lastUpdated)} · Source: {data.source}
                </p>
              )}

              {/* Results */}
              <div className="mt-5">
                {loading ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />)}
                  </div>
                ) : error ? (
                  <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
                    <p>{error}</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={loadPrices}>Retry</Button>
                  </div>
                ) : !data?.records?.length ? (
                  <div className="rounded-2xl border border-dashed border-border py-16 text-center">
                    <TrendingUp className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden="true" />
                    <p className="mt-3 text-muted-foreground">No market price is available for this selection.</p>
                    <p className="mt-1 text-xs text-muted-foreground">Try a different market, commodity, or city.</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {data.records.map(r => (
                      <div key={r.id} className="rounded-2xl border border-border bg-card p-4">
                        <div className="flex items-start gap-3">
                          {r.imageUrl && (
                            <img
                              src={r.imageUrl}
                              alt={r.commodity}
                              loading="lazy"
                              className="h-14 w-14 shrink-0 rounded-lg object-cover"
                              onError={e => { e.currentTarget.style.display = 'none'; }}
                            />
                          )}
                          <div className="flex flex-1 items-start justify-between gap-2">
                            <div>
                              <h3 className="font-heading text-base font-semibold">{r.commodity}</h3>
                              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" aria-hidden="true" /> {r.market}, {r.cityRegion}
                              </p>
                            </div>
                            {r.variety && <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{r.variety}</span>}
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="rounded-lg bg-muted/50 p-2">
                            <div className="text-muted-foreground">Min</div>
                            <div className="font-semibold">{money(r.minPriceKg)}</div>
                          </div>
                          <div className="rounded-lg bg-primary/10 p-2">
                            <div className="text-muted-foreground">Modal</div>
                            <div className="font-bold text-primary">{money(r.modalPriceKg)}</div>
                          </div>
                          <div className="rounded-lg bg-muted/50 p-2">
                            <div className="text-muted-foreground">Max</div>
                            <div className="font-semibold">{money(r.maxPriceKg)}</div>
                          </div>
                        </div>

                        {r.arrivalQuantity != null && (
                          <p className="mt-2 text-xs text-muted-foreground">Arrival: {r.arrivalQuantity} {r.arrivalUnit}</p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">Updated: {formatDate(r.sourceDate)}</p>

                        <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => openHistory(r)}>
                          View Price History
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-start gap-2 rounded-xl bg-muted/50 p-4 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                Prices shown are the latest available market reference values, normalized to ₹/kg. They are supporting
                market context, not a guaranteed FarmTrust selling price or a real-time feed.
              </div>
            </>
          )}
        </div>

        {historyFor && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={() => setHistoryFor(null)}>
            <div
              className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-card p-5 sm:rounded-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {historyFor.imageUrl && (
                    <img src={historyFor.imageUrl} alt={historyFor.commodity} loading="lazy" className="h-10 w-10 rounded-lg object-cover" />
                  )}
                  <h2 className="font-heading text-lg font-semibold">{historyFor.commodity} · {historyFor.market}</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setHistoryFor(null)} aria-label="Close">
                  <ChevronDown className="h-5 w-5" aria-hidden="true" />
                </Button>
              </div>

              <div className="mt-3 flex gap-2">
                {[7, 30, 90].map(d => (
                  <button
                    key={d}
                    onClick={() => changeHistoryDays(d)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${historyDays === d ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}
                  >
                    {d} days
                  </button>
                ))}
              </div>

              <div className="mt-4">
                {historyLoading ? (
                  <div className="h-64 animate-pulse rounded-xl bg-muted" />
                ) : !history?.series?.length ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No history available for this selection.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={history.series}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={v => formatCurrency(v)} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="minPriceKg" name="Min" stroke="#94a3b8" strokeWidth={1.5} dot={false} />
                      <Line type="monotone" dataKey="modalPriceKg" name="Modal" stroke="#15803d" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="maxPriceKg" name="Max" stroke="#eab308" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Sample historical trend for demonstration — not live AGMARKNET data.
              </p>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Sprout, ShoppingCart, Minus, Plus, TrendingUp } from 'lucide-react';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import VerifiedBadge from '@/components/VerifiedBadge';
import ReviewStars from '@/components/ReviewStars';
import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';
import { useCart } from '@/lib/cartContext';
import { formatCurrency, formatDate } from '@/lib/format';
import { useToast } from '@/components/ui/use-toast';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [farm, setFarm] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [marketRef, setMarketRef] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const p = await api.entities.Product.get(id);
        setProduct(p);
        if (p.farm_id) {
          try { setFarm(await api.entities.Farm.get(p.farm_id)); } catch {}
        }
        try { setReviews(await api.entities.Review.filter({ product_id: id }, '-created_date')); } catch {}
        // Market reference is advisory context only — never overwrites the
        // farmer's configured selling price. Simple name/commodity match.
        try {
          const res = await api.marketPrices.list({ category: p.category });
          const nameLower = p.name.toLowerCase();
          const match = res.records.find(r => nameLower.includes(r.commodity.toLowerCase()));
          if (match) setMarketRef(match);
        } catch {}
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + (r.overall_rating || 0), 0) / reviews.length
    : 0;

  const handleAdd = () => {
    addItem(product, qty);
    toast({ title: 'Added to cart', description: `${qty} ${product.unit} of ${product.name}` });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <PublicNavbar />
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col">
        <PublicNavbar />
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <Sprout className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-3 text-lg font-semibold">Product not found</h2>
          <Link to="/" className="mt-4 inline-block"><Button variant="outline">Back to marketplace</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to marketplace
          </Link>

          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-border bg-muted">
              {product.photo_url ? (
                <Image src={product.photo_url} alt={product.name} fittingType="fill" className="aspect-square w-full" />
              ) : (
                <div className="flex aspect-square w-full items-center justify-center text-muted-foreground"><Sprout className="h-12 w-12" /></div>
              )}
            </div>

            <div className="flex flex-col">
              <VerifiedBadge level={product.farmer_verified ? 'fully_verified' : 'none'} />
              <h1 className="mt-2 font-heading text-2xl font-bold sm:text-3xl">
                {product.name}
                {product.name_local && <span className="ml-2 text-lg font-normal text-muted-foreground">({product.name_local})</span>}
              </h1>
              <Link to={`/farm/${product.farm_id}`} className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline">
                <MapPin className="h-3.5 w-3.5" /> {product.farm_name} by {product.farmer_name}
              </Link>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-heading text-3xl font-bold text-primary">{formatCurrency(product.price_per_unit, product.currency)}</span>
                <span className="text-muted-foreground">/{product.unit}</span>
              </div>

              {reviews.length > 0 && (
                <a href="#reviews" className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                  <ReviewStars value={avgRating} size="sm" />
                  <span>{avgRating.toFixed(1)} ({reviews.length} review{reviews.length === 1 ? '' : 's'})</span>
                </a>
              )}

              {marketRef && (
                <div className="mt-2 flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                  <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <span className="font-medium text-foreground">Market Reference: {formatCurrency(marketRef.modalPriceKg)}/kg</span>
                    {' '}({marketRef.market}, {marketRef.cityRegion} · updated {formatDate(marketRef.sourceDate)})
                    <div>Range: {formatCurrency(marketRef.minPriceKg)}–{formatCurrency(marketRef.maxPriceKg)}/kg. Reference only, not the FarmTrust selling price.</div>
                  </div>
                </div>
              )}

              {product.description && (
                <p className="mt-4 text-sm text-muted-foreground">{product.description}</p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="text-xs text-muted-foreground">Available</div>
                  <div className="font-semibold">{product.available_quantity} {product.unit}</div>
                </div>
                {product.harvest_date && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <div className="text-xs text-muted-foreground">Harvest</div>
                    <div className="font-semibold">{formatDate(product.harvest_date)}</div>
                  </div>
                )}
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="text-xs text-muted-foreground">Min order</div>
                  <div className="font-semibold">{product.minimum_order} {product.unit}</div>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="text-xs text-muted-foreground">Delivery</div>
                  <div className="font-semibold">{product.delivery_available ? 'Yes' : 'No'} · {product.pickup_available ? 'Pickup' : ''}</div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="flex items-center rounded-lg border border-border">
                  <button
                    onClick={() => setQty(Math.max(product.minimum_order || 1, qty - 1))}
                    className="flex h-11 w-11 items-center justify-center hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <span className="w-12 text-center font-semibold" aria-live="polite">{qty}</span>
                  <button
                    onClick={() => setQty(Math.min(product.available_quantity, qty + 1))}
                    className="flex h-11 w-11 items-center justify-center hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <Button onClick={handleAdd} size="lg" className="flex-1 sm:flex-none">
                  <ShoppingCart className="mr-2 h-4 w-4" aria-hidden="true" /> Add to cart
                </Button>
              </div>
            </div>
          </div>

          {farm && (
            <div className="mt-8 rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-semibold">Farm details</h2>
                <Link to={`/farm/${farm.id}`}><Button variant="outline" size="sm">See the farm</Button></Link>
              </div>
              <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <div className="text-xs text-muted-foreground">Location</div>
                  <div className="font-semibold">{farm.village}, {farm.state}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Area</div>
                  <div className="font-semibold">{farm.calculated_area_hectares?.toFixed(2) || farm.declared_area_hectares?.toFixed(2)} hectares</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Crops</div>
                  <div className="font-semibold">{farm.crops?.join(', ') || '—'}</div>
                </div>
              </div>
            </div>
          )}

          <div id="reviews" className="mt-8 scroll-mt-20 rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold">Reviews</h2>
              {reviews.length > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <ReviewStars value={avgRating} size="sm" />
                  <span>{avgRating.toFixed(1)} ({reviews.length})</span>
                </div>
              )}
            </div>
            {reviews.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No reviews yet for this product.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {reviews.map(r => (
                  <div key={r.id} className="rounded-lg bg-muted/30 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{r.customer_name || 'Verified buyer'}</span>
                      <ReviewStars value={r.overall_rating} size="sm" />
                    </div>
                    {r.comment && <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sprout, MapPin, Ruler, Leaf, Calendar, ShieldCheck, Navigation } from 'lucide-react';
import VerifiedBadge from '@/components/VerifiedBadge';
import ReviewStars from '@/components/ReviewStars';
import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';
import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';

export default function FarmDetail({ farm, reviews = [], loading }) {
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

  if (!farm) {
    return (
      <div className="flex min-h-screen flex-col">
        <PublicNavbar />
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <Sprout className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-3 text-lg font-semibold">Farm not found</h2>
          <Link to="/" className="mt-4 inline-block"><Button variant="outline">Back to marketplace</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isVerified = farm.verification_status === 'verified';
  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + (r.overall_rating || 0), 0) / reviews.length
    : 0;
  const center = farm.boundary && farm.boundary.length > 0
    ? farm.boundary[0]
    : { lat: farm.center_lat, lng: farm.center_lng };

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-2xl font-bold sm:text-3xl">{farm.farm_name}</h1>
            <VerifiedBadge level={isVerified ? 'fully_verified' : 'none'} />
          </div>
          <p className="mt-1 text-muted-foreground">by {farm.farmer_name}</p>
          {reviews.length > 0 && (
            <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <ReviewStars value={avgRating} size="sm" />
              <span>{avgRating.toFixed(1)} ({reviews.length} review{reviews.length === 1 ? '' : 's'})</span>
            </div>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-muted/50 p-4">
              <MapPin className="h-5 w-5 text-primary" />
              <div className="mt-1 text-xs text-muted-foreground">Location</div>
              <div className="font-semibold">{farm.village}, {farm.state}</div>
            </div>
            <div className="rounded-xl bg-muted/50 p-4">
              <Ruler className="h-5 w-5 text-primary" />
              <div className="mt-1 text-xs text-muted-foreground">Farm area</div>
              <div className="font-semibold">{(farm.calculated_area_hectares || farm.declared_area_hectares)?.toFixed(2)} hectares</div>
            </div>
            <div className="rounded-xl bg-muted/50 p-4">
              <Calendar className="h-5 w-5 text-primary" />
              <div className="mt-1 text-xs text-muted-foreground">Farming since</div>
              <div className="font-semibold">{farm.farming_since || '—'}</div>
            </div>
          </div>

          {/* Farm map (static preview) */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-border">
            <div className="flex items-center justify-between bg-muted/50 px-4 py-2.5">
              <span className="text-sm font-semibold">Farm boundary map</span>
              <span className="text-xs text-muted-foreground">Approximate area shown</span>
            </div>
            <div className="relative aspect-[16/10] bg-[#e8eee8]">
              {center && center.lat ? (
                <iframe
                  title="Farm location"
                  className="h-full w-full"
                  loading="lazy"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${center.lng - 0.01},${center.lat - 0.008},${center.lng + 0.01},${center.lat + 0.008}&layer=mapnik&marker=${center.lat},${center.lng}`}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <Navigation className="h-8 w-8" />
                </div>
              )}
            </div>
          </div>

          {/* Crops */}
          {farm.crops && farm.crops.length > 0 && (
            <div className="mt-6">
              <h2 className="font-heading text-lg font-semibold">Crops grown</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {farm.crops.map((c, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                    <Leaf className="h-3.5 w-3.5" /> {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {farm.farming_methods && (
            <div className="mt-6 rounded-xl bg-muted/50 p-4">
              <h2 className="font-heading text-sm font-semibold">Farming methods</h2>
              <p className="mt-1 text-sm text-muted-foreground">{farm.farming_methods}</p>
            </div>
          )}

          {/* Trust panel */}
          <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-base font-semibold">What does verified mean?</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              This farm has undergone FarmTrust's verification process. This includes farmer identity checks, farm location mapping, and review of supporting land documents.
            </p>
            <div className="mt-3 space-y-1.5 text-sm">
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Farmer identity verified</div>
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Farm location mapped</div>
              <div className="flex items-center gap-2"><Ruler className="h-4 w-4 text-primary" /> Farm boundary recorded</div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground italic">
              Verification indicates completion of our checks. It is supporting evidence, not a legal determination of land ownership.
            </p>
          </div>

          <div className="mt-6 flex gap-3">
            <Link to="/" className="flex-1"><Button className="w-full">View products</Button></Link>
            <Link to="/how-it-works" className="flex-1"><Button variant="outline" className="w-full">Learn about verification</Button></Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

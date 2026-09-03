import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Clock, AlertTriangle, ShieldCheck, Camera, Loader2 } from 'lucide-react';
import { api } from '@/api/client';
import VerifiedBadge from '@/components/VerifiedBadge';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

// Reads an image file's pixel dimensions client-side (before upload) so we
// can reject an obviously-wrong shape - e.g. a landscape farm photo picked
// by mistake - without a server round trip.
function readImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve({ width: img.naturalWidth, height: img.naturalHeight }); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read image')); };
    img.src = url;
  });
}

const CHECKS = [
  { key: 'identity', label: 'Mobile verified', icon: ShieldCheck },
  { key: 'identity_submitted', label: 'Identity submitted', icon: ShieldCheck },
  { key: 'farm_location', label: 'Farm location submitted', icon: CheckCircle },
  { key: 'land_documents', label: 'Land document uploaded', icon: CheckCircle },
  { key: 'review', label: 'Verification review', icon: Clock },
  { key: 'fully_verified', label: 'Fully verified', icon: ShieldCheck },
];

export default function VerificationCenter() {
  const { t } = useTranslation();
  const { user: ctxUser } = useOutletContext();
  const [user, setUser] = useState(ctxUser);
  const [checks, setChecks] = useState([]);
  const [farms, setFarms] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef(null);

  useEffect(() => {
    if (!ctxUser) api.auth.me().then(setUser).catch(() => {});
    else setUser(ctxUser);
  }, [ctxUser]);

  const loadData = React.useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [c, f, d] = await Promise.all([
        api.entities.VerificationCheck.filter({ farmer_id: user.id }, '-created_date'),
        api.entities.Farm.filter({ farmer_id: user.id }),
        api.entities.Document.filter({ farmer_id: user.id }),
      ]);
      setChecks(c); setFarms(f); setDocuments(d);
    } catch (e) {
      console.error(e);
      setError('Could not load your verification status.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  // Passport-size photo: a portrait/square headshot for the farmer's
  // verified profile - distinct from the identity/land documents in
  // DocumentsVault, which are proof documents, not a display photo.
  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Please choose an image file', variant: 'destructive' });
      return;
    }

    try {
      const { width, height } = await readImageDimensions(file);
      const ratio = Math.max(width, height) / Math.min(width, height);
      if (ratio > 1.5) {
        toast({
          title: 'That doesn’t look like a passport-size photo',
          description: 'Use a portrait or square headshot (like an ID photo), not a wide landscape image.',
          variant: 'destructive',
        });
        return;
      }
    } catch {
      toast({ title: 'Could not read that image', variant: 'destructive' });
      return;
    }

    setUploadingPhoto(true);
    try {
      const { file_url } = await api.integrations.Core.UploadFile({ file });
      const updated = await api.entities.User.update(user.id, { avatar_url: file_url });
      setUser(updated);
      toast({ title: 'Profile photo updated' });
    } catch (err) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Most recent check that needs the farmer's attention, so the "next action"
  // isn't just implied by an unchecked step — the reviewer's actual notes
  // surface directly instead of making the farmer guess what to fix.
  const attentionCheck = checks.find(c => c.result === 'flag' || c.result === 'fail');

  const level = user?.verification_level || 'none';
  const isVerified = user?.verified_farmer;

  const statusMap = {
    identity: level !== 'none' || isVerified,
    identity_submitted: level !== 'none' || isVerified,
    farm_location: farms.length > 0 && farms[0].boundary?.length > 0,
    land_documents: documents.length > 0,
    review: farms.some(f => f.verification_status === 'under_review') || level === 'documents',
    fully_verified: isVerified || level === 'fully_verified',
  };

  const completed = Object.values(statusMap).filter(Boolean).length;
  const pct = Math.round((completed / CHECKS.length) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">{t('verification.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('verification.subtitle')}</p>
      </div>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={loadData}>Retry</Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          <div className="h-24 animate-pulse rounded-2xl bg-muted" />
          <div className="h-40 animate-pulse rounded-2xl bg-muted" />
        </div>
      ) : (
      <>
      {/* Progress */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">{t('verification.progress')}</div>
            <div className="mt-1 font-heading text-2xl font-bold">{pct}%</div>
          </div>
          <VerifiedBadge level={level} />
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Passport-size profile photo */}
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="Profile photo" className="h-full w-full object-cover" />
          ) : (
            <Camera className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">{t('verification.profilePhoto')}</div>
          <p className="mt-0.5 text-xs text-muted-foreground">{t('verification.profilePhotoDesc')}</p>
        </div>
        <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
        <Button size="sm" variant="outline" disabled={uploadingPhoto} onClick={() => photoInputRef.current?.click()}>
          {uploadingPhoto ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('common.uploading')}</> : (user?.avatar_url ? t('verification.replacePhoto') : t('verification.uploadPhoto'))}
        </Button>
      </div>

      {/* Flagged/failed check — surfaces the reviewer's actual notes so the
          farmer knows exactly what to fix instead of guessing from an
          unchecked step. */}
      {attentionCheck && (
        <div className="flex gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
          <div>
            <div className="text-sm font-semibold text-orange-800">
              {attentionCheck.result === 'fail' ? 'Verification check failed' : 'Verification check flagged'}: {attentionCheck.check_type?.replace('_', ' ')}
            </div>
            {attentionCheck.notes && <p className="mt-1 text-sm text-orange-700">{attentionCheck.notes}</p>}
            {attentionCheck.flagged_issues?.length > 0 && (
              <ul className="mt-2 list-disc space-y-0.5 pl-4 text-sm text-orange-700">
                {attentionCheck.flagged_issues.map((issue, i) => <li key={i}>{issue}</li>)}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Steps */}
      <div className="space-y-2">
        {CHECKS.map((check, i) => {
          const Icon = check.icon;
          const done = statusMap[check.key];
          return (
            <div key={i} className={`flex items-center gap-3 rounded-xl border p-4 ${done ? 'border-primary/20 bg-primary/5' : 'border-border bg-card'}`}>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {done ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={`flex-1 text-sm font-medium ${done ? 'text-foreground' : 'text-muted-foreground'}`}>{check.label}</span>
              {done && <span className="text-xs font-semibold text-primary">✓</span>}
            </div>
          );
        })}
      </div>
      </>
      )}

      {/* Actions */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link to="/farmer/farms">
          <Button variant="outline" className="w-full">{t('verification.mapFarm')}</Button>
        </Link>
        <Link to="/farmer/documents">
          <Button variant="outline" className="w-full">{t('verification.uploadDocuments')}</Button>
        </Link>
      </div>

      {/* Trust note */}
      <div className="rounded-xl bg-muted/50 p-4 text-xs text-muted-foreground">
        <ShieldCheck className="mb-1 h-4 w-4 text-primary" />
        Verification is supporting evidence, not a legal determination of land ownership. Satellite imagery is treated as supporting evidence only.
      </div>
    </div>
  );
}

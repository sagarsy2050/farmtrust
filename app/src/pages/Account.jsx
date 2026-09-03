import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import LanguageSelector from '@/components/LanguageSelector';
import { toast } from '@/components/ui/use-toast';
import { User, Loader2 } from 'lucide-react';

const FIELDS = [
  { key: 'full_name', label: 'Full name' },
  { key: 'phone', label: 'Phone' },
  { key: 'village', label: 'Village' },
  { key: 'district', label: 'District' },
  { key: 'state', label: 'State' },
  { key: 'country', label: 'Country' },
];

export default function Account() {
  const { t, i18n } = useTranslation();
  const { user, checkUserAuth } = useAuth();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [becomingFarmer, setBecomingFarmer] = useState(false);
  const photoInputRef = useRef(null);

  useEffect(() => {
    if (user) setForm({ ...user });
  }, [user]);

  useEffect(() => {
    if (user?.preferred_language && user.preferred_language !== i18n.language) {
      i18n.changeLanguage(user.preferred_language);
    }
  }, [user, i18n]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.entities.User.update(user.id, {
        full_name: form.full_name, phone: form.phone, village: form.village,
        district: form.district, state: form.state, country: form.country,
      });
      await checkUserAuth();
      toast({ title: 'Profile updated' });
    } catch (err) {
      toast({ title: 'Could not save', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Please choose an image file', variant: 'destructive' });
      return;
    }
    setUploadingPhoto(true);
    try {
      const { file_url } = await api.integrations.Core.UploadFile({ file });
      await api.entities.User.update(user.id, { avatar_url: file_url });
      await checkUserAuth();
      toast({ title: 'Photo updated' });
    } catch (err) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Logged-in customers upgrade in place - no need to re-register through
  // the ?as=farmer signup flow, which only works for a brand-new account.
  const handleBecomeFarmer = async () => {
    setBecomingFarmer(true);
    try {
      await api.entities.User.update(user.id, { account_type: 'farmer' });
      window.location.href = '/farmer';
    } catch (err) {
      toast({ title: 'Could not switch to a farmer account', description: err.message, variant: 'destructive' });
      setBecomingFarmer(false);
    }
  };

  if (!form) {
    return (
      <div className="flex min-h-screen flex-col">
        <PublicNavbar />
        <main className="flex-1"><div className="mx-auto max-w-2xl px-4 py-12"><div className="h-64 animate-pulse rounded-2xl bg-muted" /></div></main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
          <h1 className="font-heading text-2xl font-bold">{t('account.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {form.email} · {form.account_type === 'farmer' ? 'Farmer account' : 'Customer account'}
            {form.role === 'admin' && ' · Admin'}
          </p>

          <div className="mt-6 flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
              {form.avatar_url
                ? <img src={form.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                : <User className="h-6 w-6 text-muted-foreground" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{t('account.profilePhoto')}</div>
              <p className="mt-0.5 text-xs text-muted-foreground">Shown on your account and, if you're a farmer, your verification profile.</p>
            </div>
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
            <Button size="sm" variant="outline" disabled={uploadingPhoto} onClick={() => photoInputRef.current?.click()}>
              {uploadingPhoto ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('common.uploading')}</> : (form.avatar_url ? t('common.replace') : t('common.upload'))}
            </Button>
          </div>

          <form onSubmit={handleSave} className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-5">
            {FIELDS.map(f => (
              <div key={f.key} className="space-y-1.5">
                <Label htmlFor={f.key}>{f.label}</Label>
                <Input id={f.key} value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
              </div>
            ))}
            <Button type="submit" disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('common.saving')}</> : t('common.saveChanges')}
            </Button>
          </form>

          <div className="mt-6 rounded-2xl border border-border bg-card p-5">
            <div className="text-sm font-medium">{t('language.title')}</div>
            <LanguageSelector className="mt-2" />
          </div>

          {form.account_type !== 'farmer' && (
            <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5 text-center">
              <p className="text-sm text-muted-foreground">{t('account.wantToSell')}</p>
              <Button variant="link" size="sm" disabled={becomingFarmer} onClick={handleBecomeFarmer} className="mt-1">
                {becomingFarmer ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Switching...</> : `${t('account.becomeFarmer')} →`}
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

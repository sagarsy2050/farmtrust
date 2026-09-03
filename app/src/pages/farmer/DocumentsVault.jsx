import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Upload, FileText, Loader2, ShieldCheck, Lock, AlertTriangle, CheckCircle2 } from 'lucide-react';

const DOC_TYPES = [
  { value: 'land_ownership', label: 'Land Ownership Record' },
  { value: 'lease_tenancy', label: 'Lease / Tenancy Document' },
  { value: 'farmer_registration', label: 'Agricultural / Farmer Registration' },
  { value: 'identity_proof', label: 'Identity Proof' },
  { value: 'other', label: 'Other' },
];

export default function DocumentsVault() {
  const { user: ctxUser } = useOutletContext();
  const { toast } = useToast();
  const [user, setUser] = useState(ctxUser);
  const [farms, setFarms] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    document_type: 'land_ownership', farm_id: '', document_language: 'English', confirmation: false
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Human-in-the-loop step for identity documents (Aadhaar/Kisan Card):
  // OCR extraction is shown for the farmer to review BEFORE the Document
  // record is created — OCR extracts what a document says, it is never
  // treated as proof by itself (see python-ocr/validation/fields.py).
  const [pendingUpload, setPendingUpload] = useState(null); // { file_url, ocr }
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!ctxUser) api.auth.me().then(setUser).catch(() => {});
    else setUser(ctxUser);
  }, [ctxUser]);

  const loadData = React.useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [f, d] = await Promise.all([
        api.entities.Farm.filter({ farmer_id: user.id }),
        api.entities.Document.filter({ farmer_id: user.id }, '-created_date'),
      ]);
      setFarms(f); setDocuments(d);
    } catch (e) {
      console.error(e);
      setError('Could not load your documents.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const createDocumentRecord = async (file_url, ocr, ai_check) => {
    const selectedFarm = farms.find(f => f.id === form.farm_id) || farms[0];
    const doc = await api.entities.Document.create({
      farmer_id: user.id,
      farmer_name: user.full_name,
      farm_id: selectedFarm?.id,
      farm_name: selectedFarm?.farm_name,
      document_type: form.document_type,
      file_url,
      document_language: form.document_language,
      confirmation: form.confirmation,
      status: 'pending',
      // ai_check is best-effort enrichment (see ai-image-detector/detector_worker.py) -
      // a flag for the human reviewer, never an auto-reject.
      ai_flagged: ai_check?.ok === true && ai_check.ai_generated === true,
      ai_check_confidence: ai_check?.ok === true ? ai_check.confidence : null,
    });
    if (ocr && (ocr.document_type === 'aadhaar' || ocr.document_type === 'kisan_card')) {
      try {
        await api.documentExtractions.save({ document_id: doc.id, extraction: ocr });
      } catch (e) {
        // Non-fatal: the document itself is already submitted; the structured
        // extraction is a supporting aid for review, not required for upload.
        console.error('Failed to save document extraction:', e);
      }
    }
    return doc;
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { toast({ title: 'Select a file', variant: 'destructive' }); return; }
    if (!form.confirmation) { toast({ title: 'Please confirm document ownership', variant: 'destructive' }); return; }

    setUploading(true);
    try {
      const { file_url, ocr, ai_check } = await api.integrations.Core.UploadFile({ file });

      // Identity documents get a review step before the Document record is
      // created, so a human sees the extracted fields first.
      if (ocr?.ok !== false && (ocr?.document_type === 'aadhaar' || ocr?.document_type === 'kisan_card')) {
        setPendingUpload({ file_url, ocr, ai_check });
        return;
      }

      await createDocumentRecord(file_url, ocr, ai_check);
      if (ai_check?.ok && ai_check.ai_generated) {
        toast({ title: 'Document uploaded', description: 'Flagged for review: this image may be AI-generated. A reviewer will take a closer look.' });
      } else {
        toast({ title: 'Document uploaded', description: 'Your document is pending verification.' });
      }
      setFile(null);
      setForm({ ...form, confirmation: false });
      await loadData();
    } catch (err) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const confirmPendingUpload = async () => {
    if (!pendingUpload) return;
    setConfirming(true);
    try {
      await createDocumentRecord(pendingUpload.file_url, pendingUpload.ocr, pendingUpload.ai_check);
      toast({ title: 'Document uploaded', description: 'Your document is pending verification.' });
      setPendingUpload(null);
      setFile(null);
      setForm({ ...form, confirmation: false });
      await loadData();
    } catch (err) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setConfirming(false);
    }
  };

  const statusColor = {
    pending: 'bg-yellow-50 text-yellow-700 ring-yellow-200',
    approved: 'bg-green-50 text-green-700 ring-green-200',
    rejected: 'bg-red-50 text-red-700 ring-red-200',
    needs_info: 'bg-orange-50 text-orange-700 ring-orange-200',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Documents Vault</h1>
        <p className="mt-1 text-sm text-muted-foreground">Securely upload land and identity documents for verification.</p>
      </div>

      {/* Security notice */}
      <div className="flex items-start gap-3 rounded-xl bg-primary/5 p-4 text-sm">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="text-muted-foreground">
          Documents are encrypted at rest and in transit. They are restricted, not publicly visible, and reviewed only by authorized personnel. Documents are treated as supporting evidence, not as legal proof of ownership on their own.
        </div>
      </div>

      {/* Upload form */}
      <form onSubmit={handleUpload} className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading text-base font-semibold">Upload document</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="doc_type">Document type</Label>
            <Select value={form.document_type} onValueChange={v => setForm({...form, document_type: v})}>
              <SelectTrigger id="doc_type"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="farm">Farm</Label>
            <Select value={form.farm_id} onValueChange={v => setForm({...form, farm_id: v})}>
              <SelectTrigger id="farm"><SelectValue placeholder="Select farm" /></SelectTrigger>
              <SelectContent>
                {farms.map(f => <SelectItem key={f.id} value={f.id}>{f.farm_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="lang">Document language</Label>
            <Input id="lang" value={form.document_language} onChange={e => setForm({...form, document_language: e.target.value})} />
          </div>
          <div>
            <Label htmlFor="file">Select file</Label>
            <Input id="file" type="file" onChange={e => setFile(e.target.files?.[0])} accept=".pdf,.jpg,.jpeg,.png,.tif,.tiff,.webp" />
          </div>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <Checkbox checked={form.confirmation} onCheckedChange={v => setForm({...form, confirmation: v})} />
          <span className="text-muted-foreground">I confirm this document belongs to this farm.</span>
        </label>
        <Button type="submit" className="mt-4" disabled={uploading}>
          {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</> : <><Upload className="mr-2 h-4 w-4" /> Submit for Verification</>}
        </Button>
      </form>

      {/* Human-in-the-loop review: shown for identity documents (Aadhaar/Kisan
          Card) before the Document record is created. Only ever shows masked
          numbers — that's all the OCR worker ever returns. */}
      {pendingUpload && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-base font-semibold">Review extracted information</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            This is OCR-extracted text, not proof that the document or identity is genuine — it will still be reviewed manually.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {pendingUpload.ocr?.farmer?.name && (
              <div><div className="text-xs text-muted-foreground">Name</div><div className="text-sm font-medium">{pendingUpload.ocr.farmer.name}</div></div>
            )}
            {pendingUpload.ocr?.farmer?.aadhaar_number && (
              <div>
                <div className="text-xs text-muted-foreground">Aadhaar</div>
                <div className="text-sm font-mono font-medium">{pendingUpload.ocr.farmer.aadhaar_number}</div>
              </div>
            )}
            {pendingUpload.ocr?.farmer?.kisan_card_number && (
              <div>
                <div className="text-xs text-muted-foreground">Kisan Card</div>
                <div className="text-sm font-mono font-medium">{pendingUpload.ocr.farmer.kisan_card_number}</div>
              </div>
            )}
            {pendingUpload.ocr?.farmer?.village && (
              <div><div className="text-xs text-muted-foreground">Village</div><div className="text-sm font-medium">{pendingUpload.ocr.farmer.village}</div></div>
            )}
            {pendingUpload.ocr?.farmer?.district && (
              <div><div className="text-xs text-muted-foreground">District</div><div className="text-sm font-medium">{pendingUpload.ocr.farmer.district}</div></div>
            )}
            {pendingUpload.ocr?.farmer?.state && (
              <div><div className="text-xs text-muted-foreground">State</div><div className="text-sm font-medium">{pendingUpload.ocr.farmer.state}</div></div>
            )}
            {pendingUpload.ocr?.farmer?.pincode && (
              <div><div className="text-xs text-muted-foreground">Pincode</div><div className="text-sm font-medium">{pendingUpload.ocr.farmer.pincode}</div></div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
              Confidence: {Math.round(pendingUpload.ocr?.verification?.ocr_confidence ?? 0)}%
            </span>
            {pendingUpload.ocr?.verification?.requires_manual_review ? (
              <span className="flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-orange-700">
                <AlertTriangle className="h-3 w-3" /> Requires manual review
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-green-700">
                <CheckCircle2 className="h-3 w-3" /> Fields look complete
              </span>
            )}
            {pendingUpload.ocr?.farmer?.aadhaar_number && (
              <span className={`rounded-full px-2.5 py-1 ${pendingUpload.ocr?.verification?.aadhaar_checksum_valid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                Aadhaar checksum {pendingUpload.ocr?.verification?.aadhaar_checksum_valid ? 'valid' : 'invalid'}
              </span>
            )}
            {pendingUpload.ai_check?.ok && pendingUpload.ai_check.ai_generated && (
              <span className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-red-700">
                <AlertTriangle className="h-3 w-3" /> Possibly AI-generated ({Math.round(pendingUpload.ai_check.confidence * 100)}% confidence)
              </span>
            )}
          </div>

          {pendingUpload.ocr?.verification?.fields_missing?.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Not detected: {pendingUpload.ocr.verification.fields_missing.join(', ')} — you can still submit; the reviewer will check manually.
            </p>
          )}

          <div className="mt-4 flex gap-2">
            <Button size="sm" onClick={confirmPendingUpload} disabled={confirming}>
              {confirming ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : 'Looks correct — submit'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setPendingUpload(null); setFile(null); }} disabled={confirming}>
              Cancel and re-upload
            </Button>
          </div>
        </div>
      )}

      {/* Documents list */}
      <div>
        <h2 className="font-heading text-base font-semibold">Submitted documents</h2>

        {error && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={loadData}>Retry</Button>
          </div>
        )}

        {loading ? (
          <div className="mt-3 space-y-2">
            <div className="h-16 animate-pulse rounded-xl bg-muted" />
            <div className="h-16 animate-pulse rounded-xl bg-muted" />
          </div>
        ) : documents.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No documents submitted yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {documents.map(doc => (
              <div key={doc.id} className="rounded-xl border border-border p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{DOC_TYPES.find(d => d.value === doc.document_type)?.label || doc.document_type}</div>
                    <div className="text-xs text-muted-foreground">{doc.farm_name} · {doc.document_language}</div>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${statusColor[doc.status] || statusColor.pending}`}>
                    {doc.status.replace('_', ' ')}
                  </span>
                </div>
                {doc.review_notes && (doc.status === 'rejected' || doc.status === 'needs_info') && (
                  <div className="mt-3 rounded-lg bg-orange-50 p-3 text-xs text-orange-700">
                    <span className="font-semibold">Required action:</span> {doc.review_notes}
                  </div>
                )}
                {doc.review_notes && doc.status === 'approved' && (
                  <div className="mt-3 rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground">
                    <span className="font-semibold">Notes:</span> {doc.review_notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

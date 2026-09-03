import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, XCircle, AlertTriangle, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const DOC_TYPES = {
  land_ownership: 'Land Ownership Record',
  lease_tenancy: 'Lease / Tenancy Document',
  farmer_registration: 'Agricultural / Farmer Registration',
  identity_proof: 'Identity Proof',
  other: 'Other',
};

export default function DocumentReview() {
  const { toast } = useToast();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [actioning, setActioning] = useState(null);
  const [reviewNotes, setReviewNotes] = useState({});
  // document_id -> extraction row | 'none' (fetched, nothing found) | 'loading'
  const [extractions, setExtractions] = useState({});

  useEffect(() => {
    loadDocs();
  }, [filter]);

  const loadDocs = async () => {
    setLoading(true);
    try {
      setError(null);
      let docs;
      if (filter === 'all') {
        docs = await api.asServiceRole.entities.Document.list('-created_date', 100);
      } else {
        docs = await api.asServiceRole.entities.Document.filter({ status: filter }, '-created_date', 100);
      }
      setDocuments(docs);
    } catch (e) {
      console.error(e);
      setError('Could not load documents. Please try again.');
    }
    finally { setLoading(false); }
  };

  const handleAction = async (docId, status) => {
    setActioning(docId);
    try {
      const notes = reviewNotes[docId] || '';
      await api.asServiceRole.entities.Document.update(docId, {
        status,
        review_notes: notes,
        reviewed_by: 'admin'
      });
      toast({ title: `Document ${status}`, description: notes || 'No notes added' });
      setReviewNotes(prev => ({ ...prev, [docId]: '' }));
      loadDocs();
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally { setActioning(null); }
  };

  const loadExtraction = async (docId) => {
    setExtractions(prev => ({ ...prev, [docId]: 'loading' }));
    try {
      const row = await api.documentExtractions.get(docId);
      setExtractions(prev => ({ ...prev, [docId]: row }));
    } catch (e) {
      // 404 just means no OCR extraction exists for this document (e.g. a
      // land-document upload, or identity doc where OCR found nothing).
      setExtractions(prev => ({ ...prev, [docId]: 'none' }));
    }
  };

  const handleViewFile = async (doc) => {
    try {
      const { signed_url } = await api.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: doc.file_url });
      window.open(signed_url, '_blank');
    } catch (e) {
      // Fallback to direct URL
      window.open(doc.file_url, '_blank');
    }
  };

  const statusColors = {
    pending: 'bg-yellow-50 text-yellow-700 ring-yellow-200',
    approved: 'bg-green-50 text-green-700 ring-green-200',
    rejected: 'bg-red-50 text-red-700 ring-red-200',
    needs_info: 'bg-orange-50 text-orange-700 ring-orange-200',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">Document Review</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review and verify farmer documents.</p>
        </div>
        <div className="flex gap-1 overflow-x-auto rounded-lg border border-border p-1">
          {['pending', 'approved', 'rejected', 'needs_info', 'all'].map(s => (
            <button key={s} onClick={() => setFilter(s)} aria-pressed={filter === s}
              className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${filter === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      ) : documents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">No documents to review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map(doc => (
            <div key={doc.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-heading text-sm font-semibold">{DOC_TYPES[doc.document_type] || doc.document_type}</h3>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{doc.farmer_name} · {doc.farm_name}</p>
                  <p className="text-xs text-muted-foreground">Language: {doc.document_language}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${statusColors[doc.status]}`}>
                  {doc.status?.replace('_', ' ')}
                </span>
              </div>

              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleViewFile(doc)}>View document</Button>
                {doc.document_type === 'identity_proof' && !extractions[doc.id] && (
                  <Button variant="outline" size="sm" onClick={() => loadExtraction(doc.id)}>
                    <ShieldCheck className="mr-1 h-4 w-4" /> Show OCR-extracted info
                  </Button>
                )}
              </div>

              {extractions[doc.id] === 'loading' && (
                <div className="mt-3 h-16 animate-pulse rounded-lg bg-muted" />
              )}

              {extractions[doc.id] && extractions[doc.id] !== 'loading' && extractions[doc.id] !== 'none' && (
                <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <p className="text-xs text-muted-foreground">
                    OCR-extracted text, not proof the document or identity is genuine — a supporting aid for your review only.
                  </p>
                  <div className="mt-2 grid gap-2 text-xs sm:grid-cols-3">
                    {extractions[doc.id].name && <div><span className="text-muted-foreground">Name: </span>{extractions[doc.id].name}</div>}
                    {extractions[doc.id].aadhaar_number_masked && <div><span className="text-muted-foreground">Aadhaar: </span><span className="font-mono">{extractions[doc.id].aadhaar_number_masked}</span></div>}
                    {extractions[doc.id].kisan_card_number_masked && <div><span className="text-muted-foreground">Kisan Card: </span><span className="font-mono">{extractions[doc.id].kisan_card_number_masked}</span></div>}
                    {extractions[doc.id].village && <div><span className="text-muted-foreground">Village: </span>{extractions[doc.id].village}</div>}
                    {extractions[doc.id].district && <div><span className="text-muted-foreground">District: </span>{extractions[doc.id].district}</div>}
                    {extractions[doc.id].state && <div><span className="text-muted-foreground">State: </span>{extractions[doc.id].state}</div>}
                    {extractions[doc.id].pincode && <div><span className="text-muted-foreground">Pincode: </span>{extractions[doc.id].pincode}</div>}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                      Confidence: {Math.round(extractions[doc.id].ocr_confidence ?? 0)}%
                    </span>
                    {extractions[doc.id].requires_manual_review ? (
                      <span className="flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-orange-700">
                        <AlertTriangle className="h-3 w-3" /> Requires manual review
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-green-700">
                        <CheckCircle2 className="h-3 w-3" /> Fields complete
                      </span>
                    )}
                    {extractions[doc.id].aadhaar_checksum_valid !== null && extractions[doc.id].aadhaar_checksum_valid !== undefined && (
                      <span className={`rounded-full px-2 py-0.5 ${extractions[doc.id].aadhaar_checksum_valid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        Aadhaar checksum {extractions[doc.id].aadhaar_checksum_valid ? 'valid' : 'invalid'}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {extractions[doc.id] === 'none' && (
                <p className="mt-3 text-xs text-muted-foreground">No OCR extraction available for this document.</p>
              )}

              {doc.status === 'pending' && (
                <>
                  <input
                    type="text"
                    placeholder="Review notes (optional)"
                    value={reviewNotes[doc.id] || ''}
                    onChange={e => setReviewNotes(prev => ({ ...prev, [doc.id]: e.target.value }))}
                    className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => handleAction(doc.id, 'approved')} disabled={actioning === doc.id}>
                      {actioning === doc.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-1 h-4 w-4" />} Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleAction(doc.id, 'rejected')} disabled={actioning === doc.id}>
                      <XCircle className="mr-1 h-4 w-4" /> Reject
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleAction(doc.id, 'needs_info')} disabled={actioning === doc.id}>
                      <AlertTriangle className="mr-1 h-4 w-4" /> Request more info
                    </Button>
                  </div>
                </>
              )}

              {doc.review_notes && doc.status !== 'pending' && (
                <div className="mt-3 rounded-lg bg-muted/30 p-2 text-xs text-muted-foreground">
                  <span className="font-semibold">Notes:</span> {doc.review_notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

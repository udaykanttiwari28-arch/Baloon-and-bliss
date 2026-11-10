'use client';

import { useEffect, useRef, useState } from 'react';
import InvoicePanel from './invoice-panel';

export interface EnquiryDetail {
  id: string;
  reference: string;
  name: string;
  email?: string | null;
  mobile?: string | null;
  event_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  venue?: string | null;
  postal_code?: string | null;
  special_requirements?: string | null;
  package_slug?: string | null;
  amount_total_minor: number;
  deposit_paid_minor: number;
  admin_notes?: string | null;
  mockup_storage_path?: string | null;
  source_channel?: string | null;
  carousell_id?: string | null;
  facebook_id?: string | null;
  celebration_type?: string | null;
  status: string;
  converted_to_customer_at?: string | null;
  lead_type?: 'individual' | 'corporate' | null;
  company_name?: string | null;
  follow_up_date?: string | null;
  follow_up_notes?: string | null;
  close_reason?: string | null;
}

interface EnquiryDetailPanelProps {
  enquiry: EnquiryDetail;
  onUpdated: (patch: Partial<EnquiryDetail>) => void;
}

const packageNames: Record<string, string> = {
  'classic-setup': 'Classic Setup',
  'signature-setup': 'Signature Setup',
  'premium-setup': 'Premium Setup',
  'custom-setup': 'Custom Setup',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-SG', { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`));
}
function formatTime(value: string) {
  const [hour, minute] = value.slice(0, 5).split(':').map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
}
function fmtSGD(minor: number) {
  return `S$${(minor / 100).toFixed(2)}`;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div style={{ display: 'grid', gap: 2 }}>
      <span style={{ color: '#765d68', fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ color: '#24151c', fontSize: '.92rem' }}>{value}</span>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 style={{ margin: '0 0 14px', fontFamily: 'Georgia, serif', fontSize: '1.1rem', borderBottom: '1px solid #f0dce7', paddingBottom: 8 }}>{children}</h3>;
}

type ChecklistItem = { id: string; item_name: string; is_done: boolean; sort_order: number };

export default function EnquiryDetailPanel({ enquiry, onUpdated }: EnquiryDetailPanelProps) {
  const [amountInput, setAmountInput] = useState((enquiry.amount_total_minor / 100).toFixed(2));
  const [depositInput, setDepositInput] = useState((enquiry.deposit_paid_minor / 100).toFixed(2));
  const [notes, setNotes] = useState(enquiry.admin_notes ?? '');
  const [notesSavedMsg, setNotesSavedMsg] = useState('');
  const [mockupPath, setMockupPath] = useState(enquiry.mockup_storage_path ?? '');
  const [savingPayment, setSavingPayment] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [paymentMsg, setPaymentMsg] = useState('');
  const [mockupMsg, setMockupMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lead info
  const [companyName, setCompanyName] = useState(enquiry.company_name ?? '');
  const [savingCompany, setSavingCompany] = useState(false);

  // Follow-up
  const [followUpDate, setFollowUpDate] = useState(enquiry.follow_up_date ?? '');
  const [followUpNotes, setFollowUpNotes] = useState(enquiry.follow_up_notes ?? '');
  const [savingFollowUp, setSavingFollowUp] = useState(false);
  const [followUpMsg, setFollowUpMsg] = useState('');

  // Close reason
  const [closeReason, setCloseReason] = useState(enquiry.close_reason ?? '');
  const [savingCloseReason, setSavingCloseReason] = useState(false);
  const [closeReasonMsg, setCloseReasonMsg] = useState('');

  // Convert to customer
  const [isConverted, setIsConverted] = useState(!!enquiry.converted_to_customer_at);
  const [converting, setConverting] = useState(false);
  const [convertMsg, setConvertMsg] = useState('');
  const [showConvertForm, setShowConvertForm] = useState(false);
  const [convertSalutation, setConvertSalutation] = useState('');
  const [convertFirstName, setConvertFirstName] = useState(() => enquiry.name.split(' ')[0] ?? '');
  const [convertLastName, setConvertLastName] = useState(() => enquiry.name.split(' ').slice(1).join(' '));

  // Checklist
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [checklistLoaded, setChecklistLoaded] = useState(false);

  useEffect(() => {
    void fetch(`/api/admin/enquiries/${enquiry.id}/checklist`)
      .then((r) => r.json())
      .then((j: { items?: ChecklistItem[] }) => { setChecklistItems(j.items ?? []); setChecklistLoaded(true); });
  }, [enquiry.id]);

  // Follow-up overdue check
  const isFollowUpOverdue = followUpDate
    && !['Confirmed', 'Cancelled', 'Lost'].includes(enquiry.status)
    && followUpDate <= new Date().toISOString().slice(0, 10);

  const totalMinor = Math.round(parseFloat(amountInput) * 100) || 0;
  const paidMinor = Math.round(parseFloat(depositInput) * 100) || 0;
  const balance = totalMinor - paidMinor;

  async function patch(body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/enquiries/${enquiry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res;
  }

  async function savePayment() {
    setSavingPayment(true); setPaymentMsg('');
    const res = await patch({ amount_total_minor: totalMinor, deposit_paid_minor: paidMinor });
    setSavingPayment(false);
    if (res.ok) {
      onUpdated({ amount_total_minor: totalMinor, deposit_paid_minor: paidMinor });
      setPaymentMsg('Saved ✓');
      setTimeout(() => setPaymentMsg(''), 2000);
    } else {
      const j = await res.json() as { error?: string };
      setPaymentMsg(j.error ?? 'Error saving');
    }
  }

  async function saveNotes() {
    setSavingNotes(true);
    const res = await patch({ admin_notes: notes });
    setSavingNotes(false);
    if (res.ok) {
      onUpdated({ admin_notes: notes });
      setNotesSavedMsg('Saved ✓');
      setTimeout(() => setNotesSavedMsg(''), 2000);
    }
  }

  async function saveCompanyName() {
    setSavingCompany(true);
    const res = await patch({ company_name: companyName || null });
    setSavingCompany(false);
    if (res.ok) onUpdated({ company_name: companyName || null });
  }

  async function saveFollowUp() {
    setSavingFollowUp(true); setFollowUpMsg('');
    const res = await patch({ follow_up_date: followUpDate || null, follow_up_notes: followUpNotes || null });
    setSavingFollowUp(false);
    if (res.ok) {
      onUpdated({ follow_up_date: followUpDate || null, follow_up_notes: followUpNotes || null });
      setFollowUpMsg('Saved ✓');
      setTimeout(() => setFollowUpMsg(''), 2000);
    } else {
      setFollowUpMsg('Error saving.');
    }
  }

  async function saveCloseReason() {
    setSavingCloseReason(true); setCloseReasonMsg('');
    const res = await patch({ close_reason: closeReason || null });
    setSavingCloseReason(false);
    if (res.ok) {
      onUpdated({ close_reason: closeReason || null });
      setCloseReasonMsg('Saved ✓');
      setTimeout(() => setCloseReasonMsg(''), 2000);
    } else {
      setCloseReasonMsg('Error saving.');
    }
  }

  async function convertToCustomer() {
    if (!convertFirstName.trim()) { setConvertMsg('First name is required.'); return; }
    setConverting(true); setConvertMsg('');
    const res = await fetch(`/api/admin/enquiries/${enquiry.id}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        salutation: convertSalutation || null,
        first_name: convertFirstName.trim(),
        last_name: convertLastName.trim() || null,
      }),
    });
    const j = await res.json() as { success?: boolean; error?: string };
    setConverting(false);
    if (res.ok) {
      setIsConverted(true);
      setShowConvertForm(false);
      onUpdated({ converted_to_customer_at: new Date().toISOString() });
      const cr = await fetch(`/api/admin/enquiries/${enquiry.id}/checklist`);
      const cj = await cr.json() as { items?: ChecklistItem[] };
      setChecklistItems(cj.items ?? []);
      setConvertMsg('Converted! Default checklist created.');
      setTimeout(() => setConvertMsg(''), 3000);
    } else {
      setConvertMsg(j.error ?? 'Error converting.');
    }
  }

  async function toggleItem(item: ChecklistItem) {
    const next = !item.is_done;
    setChecklistItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_done: next } : i));
    await fetch(`/api/admin/enquiries/${enquiry.id}/checklist/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_done: next }),
    });
  }

  async function addChecklistItem() {
    const name = newItem.trim();
    if (!name) return;
    const res = await fetch(`/api/admin/enquiries/${enquiry.id}/checklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_name: name }),
    });
    const j = await res.json() as { item?: ChecklistItem };
    if (j.item) { setChecklistItems((prev) => [...prev, j.item!]); setNewItem(''); }
  }

  async function deleteChecklistItem(itemId: string) {
    setChecklistItems((prev) => prev.filter((i) => i.id !== itemId));
    await fetch(`/api/admin/enquiries/${enquiry.id}/checklist/${itemId}`, { method: 'DELETE' });
  }

  async function uploadMockup(file: File) {
    if (file.size > 10 * 1024 * 1024) { setMockupMsg('File too large (max 10 MB).'); return; }
    setUploading(true); setMockupMsg('Uploading…');
    const form = new FormData(); form.append('file', file);
    const res = await fetch(`/api/admin/enquiries/${enquiry.id}/mockup`, { method: 'POST', body: form });
    setUploading(false);
    if (res.ok) {
      const j = await res.json() as { path?: string };
      const p = j.path ?? file.name;
      setMockupPath(p);
      onUpdated({ mockup_storage_path: p });
      setMockupMsg('');
    } else {
      const j = await res.json() as { error?: string };
      setMockupMsg(j.error ?? 'Upload failed.');
    }
  }

  async function removeMockup() {
    setUploading(true); setMockupMsg('Removing…');
    const res = await fetch(`/api/admin/enquiries/${enquiry.id}/mockup`, { method: 'DELETE' });
    setUploading(false);
    if (res.ok) { setMockupPath(''); onUpdated({ mockup_storage_path: null }); setMockupMsg(''); }
    else { const j = await res.json() as { error?: string }; setMockupMsg(j.error ?? 'Error removing'); }
  }

  const mockupFilename = mockupPath ? (mockupPath.split('/').pop() ?? mockupPath) : '';

  function BalanceChip() {
    if (totalMinor === 0 && paidMinor === 0) return null;
    if (totalMinor === 0) return null;
    if (balance <= 0) return <span style={{ padding: '5px 11px', borderRadius: 999, background: '#dcfce7', color: '#166534', fontSize: '.78rem', fontWeight: 700 }}>Paid in Full</span>;
    if (paidMinor === 0) return <span style={{ padding: '5px 11px', borderRadius: 999, background: '#fef2f2', color: '#991b1b', fontSize: '.78rem', fontWeight: 700 }}>Unpaid: {fmtSGD(balance)}</span>;
    return <span style={{ padding: '5px 11px', borderRadius: 999, background: '#fef3c7', color: '#92400e', fontSize: '.78rem', fontWeight: 700 }}>Partial: {fmtSGD(balance)} remaining</span>;
  }

  const iStyle: React.CSSProperties = { padding: '10px 12px', border: '1px solid #decbd5', borderRadius: 10, background: '#fffdfd', font: 'inherit', color: '#24151c' };

  const showClosed = enquiry.status === 'Cancelled' || enquiry.status === 'Lost';

  return (
    <div style={{ padding: '20px 22px 24px', background: '#fffbf7', borderTop: '1px solid #f0dce7', display: 'grid', gap: 28 }}>

      {/* 1. Customer & Event Info */}
      <div>
        <SectionHeading>Customer &amp; Event</SectionHeading>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px 20px' }}>
          <InfoRow label="Name" value={enquiry.name} />
          <InfoRow label="Email" value={enquiry.email ? <a href={`mailto:${enquiry.email}`} style={{ color: '#db2777', textDecoration: 'none' }}>{enquiry.email}</a> : null} />
          <InfoRow label="Phone" value={enquiry.mobile ? <a href={`tel:${enquiry.mobile}`} style={{ color: '#db2777', textDecoration: 'none' }}>{enquiry.mobile}</a> : null} />
          {enquiry.carousell_id && <InfoRow label="Carousell ID" value={enquiry.carousell_id} />}
          {enquiry.facebook_id && <InfoRow label="Facebook ID" value={enquiry.facebook_id} />}
          <InfoRow label="Occasion" value={enquiry.celebration_type} />
          <InfoRow label="Event Date" value={enquiry.event_date ? formatDate(enquiry.event_date) : null} />
          <InfoRow label="Time" value={enquiry.start_time && enquiry.end_time ? `${formatTime(enquiry.start_time)} – ${formatTime(enquiry.end_time)}` : null} />
          <InfoRow label="Package" value={enquiry.package_slug ? (packageNames[enquiry.package_slug] ?? enquiry.package_slug) : null} />
          <InfoRow label="Venue" value={enquiry.venue} />
          <InfoRow label="Postal Code" value={enquiry.postal_code} />
        </div>
      </div>

      {/* 2. Lead Info */}
      <div>
        <SectionHeading>Lead Info</SectionHeading>
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ color: '#765d68', fontSize: '.86rem', fontWeight: 700 }}>Type:</span>
            {enquiry.lead_type === 'corporate'
              ? <span style={{ padding: '4px 12px', borderRadius: 999, background: '#ede9fe', color: '#5b21b6', fontSize: '.78rem', fontWeight: 700 }}>🏢 Corporate</span>
              : <span style={{ padding: '4px 12px', borderRadius: 999, background: '#f1f5f9', color: '#475569', fontSize: '.78rem', fontWeight: 700 }}>👤 Individual</span>
            }
            {enquiry.source_channel && (
              <span style={{ padding: '4px 12px', borderRadius: 999, background: '#fce7f3', color: '#db2777', fontSize: '.78rem', fontWeight: 700 }}>via {enquiry.source_channel}</span>
            )}
          </div>
          {enquiry.lead_type === 'corporate' && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <label style={{ display: 'grid', gap: 6, color: '#765d68', fontSize: '.86rem', fontWeight: 700, flex: 1 }}>
                Company Name
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Pte Ltd"
                  style={iStyle}
                />
              </label>
              <button
                className="button"
                type="button"
                onClick={saveCompanyName}
                disabled={savingCompany}
                style={{ margin: 0, padding: '10px 16px', fontSize: '.86rem', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {savingCompany ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Payment Tracking */}
      <div>
        <SectionHeading>Payment Tracking</SectionHeading>
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
            <label style={{ display: 'grid', gap: 6, color: '#765d68', fontSize: '.86rem', fontWeight: 700 }}>
              Quoted Amount (SGD)
              <input type="number" step="0.01" min="0" value={amountInput} onChange={(e) => setAmountInput(e.target.value)} style={iStyle} />
            </label>
            <label style={{ display: 'grid', gap: 6, color: '#765d68', fontSize: '.86rem', fontWeight: 700 }}>
              Deposit Paid (SGD)
              <input type="number" step="0.01" min="0" value={depositInput} onChange={(e) => setDepositInput(e.target.value)} style={iStyle} />
            </label>
            <button className="button" type="button" onClick={savePayment} disabled={savingPayment}
              style={{ marginTop: 0, padding: '11px 18px', fontSize: '.88rem', whiteSpace: 'nowrap', border: 'none', cursor: 'pointer' }}>
              {savingPayment ? 'Saving…' : 'Save'}
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: '#765d68', fontSize: '.86rem', fontWeight: 700 }}>Balance:</span>
            <BalanceChip />
            {paymentMsg && <span style={{ color: paymentMsg.includes('✓') ? '#166534' : '#be123c', fontSize: '.82rem', fontWeight: 700 }}>{paymentMsg}</span>}
          </div>
        </div>
      </div>

      {/* 4. Follow-up */}
      <div>
        <SectionHeading>Follow-up</SectionHeading>
        <div style={{ display: 'grid', gap: 12 }}>
          {isFollowUpOverdue && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fef3c7', color: '#92400e', fontSize: '.86rem', fontWeight: 700 }}>
              ⚠ Follow-up overdue — please action this lead.
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={{ display: 'grid', gap: 6, color: '#765d68', fontSize: '.86rem', fontWeight: 700 }}>
              Follow-up Date
              <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} style={iStyle} />
            </label>
          </div>
          <label style={{ display: 'grid', gap: 6, color: '#765d68', fontSize: '.86rem', fontWeight: 700 }}>
            Follow-up Notes
            <textarea rows={2} value={followUpNotes} onChange={(e) => setFollowUpNotes(e.target.value)}
              placeholder="What to follow up on…"
              style={{ ...iStyle, resize: 'vertical' }} />
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="button" type="button" onClick={saveFollowUp} disabled={savingFollowUp}
              style={{ margin: 0, padding: '9px 18px', fontSize: '.86rem', border: 'none', cursor: 'pointer' }}>
              {savingFollowUp ? 'Saving…' : 'Save Follow-up'}
            </button>
            {followUpMsg && <span style={{ color: followUpMsg.includes('✓') ? '#166534' : '#be123c', fontSize: '.82rem', fontWeight: 700 }}>{followUpMsg}</span>}
          </div>
        </div>
      </div>

      {/* 5. Close Reason (only when Cancelled or Lost) */}
      {showClosed && (
        <div>
          <SectionHeading>Close Reason</SectionHeading>
          <div style={{ display: 'grid', gap: 12 }}>
            <label style={{ display: 'grid', gap: 6, color: '#765d68', fontSize: '.86rem', fontWeight: 700 }}>
              Why didn&apos;t this close?
              <textarea rows={3} value={closeReason} onChange={(e) => setCloseReason(e.target.value)}
                placeholder="e.g. Budget too high, chose another vendor, event cancelled…"
                style={{ ...iStyle, resize: 'vertical' }} />
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="button" type="button" onClick={saveCloseReason} disabled={savingCloseReason}
                style={{ margin: 0, padding: '9px 18px', fontSize: '.86rem', border: 'none', cursor: 'pointer' }}>
                {savingCloseReason ? 'Saving…' : 'Save'}
              </button>
              {closeReasonMsg && <span style={{ color: closeReasonMsg.includes('✓') ? '#166534' : '#be123c', fontSize: '.82rem', fontWeight: 700 }}>{closeReasonMsg}</span>}
            </div>
          </div>
        </div>
      )}

      {/* 6. Requirements & Notes */}
      <div>
        <SectionHeading>Requirements &amp; Notes</SectionHeading>
        <div style={{ display: 'grid', gap: 14 }}>
          {enquiry.special_requirements && (
            <div>
              <span style={{ display: 'block', color: '#765d68', fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>Customer Requirements</span>
              <p style={{ margin: 0, padding: '12px 14px', borderRadius: 10, background: '#f9f4f6', color: '#765d68', fontSize: '.9rem', lineHeight: 1.55 }}>{enquiry.special_requirements}</p>
            </div>
          )}
          <label style={{ display: 'grid', gap: 6, color: '#765d68', fontSize: '.86rem', fontWeight: 700 }}>
            Admin Notes
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={saveNotes}
              placeholder="Internal notes (auto-saved on blur)…"
              style={{ ...iStyle, resize: 'vertical' }} />
          </label>
          {savingNotes && <span style={{ color: '#765d68', fontSize: '.8rem' }}>Saving…</span>}
          {!savingNotes && notesSavedMsg && <span style={{ color: '#166534', fontSize: '.8rem', fontWeight: 700 }}>{notesSavedMsg}</span>}
        </div>
      </div>

      {/* 7. Agreed Mockup */}
      <div>
        <SectionHeading>Agreed Mockup</SectionHeading>
        {mockupPath ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '14px 16px', borderRadius: 12, border: '1px solid #f0dce7', background: '#fff' }}>
            <span style={{ fontSize: '1.4rem' }}>📎</span>
            <span style={{ flex: 1, color: '#24151c', fontSize: '.9rem', fontWeight: 700, wordBreak: 'break-all' }}>{mockupFilename}</span>
            <a href={`/api/admin/enquiries/${enquiry.id}/mockup`} target="_blank" rel="noreferrer" className="text-link" style={{ fontSize: '.86rem' }}>View ↗</a>
            <button className="text-button" type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ fontSize: '.86rem' }}>Replace</button>
            <button className="text-button" type="button" onClick={removeMockup} disabled={uploading} style={{ fontSize: '.86rem', color: '#be123c' }}>Remove</button>
          </div>
        ) : (
          <div
            style={{ padding: '24px 20px', border: '2px dashed #f0dce7', borderRadius: 12, background: '#fffbf7', textAlign: 'center', cursor: 'pointer' }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) void uploadMockup(file); }}
          >
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: 8 }}>🖼️</span>
            <p style={{ margin: '0 0 4px', color: '#24151c', fontWeight: 700, fontSize: '.92rem' }}>Upload agreed mockup</p>
            <p style={{ margin: 0, color: '#765d68', fontSize: '.82rem' }}>Image or PDF · max 10 MB · click or drag &amp; drop</p>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }}
          onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadMockup(file); e.target.value = ''; }} />
        {mockupMsg && (
          <p style={{ margin: '8px 0 0', color: mockupMsg.includes('fail') || mockupMsg.includes('large') || mockupMsg.includes('Error') ? '#be123c' : '#765d68', fontSize: '.84rem', fontWeight: 700 }}>
            {mockupMsg}
          </p>
        )}
      </div>

      {/* 8. Invoices */}
      <div>
        <SectionHeading>Invoices</SectionHeading>
        <InvoicePanel
          enquiryId={enquiry.id}
          enquiryName={enquiry.name}
          amountTotalMinor={enquiry.amount_total_minor}
          packageSlug={enquiry.package_slug}
        />
      </div>

      {/* 9. Customer Status */}
      <div>
        <SectionHeading>Customer Status</SectionHeading>
        {isConverted ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ padding: '5px 14px', borderRadius: 999, background: '#dcfce7', color: '#166534', fontSize: '.82rem', fontWeight: 700 }}>✓ Converted to Customer</span>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            <p style={{ margin: 0, color: '#765d68', fontSize: '.88rem' }}>Converting will create a customer record and seed the booking checklist.</p>
            {!showConvertForm ? (
              <button className="button" type="button" onClick={() => setShowConvertForm(true)}
                style={{ justifySelf: 'start', padding: '10px 20px', fontSize: '.88rem', border: 'none', cursor: 'pointer' }}>
                Convert to Customer
              </button>
            ) : (
              <div style={{ background: '#fff8fb', border: '1px solid #f0dce7', borderRadius: 12, padding: '16px 18px', display: 'grid', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr', gap: 10 }}>
                  <label style={{ display: 'grid', gap: 4, fontSize: '.84rem', fontWeight: 700, color: '#765d68' }}>
                    Salutation
                    <select value={convertSalutation} onChange={(e) => setConvertSalutation(e.target.value)}
                      style={{ padding: '8px 10px', border: '1px solid #decbd5', borderRadius: 8, background: '#fff', font: 'inherit', fontSize: '.86rem' }}>
                      <option value="">—</option>
                      {['Mr', 'Mrs', 'Ms', 'Dr', 'Prof'].map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </label>
                  <label style={{ display: 'grid', gap: 4, fontSize: '.84rem', fontWeight: 700, color: '#765d68' }}>
                    First Name *
                    <input value={convertFirstName} onChange={(e) => setConvertFirstName(e.target.value)}
                      style={{ padding: '8px 10px', border: '1px solid #decbd5', borderRadius: 8, background: '#fff', font: 'inherit', fontSize: '.86rem' }} />
                  </label>
                  <label style={{ display: 'grid', gap: 4, fontSize: '.84rem', fontWeight: 700, color: '#765d68' }}>
                    Last Name
                    <input value={convertLastName} onChange={(e) => setConvertLastName(e.target.value)}
                      style={{ padding: '8px 10px', border: '1px solid #decbd5', borderRadius: 8, background: '#fff', font: 'inherit', fontSize: '.86rem' }} />
                  </label>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="button" type="button" onClick={convertToCustomer} disabled={converting}
                    style={{ padding: '9px 20px', fontSize: '.88rem', border: 'none', cursor: 'pointer' }}>
                    {converting ? 'Converting…' : 'Confirm & Convert'}
                  </button>
                  <button type="button" onClick={() => setShowConvertForm(false)}
                    style={{ padding: '9px 16px', fontSize: '.88rem', border: '1px solid #f0dce7', borderRadius: 8, background: '#fff', color: '#765d68', cursor: 'pointer', font: 'inherit' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {convertMsg && <p style={{ margin: '8px 0 0', color: convertMsg.startsWith('Error') ? '#be123c' : '#166534', fontSize: '.84rem', fontWeight: 700 }}>{convertMsg}</p>}
      </div>

      {/* 10. Booking Checklist */}
      <div>
        <SectionHeading>Booking Checklist</SectionHeading>
        {!checklistLoaded ? (
          <p style={{ color: '#765d68', fontSize: '.88rem' }}>Loading…</p>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {checklistItems.length === 0 && (
              <p style={{ margin: 0, color: '#765d68', fontSize: '.88rem' }}>No items yet. Convert to customer to seed the default checklist, or add items below.</p>
            )}
            {checklistItems.map((item) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: item.is_done ? '#f0fdf4' : '#fff', border: `1px solid ${item.is_done ? '#bbf7d0' : '#f0dce7'}` }}>
                <input type="checkbox" checked={item.is_done} onChange={() => void toggleItem(item)}
                  style={{ width: 17, height: 17, accentColor: '#166534', cursor: 'pointer', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '.9rem', color: item.is_done ? '#166534' : '#24151c', textDecoration: item.is_done ? 'line-through' : 'none' }}>{item.item_name}</span>
                <button type="button" onClick={() => void deleteChecklistItem(item.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#be123c', fontSize: '.8rem', padding: '2px 6px', borderRadius: 6 }}
                  aria-label={`Remove ${item.item_name}`}>✕</button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <input type="text" placeholder="Add custom item…" value={newItem} onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void addChecklistItem(); } }}
                style={{ flex: 1, padding: '9px 12px', border: '1px solid #decbd5', borderRadius: 10, background: '#fffdfd', font: 'inherit', color: '#24151c', fontSize: '.88rem' }} />
              <button type="button" className="button" onClick={addChecklistItem} disabled={!newItem.trim()}
                style={{ padding: '9px 16px', fontSize: '.88rem', whiteSpace: 'nowrap', border: 'none', cursor: 'pointer' }}>
                + Add
              </button>
            </div>
            {checklistItems.length > 0 && (
              <p style={{ margin: '4px 0 0', color: '#765d68', fontSize: '.8rem' }}>
                {checklistItems.filter((i) => i.is_done).length} / {checklistItems.length} done
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

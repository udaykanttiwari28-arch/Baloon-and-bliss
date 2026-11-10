'use client';

import { useRef, useState } from 'react';

export interface EnquiryDetail {
  id: string;
  reference: string;
  name: string;
  email?: string;
  mobile?: string;
  event_date?: string;
  start_time?: string;
  end_time?: string;
  venue?: string;
  postal_code?: string;
  special_requirements?: string;
  package_slug?: string;
  amount_total_minor: number;
  deposit_paid_minor: number;
  admin_notes?: string;
  mockup_storage_path?: string;
  source_channel?: string;
  carousell_id?: string;
  facebook_id?: string;
  celebration_type?: string;
  status: string;
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
  return `SGD ${(minor / 100).toFixed(2)}`;
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

export default function EnquiryDetailPanel({ enquiry, onUpdated }: EnquiryDetailPanelProps) {
  const [amountInput, setAmountInput] = useState((enquiry.amount_total_minor / 100).toFixed(2));
  const [depositInput, setDepositInput] = useState((enquiry.deposit_paid_minor / 100).toFixed(2));
  const [notes, setNotes] = useState(enquiry.admin_notes ?? '');
  const [mockupPath, setMockupPath] = useState(enquiry.mockup_storage_path ?? '');
  const [savingPayment, setSavingPayment] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [paymentMsg, setPaymentMsg] = useState('');
  const [mockupMsg, setMockupMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalMinor = Math.round(parseFloat(amountInput) * 100) || 0;
  const paidMinor = Math.round(parseFloat(depositInput) * 100) || 0;
  const balance = totalMinor - paidMinor;

  async function savePayment() {
    setSavingPayment(true); setPaymentMsg('');
    const res = await fetch(`/api/admin/enquiries/${enquiry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount_total_minor: totalMinor, deposit_paid_minor: paidMinor }),
    });
    setSavingPayment(false);
    if (res.ok) { onUpdated({ amount_total_minor: totalMinor, deposit_paid_minor: paidMinor }); setPaymentMsg('Saved'); setTimeout(() => setPaymentMsg(''), 2000); }
    else { const j = await res.json() as { error?: string }; setPaymentMsg(j.error ?? 'Error saving'); }
  }

  async function saveNotes() {
    setSavingNotes(true);
    const res = await fetch(`/api/admin/enquiries/${enquiry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_notes: notes }),
    });
    setSavingNotes(false);
    if (res.ok) onUpdated({ admin_notes: notes });
  }

  async function uploadMockup(file: File) {
    if (file.size > 10 * 1024 * 1024) { setMockupMsg('File too large (max 10 MB).'); return; }
    setUploading(true); setMockupMsg('Uploading…');
    const form = new FormData(); form.append('file', file);
    const res = await fetch(`/api/admin/enquiries/${enquiry.id}/mockup`, { method: 'POST', body: form });
    setUploading(false);
    if (res.ok) {
      const j = await res.json() as { path?: string };
      setMockupPath(j.path ?? file.name);
      onUpdated({ mockup_storage_path: j.path ?? file.name });
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
    if (res.ok) { setMockupPath(''); onUpdated({ mockup_storage_path: undefined }); setMockupMsg(''); }
    else { const j = await res.json() as { error?: string }; setMockupMsg(j.error ?? 'Error removing'); }
  }

  const mockupFilename = mockupPath ? mockupPath.split('/').pop() ?? mockupPath : '';

  function BalanceChip() {
    if (totalMinor === 0) return null;
    if (balance <= 0) return <span style={{ padding: '5px 11px', borderRadius: 999, background: '#dcfce7', color: '#166534', fontSize: '.78rem', fontWeight: 700 }}>Paid in Full</span>;
    if (paidMinor === 0) return <span style={{ padding: '5px 11px', borderRadius: 999, background: '#fef2f2', color: '#991b1b', fontSize: '.78rem', fontWeight: 700 }}>Unpaid: {fmtSGD(balance)}</span>;
    return <span style={{ padding: '5px 11px', borderRadius: 999, background: '#fef3c7', color: '#92400e', fontSize: '.78rem', fontWeight: 700 }}>Partial: {fmtSGD(balance)} remaining</span>;
  }

  return (
    <div style={{ padding: '20px 22px 24px', background: '#fffbf7', borderTop: '1px solid #f0dce7', display: 'grid', gap: 28 }}>

      {/* 1. Customer & Event Info */}
      <div>
        <SectionHeading>Customer &amp; Event</SectionHeading>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px 20px' }}>
          <InfoRow label="Name" value={enquiry.name} />
          <InfoRow label="Email" value={enquiry.email ? <a href={`mailto:${enquiry.email}`} style={{ color: '#db2777', textDecoration: 'none' }}>{enquiry.email}</a> : null} />
          <InfoRow label="Phone" value={enquiry.mobile ? <a href={`tel:${enquiry.mobile}`} style={{ color: '#db2777', textDecoration: 'none' }}>{enquiry.mobile}</a> : null} />
          <InfoRow label="Source" value={enquiry.source_channel} />
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

      {/* 2. Payment Tracking */}
      <div>
        <SectionHeading>Payment Tracking</SectionHeading>
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
            <label style={{ display: 'grid', gap: 6, color: '#765d68', fontSize: '.86rem', fontWeight: 700 }}>
              Quoted Amount (SGD)
              <input
                type="number"
                step="0.01"
                min="0"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                style={{ padding: '10px 12px', border: '1px solid #decbd5', borderRadius: 10, background: '#fffdfd', font: 'inherit', color: '#24151c' }}
              />
            </label>
            <label style={{ display: 'grid', gap: 6, color: '#765d68', fontSize: '.86rem', fontWeight: 700 }}>
              Deposit Paid (SGD)
              <input
                type="number"
                step="0.01"
                min="0"
                value={depositInput}
                onChange={(e) => setDepositInput(e.target.value)}
                style={{ padding: '10px 12px', border: '1px solid #decbd5', borderRadius: 10, background: '#fffdfd', font: 'inherit', color: '#24151c' }}
              />
            </label>
            <button
              className="button"
              type="button"
              onClick={savePayment}
              disabled={savingPayment}
              style={{ marginTop: 0, padding: '11px 18px', fontSize: '.88rem', whiteSpace: 'nowrap' }}
            >
              {savingPayment ? 'Saving…' : 'Save'}
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: '#765d68', fontSize: '.86rem', fontWeight: 700 }}>Balance:</span>
            <BalanceChip />
            {paymentMsg && <span style={{ color: paymentMsg === 'Saved' ? '#166534' : '#be123c', fontSize: '.82rem', fontWeight: 700 }}>{paymentMsg}</span>}
          </div>
        </div>
      </div>

      {/* 3. Requirements & Notes */}
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
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
              placeholder="Internal notes (auto-saved on blur)…"
              style={{ padding: '10px 12px', border: '1px solid #decbd5', borderRadius: 10, background: '#fffdfd', font: 'inherit', color: '#24151c', resize: 'vertical' }}
            />
          </label>
          {savingNotes && <span style={{ color: '#765d68', fontSize: '.8rem' }}>Saving notes…</span>}
        </div>
      </div>

      {/* 4. Agreed Mockup */}
      <div>
        <SectionHeading>Agreed Mockup</SectionHeading>
        {mockupPath ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '14px 16px', borderRadius: 12, border: '1px solid #f0dce7', background: '#fff' }}>
            <span style={{ fontSize: '1.4rem' }}>📎</span>
            <span style={{ flex: 1, color: '#24151c', fontSize: '.9rem', fontWeight: 700, wordBreak: 'break-all' }}>{mockupFilename}</span>
            <a
              href={`/api/admin/enquiries/${enquiry.id}/mockup`}
              target="_blank"
              rel="noreferrer"
              className="text-link"
              style={{ fontSize: '.86rem' }}
            >
              View ↗
            </a>
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
            <p style={{ margin: 0, color: '#765d68', fontSize: '.82rem' }}>Image or PDF, max 10 MB · click or drag &amp; drop</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          style={{ display: 'none' }}
          onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadMockup(file); e.target.value = ''; }}
        />
        {mockupMsg && (
          <p style={{ margin: '8px 0 0', color: mockupMsg.includes('fail') || mockupMsg.includes('large') || mockupMsg.includes('Error') ? '#be123c' : '#765d68', fontSize: '.84rem', fontWeight: 700 }}>
            {mockupMsg}
          </p>
        )}
      </div>
    </div>
  );
}

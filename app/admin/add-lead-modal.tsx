'use client';

import { useState } from 'react';

interface AddLeadModalProps {
  onClose: () => void;
  onCreated: (enquiry: { id: string; reference: string; name: string }) => void;
}

const SOURCE_CHANNELS = ['Instagram', 'Google Ad', 'TikTok', 'Carousell', 'Facebook', 'WhatsApp', 'Referral', 'Other'];
const OCCASIONS = ['1st Birthday', '2nd Birthday', '3rd Birthday', 'Kids Birthday', 'Teen Birthday', 'Adult Birthday', 'Baby Shower', 'Gender Reveal', 'Wedding', 'Solemnisation', 'Proposal', 'Corporate', 'Other'];
const PACKAGES = [
  { value: 'classic-setup', label: 'Classic Setup' },
  { value: 'signature-setup', label: 'Signature Setup' },
  { value: 'premium-setup', label: 'Premium Setup' },
  { value: 'custom-setup', label: 'Custom Setup' },
];

type LeadType = 'individual' | 'corporate';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ gridColumn: '1 / -1', paddingTop: 4 }}>
      <span style={{ display: 'block', color: '#765d68', fontSize: '.7rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', borderBottom: '1px solid #f0dce7', paddingBottom: 6, marginBottom: 2 }}>
        {children}
      </span>
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <span style={{ color: '#be123c', fontSize: '.75rem', fontWeight: 700, marginTop: 2 }}>{msg}</span>;
}

export default function AddLeadModal({ onClose, onCreated }: AddLeadModalProps) {
  const [leadType, setLeadType] = useState<LeadType>('individual');
  const [sourceChannel, setSourceChannel] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Controlled fields that need validation
  const [email, setEmail] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [amountTotal, setAmountTotal] = useState('');
  const [depositPaid, setDepositPaid] = useState('');
  const [occasion, setOccasion] = useState('');
  const [occasionOther, setOccasionOther] = useState('');

  function validate(data: {
    email: string; postal_code: string;
    start_time: string; end_time: string;
    amount_total: string; deposit_paid: string;
  }) {
    const errs: Record<string, string> = {};
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errs.email = 'Enter a valid email address.';
    }
    if (data.postal_code && !/^[0-9]{6}$/.test(data.postal_code)) {
      errs.postal_code = 'Postal code must be exactly 6 digits.';
    }
    if (data.start_time && data.end_time && data.end_time <= data.start_time) {
      errs.end_time = 'End time must be after start time.';
    }
    const amt = parseFloat(data.amount_total);
    if (data.amount_total && (isNaN(amt) || amt < 0)) {
      errs.amount_total = 'Enter a valid amount.';
    }
    const dep = parseFloat(data.deposit_paid);
    if (data.deposit_paid && (isNaN(dep) || dep < 0)) {
      errs.deposit_paid = 'Enter a valid deposit amount.';
    }
    if (!isNaN(amt) && !isNaN(dep) && dep > amt && amt > 0) {
      errs.deposit_paid = 'Deposit cannot exceed the quoted amount.';
    }
    return errs;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;

    const errs = validate({
      email: email.trim(),
      postal_code: postalCode.trim(),
      start_time: startTime,
      end_time: endTime,
      amount_total: amountTotal,
      deposit_paid: depositPaid,
    });
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);

    const amtMinor = amountTotal ? Math.round(parseFloat(amountTotal) * 100) : 0;
    const depMinor = depositPaid ? Math.round(parseFloat(depositPaid) * 100) : 0;

    const payload = {
      name: data.name,
      lead_type: leadType,
      company_name: leadType === 'corporate' ? (data.company_name || null) : null,
      source_channel: sourceChannel || null,
      carousell_id: data.carousell_id || null,
      facebook_id: data.facebook_id || null,
      mobile: data.mobile || null,
      email: email.trim() || null,
      celebration_type: occasion === 'Other' ? (occasionOther.trim() || 'Other') : (occasion || null),
      event_date: data.event_date || null,
      start_time: startTime || null,
      end_time: endTime || null,
      package_slug: data.package_slug || null,
      venue: data.venue || null,
      postal_code: postalCode.trim() || null,
      special_requirements: data.special_requirements || null,
      amount_total_minor: amtMinor,
      deposit_paid_minor: depMinor,
      whatsapp_opt_in: data.whatsapp_opt_in === 'on',
    };

    try {
      const res = await fetch('/api/admin/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      let json: { id?: string; reference?: string; error?: string } = {};
      try { json = await res.json() as typeof json; } catch { /* non-JSON response */ }
      if (!res.ok) { setError(json.error ?? `Server error (${res.status}). Check Vercel logs.`); setSubmitting(false); return; }
      if (json.id && json.reference) {
        onCreated({ id: json.id, reference: json.reference, name: payload.name });
      }
    } catch (err) {
      setError(`Network error: ${String(err)}`);
      setSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '11px 13px', border: '1px solid #decbd5', borderRadius: 10, background: '#fffdfd', color: '#24151c', font: 'inherit' };
  const labelStyle: React.CSSProperties = { display: 'grid', gap: 5, color: '#765d68', fontSize: '.88rem', fontWeight: 700 };
  const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(36,21,28,.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 16px', overflowY: 'auto' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: '100%', maxWidth: 780, background: '#fff', borderRadius: 24, boxShadow: '0 24px 64px rgba(36,21,28,.22)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: '1px solid #f0dce7', background: 'linear-gradient(135deg,#fff,#fff8fb)' }}>
          <div>
            <p className="eyebrow" style={{ margin: 0 }}>Admin</p>
            <h2 style={{ margin: '4px 0 0', fontSize: '1.5rem' }}>Add new lead</h2>
          </div>
          <button className="text-button" type="button" onClick={onClose} aria-label="Close" style={{ fontSize: '1.4rem', lineHeight: 1 }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px 28px 28px' }}>
          <div style={{ display: 'grid', gap: 20 }}>

            {/* ── CONTACT ── */}
            <div style={{ display: 'grid', gap: 14 }}>
              <SectionLabel>Contact</SectionLabel>

              {/* Name */}
              <label style={labelStyle}>
                Customer Name *
                <input name="name" type="text" required style={inputStyle} />
              </label>

              {/* Lead type toggle */}
              <div>
                <span style={{ display: 'block', color: '#765d68', fontSize: '.88rem', fontWeight: 700, marginBottom: 8 }}>Lead Type</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['individual', 'corporate'] as LeadType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setLeadType(t)}
                      style={{
                        padding: '8px 18px', borderRadius: 999, border: '1.5px solid',
                        borderColor: leadType === t ? '#db2777' : '#f0dce7',
                        background: leadType === t ? '#fce7f3' : '#fff',
                        color: leadType === t ? '#db2777' : '#765d68',
                        fontWeight: leadType === t ? 700 : 400,
                        cursor: 'pointer', font: 'inherit', fontSize: '.86rem',
                        textTransform: 'capitalize',
                      }}
                    >
                      {t === 'individual' ? '👤 Individual' : '🏢 Corporate'}
                    </button>
                  ))}
                </div>
              </div>

              {leadType === 'corporate' && (
                <label style={labelStyle}>
                  Company Name
                  <input name="company_name" type="text" style={inputStyle} />
                </label>
              )}

              <div style={gridStyle}>
                <label style={labelStyle}>
                  Source Channel
                  <select name="source_channel" value={sourceChannel} onChange={(e) => setSourceChannel(e.target.value)} style={inputStyle}>
                    <option value="">— Select source —</option>
                    {SOURCE_CHANNELS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                {sourceChannel === 'Carousell' && (
                  <label style={labelStyle}>Carousell ID<input name="carousell_id" type="text" style={inputStyle} /></label>
                )}
                {sourceChannel === 'Facebook' && (
                  <label style={labelStyle}>Facebook ID / Profile<input name="facebook_id" type="text" style={inputStyle} /></label>
                )}
                {sourceChannel !== 'Carousell' && sourceChannel !== 'Facebook' && (
                  <label style={labelStyle}>
                    Phone Number
                    <input name="mobile" type="tel" style={inputStyle} />
                  </label>
                )}
              </div>

              {(sourceChannel === 'Carousell' || sourceChannel === 'Facebook') && (
                <label style={labelStyle}>
                  Phone Number
                  <input name="mobile" type="tel" style={inputStyle} />
                </label>
              )}

              <div style={gridStyle}>
                <div>
                  <label style={labelStyle}>
                    Email Address
                    <input
                      name="email"
                      type="text"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: '' })); }}
                      style={{ ...inputStyle, borderColor: fieldErrors.email ? '#be123c' : '#decbd5' }}
                    />
                  </label>
                  <FieldError msg={fieldErrors.email} />
                </div>
                <div /> {/* spacer */}
              </div>
            </div>

            {/* ── EVENT ── */}
            <div style={{ display: 'grid', gap: 14 }}>
              <SectionLabel>Event</SectionLabel>

              <div style={gridStyle}>
                <div style={{ display: 'grid', gap: 6 }}>
                  <label style={labelStyle}>
                    Occasion
                    <select
                      value={occasion}
                      onChange={(e) => { setOccasion(e.target.value); if (e.target.value !== 'Other') setOccasionOther(''); }}
                      style={inputStyle}
                    >
                      <option value="">— Select occasion —</option>
                      {OCCASIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </label>
                  {occasion === 'Other' && (
                    <input
                      type="text"
                      value={occasionOther}
                      onChange={(e) => setOccasionOther(e.target.value)}
                      style={inputStyle}
                      autoFocus
                    />
                  )}
                </div>
                <label style={labelStyle}>
                  Package
                  <select name="package_slug" style={inputStyle}>
                    <option value="">— Select package —</option>
                    {PACKAGES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </label>
              </div>

              <div style={gridStyle}>
                <label style={labelStyle}>
                  Date of Event
                  <input name="event_date" type="date" style={inputStyle} />
                </label>
                <div /> {/* spacer */}
              </div>

              <div style={gridStyle}>
                <div>
                  <label style={labelStyle}>
                    Start Time
                    <input
                      name="start_time"
                      type="time"
                      value={startTime}
                      onChange={(e) => { setStartTime(e.target.value); setFieldErrors((p) => ({ ...p, end_time: '' })); }}
                      style={inputStyle}
                    />
                  </label>
                </div>
                <div>
                  <label style={labelStyle}>
                    End Time
                    <input
                      name="end_time"
                      type="time"
                      value={endTime}
                      onChange={(e) => { setEndTime(e.target.value); setFieldErrors((p) => ({ ...p, end_time: '' })); }}
                      style={{ ...inputStyle, borderColor: fieldErrors.end_time ? '#be123c' : '#decbd5' }}
                    />
                  </label>
                  <FieldError msg={fieldErrors.end_time} />
                </div>
              </div>

              <label style={labelStyle}>
                Venue
                <input name="venue" type="text" style={inputStyle} />
              </label>

              <div>
                <label style={labelStyle}>
                  Postal Code
                  <input
                    name="postal_code"
                    type="text"
                    maxLength={6}
                    value={postalCode}
                    onChange={(e) => { setPostalCode(e.target.value.replace(/\D/g, '')); setFieldErrors((p) => ({ ...p, postal_code: '' })); }}
                    style={{ ...inputStyle, maxWidth: 160, borderColor: fieldErrors.postal_code ? '#be123c' : '#decbd5' }}
                  />
                </label>
                <FieldError msg={fieldErrors.postal_code} />
              </div>
            </div>

            {/* ── FINANCIALS ── */}
            <div style={{ display: 'grid', gap: 14 }}>
              <SectionLabel>Financials</SectionLabel>
              <div style={gridStyle}>
                <div>
                  <label style={labelStyle}>
                    Quoted Amount (SGD)
                    <input
                      name="amount_total"
                      type="number"
                      step="0.01"
                      min="0"
                      value={amountTotal}
                      onChange={(e) => { setAmountTotal(e.target.value); setFieldErrors((p) => ({ ...p, amount_total: '', deposit_paid: '' })); }}
                      style={{ ...inputStyle, borderColor: fieldErrors.amount_total ? '#be123c' : '#decbd5' }}
                    />
                  </label>
                  <FieldError msg={fieldErrors.amount_total} />
                </div>
                <div>
                  <label style={labelStyle}>
                    Deposit Paid (SGD)
                    <input
                      name="deposit_paid"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={depositPaid}
                      onChange={(e) => { setDepositPaid(e.target.value); setFieldErrors((p) => ({ ...p, deposit_paid: '' })); }}
                      style={{ ...inputStyle, borderColor: fieldErrors.deposit_paid ? '#be123c' : '#decbd5' }}
                    />
                  </label>
                  <FieldError msg={fieldErrors.deposit_paid} />
                </div>
              </div>
            </div>

            {/* ── NOTES ── */}
            <div style={{ display: 'grid', gap: 14 }}>
              <SectionLabel>Notes</SectionLabel>
              <label style={labelStyle}>
                Special Requirements / Notes
                <textarea name="special_requirements" rows={3} placeholder="Theme, colours, special requests…" style={{ ...inputStyle, resize: 'vertical' }} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#765d68', fontSize: '.88rem', fontWeight: 700, cursor: 'pointer' }}>
                <input name="whatsapp_opt_in" type="checkbox" style={{ width: 'auto' }} />
                Customer opted in to WhatsApp updates
              </label>
            </div>

            {error && <p className="form-error" role="alert">{error}</p>}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 4 }}>
              <button className="text-button" type="button" onClick={onClose} disabled={submitting}>Cancel</button>
              <button
                className="button"
                type="submit"
                disabled={submitting}
                style={{ margin: 0, border: 'none', cursor: 'pointer' }}
              >
                {submitting ? 'Saving…' : 'Add Lead'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

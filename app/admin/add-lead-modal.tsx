'use client';

import { useState } from 'react';

interface AddLeadModalProps {
  onClose: () => void;
  onCreated: (enquiry: { id: string; reference: string; name: string }) => void;
}

const SOURCE_CHANNELS = ['Instagram', 'Google Ad', 'TikTok', 'Carousell', 'Facebook', 'WhatsApp', 'Referral', 'Other'];
const OCCASIONS = ['1st Birthday', '2nd Birthday', '3rd Birthday', 'Kids Birthday', 'Teen Birthday', 'Adult Birthday', 'Baby Shower', 'Gender Reveal', 'Wedding', 'Solemnisation', 'Proposal', 'Corporate'];
const PACKAGES = [
  { value: 'classic-setup', label: 'Classic Setup' },
  { value: 'signature-setup', label: 'Signature Setup' },
  { value: 'premium-setup', label: 'Premium Setup' },
  { value: 'custom-setup', label: 'Custom Setup' },
];

export default function AddLeadModal({ onClose, onCreated }: AddLeadModalProps) {
  const [sourceChannel, setSourceChannel] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;

    const payload = {
      name: data.name,
      source_channel: data.source_channel || null,
      carousell_id: data.carousell_id || null,
      facebook_id: data.facebook_id || null,
      mobile: data.mobile || null,
      email: data.email || null,
      celebration_type: data.occasion || null,
      event_date: data.event_date || null,
      start_time: data.start_time || null,
      end_time: data.end_time || null,
      package_slug: data.package_slug || null,
      venue: data.venue || null,
      postal_code: data.postal_code || null,
      special_requirements: data.special_requirements || null,
      amount_total_minor: data.amount_total ? Math.round(parseFloat(data.amount_total) * 100) : 0,
      deposit_paid_minor: data.deposit_paid ? Math.round(parseFloat(data.deposit_paid) * 100) : 0,
      whatsapp_opt_in: data.whatsapp_opt_in === 'on',
    };

    try {
      const res = await fetch('/api/admin/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json() as { id?: string; reference?: string; error?: string };
      if (!res.ok) { setError(json.error ?? 'Something went wrong.'); setSubmitting(false); return; }
      onCreated({ id: json.id!, reference: json.reference!, name: payload.name });
    } catch {
      setError('Network error. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(36,21,28,.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 16px 32px', overflowY: 'auto' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: '100%', maxWidth: 760, background: '#fff', borderRadius: 24, boxShadow: '0 24px 64px rgba(36,21,28,.22)', overflow: 'hidden' }}>
        {/* Modal header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 28px', borderBottom: '1px solid #f0dce7', background: 'linear-gradient(135deg,#fff,#fff8fb)' }}>
          <div>
            <p className="eyebrow" style={{ margin: 0 }}>Admin</p>
            <h2 style={{ margin: '4px 0 0', fontSize: '1.6rem' }}>Add new lead</h2>
          </div>
          <button className="text-button" type="button" onClick={onClose} aria-label="Close" style={{ fontSize: '1.4rem', lineHeight: 1 }}>✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: 28 }}>
          <div className="booking-form">

            {/* Customer Name — required */}
            <label>
              Customer Name *
              <input name="name" type="text" required placeholder="e.g. Sarah Tan" />
            </label>

            {/* Source */}
            <div className="form-grid">
              <label>
                Source Channel
                <select name="source_channel" value={sourceChannel} onChange={(e) => setSourceChannel(e.target.value)}>
                  <option value="">— Select source —</option>
                  {SOURCE_CHANNELS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>

              {sourceChannel === 'Carousell' && (
                <label>
                  Carousell ID
                  <input name="carousell_id" type="text" placeholder="@username" />
                </label>
              )}
              {sourceChannel === 'Facebook' && (
                <label>
                  Facebook ID / Profile
                  <input name="facebook_id" type="text" placeholder="facebook.com/name" />
                </label>
              )}
              {sourceChannel !== 'Carousell' && sourceChannel !== 'Facebook' && (
                <label>
                  Occasion
                  <select name="occasion">
                    <option value="">— Select occasion —</option>
                    {OCCASIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </label>
              )}
            </div>

            {/* Show occasion separately when Carousell/Facebook occupies the second column */}
            {(sourceChannel === 'Carousell' || sourceChannel === 'Facebook') && (
              <label>
                Occasion
                <select name="occasion">
                  <option value="">— Select occasion —</option>
                  {OCCASIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>
            )}

            {/* Contact */}
            <div className="form-grid">
              <label>
                Phone Number
                <input name="mobile" type="tel" placeholder="+65 9123 4567" />
              </label>
              <label>
                Email Address
                <input name="email" type="email" placeholder="customer@email.com" />
              </label>
            </div>

            {/* Event date & time */}
            <div className="form-grid">
              <label>
                Date of Event
                <input name="event_date" type="date" />
              </label>
              <label>
                Package
                <select name="package_slug">
                  <option value="">— Select package —</option>
                  {PACKAGES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </label>
            </div>

            <div className="form-grid">
              <label>
                Start Time
                <input name="start_time" type="time" />
              </label>
              <label>
                End Time
                <input name="end_time" type="time" />
              </label>
            </div>

            {/* Venue */}
            <div className="form-grid">
              <label style={{ gridColumn: '1 / -1' }}>
                Venue
                <input name="venue" type="text" placeholder="e.g. White Rabbit Restaurant, Dempsey" />
              </label>
            </div>
            <label>
              Postal Code
              <input name="postal_code" type="text" maxLength={6} placeholder="6-digit postal code" style={{ maxWidth: 160 }} />
            </label>

            {/* Requirements */}
            <label>
              Special Requirements / Notes
              <textarea name="special_requirements" rows={3} placeholder="Theme, colours, special requests…" />
            </label>

            {/* Payment */}
            <fieldset>
              <legend>Payment</legend>
              <div className="form-grid">
                <label>
                  Quoted Amount (SGD)
                  <input name="amount_total" type="number" step="0.01" min="0" placeholder="0.00" />
                </label>
                <label>
                  Deposit Paid (SGD)
                  <input name="deposit_paid" type="number" step="0.01" min="0" placeholder="0.00" />
                </label>
              </div>
            </fieldset>

            {/* WhatsApp */}
            <label className="checkbox-label">
              <input name="whatsapp_opt_in" type="checkbox" />
              Customer opted in to WhatsApp updates
            </label>

            {error && <p className="form-error" role="alert">{error}</p>}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
              <button className="text-button" type="button" onClick={onClose} disabled={submitting}>Cancel</button>
              <button className="button" type="submit" disabled={submitting} style={{ marginTop: 0 }}>
                {submitting ? 'Saving…' : 'Add lead'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

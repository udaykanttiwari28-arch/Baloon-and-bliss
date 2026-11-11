'use client';

import { useEffect, useState } from 'react';

interface InvoicePanelProps {
  enquiryId: string;
  enquiryName: string;
  amountTotalMinor: number;
  packageSlug?: string | null;
}

type InvoiceStatus = 'draft' | 'sent' | 'unpaid' | 'paid';

interface LineItem {
  description: string;
  qty: number;
  unit_price: number; // SGD
}

interface Invoice {
  id: string;
  invoice_number: string;
  status: InvoiceStatus;
  total_minor: number;
  issued_date: string | null;
  due_date: string | null;
}

const STATUS_STYLES: Record<InvoiceStatus, { background: string; color: string }> = {
  draft:  { background: '#f1f5f9', color: '#475569' },
  sent:   { background: '#dbeafe', color: '#1d4ed8' },
  unpaid: { background: '#fef3c7', color: '#92400e' },
  paid:   { background: '#dcfce7', color: '#166534' },
};

const PACKAGE_NAMES: Record<string, string> = {
  'classic-setup': 'Classic Setup – Balloon Decoration',
  'signature-setup': 'Signature Setup – Balloon Decoration',
  'premium-setup': 'Premium Setup – Balloon Decoration',
  'custom-setup': 'Custom Setup – Balloon Decoration',
};

const GST_RATE = 0.09;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function plusDays(n: number) {
  const d = new Date(); d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function fmtSGD(minor: number) {
  return `S$${(minor / 100).toFixed(2)}`;
}
function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-SG', { dateStyle: 'medium' }).format(new Date(`${iso}T00:00:00`));
}

function StatusChip({ status }: { status: InvoiceStatus }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
  return (
    <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: '.72rem', fontWeight: 700, textTransform: 'capitalize', ...s }}>
      {status}
    </span>
  );
}

export default function InvoicePanel({ enquiryId, enquiryName, amountTotalMinor, packageSlug }: InvoicePanelProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState('');

  // Line items state
  const defaultDesc = packageSlug ? (PACKAGE_NAMES[packageSlug] ?? 'Balloon decoration service') : 'Balloon decoration service';
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: defaultDesc, qty: 1, unit_price: amountTotalMinor / 100 },
  ]);
  const [issuedAt, setIssuedAt] = useState(todayISO());
  const [dueDate, setDueDate] = useState(plusDays(7));
  const [invoiceNotes, setInvoiceNotes] = useState('');

  useEffect(() => {
    fetch(`/api/admin/enquiries/${enquiryId}/invoices`)
      .then((r) => r.json())
      .then((j: { invoices?: Invoice[] }) => { setInvoices(j.invoices ?? []); })
      .catch(() => { /* table may not exist yet */ })
      .finally(() => setLoaded(true));
  }, [enquiryId]);

  const subtotal = lineItems.reduce((s, item) => s + item.qty * item.unit_price, 0);
  const gst = subtotal * GST_RATE;
  const total = subtotal + gst;

  function updateLineItem(index: number, patch: Partial<LineItem>) {
    setLineItems((prev) => prev.map((item, i) => i === index ? { ...item, ...patch } : item));
  }

  function addLineItem() {
    setLineItems((prev) => [...prev, { description: '', qty: 1, unit_price: 0 }]);
  }

  function removeLineItem(index: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function createInvoice() {
    setCreating(true); setCreateMsg('');
    const payload = {
      line_items: lineItems.map((item) => ({
        description: item.description,
        quantity: item.qty,
        unit_price_minor: Math.round(item.unit_price * 100),
      })),
      subtotal_minor: Math.round(subtotal * 100),
      gst_minor: Math.round(gst * 100),
      total_minor: Math.round(total * 100),
      issued_date: issuedAt || null,
      due_date: dueDate || null,
      notes: invoiceNotes || null,
    };
    const res = await fetch(`/api/admin/enquiries/${enquiryId}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const j = await res.json() as { invoice?: Invoice; error?: string };
    setCreating(false);
    if (res.ok && j.invoice) {
      setInvoices((prev) => [j.invoice!, ...prev]);
      setShowCreate(false);
      setCreateMsg('');
    } else {
      setCreateMsg(j.error ?? 'Failed to create invoice.');
    }
  }

  async function updateStatus(invoiceId: string, status: InvoiceStatus) {
    const res = await fetch(`/api/admin/invoices/${invoiceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setInvoices((prev) => prev.map((inv) => inv.id === invoiceId ? { ...inv, status } : inv));
    }
  }

  const inputStyle: React.CSSProperties = {
    padding: '8px 10px', border: '1px solid #decbd5', borderRadius: 8,
    background: '#fffdfd', font: 'inherit', color: '#24151c', fontSize: '.86rem', width: '100%',
  };
  const labelStyle: React.CSSProperties = {
    display: 'grid', gap: 4, color: '#765d68', fontSize: '.8rem', fontWeight: 700,
  };

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {!loaded && <p style={{ color: '#765d68', fontSize: '.86rem' }}>Loading invoices…</p>}

      {/* Invoice list */}
      {loaded && invoices.length > 0 && (
        <div style={{ display: 'grid', gap: 8 }}>
          {invoices.map((inv) => (
            <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, border: '1px solid #f0dce7', background: '#fff', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '.88rem', color: '#24151c', minWidth: 140 }}>{inv.invoice_number}</span>
              <StatusChip status={inv.status} />
              <span style={{ color: '#24151c', fontWeight: 700, fontSize: '.9rem', minWidth: 90 }}>{fmtSGD(inv.total_minor)}</span>
              <span style={{ color: '#765d68', fontSize: '.8rem', flex: 1 }}>Issued {fmtDate(inv.issued_date)}</span>
              <select
                value={inv.status}
                onChange={(e) => void updateStatus(inv.id, e.target.value as InvoiceStatus)}
                style={{ ...inputStyle, width: 'auto', padding: '6px 8px', fontSize: '.8rem' }}
                aria-label="Update invoice status"
              >
                {(['draft', 'sent', 'unpaid', 'paid'] as InvoiceStatus[]).map((s) => (
                  <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <a
                href={`/api/admin/invoices/${inv.id}/pdf`}
                target="_blank"
                rel="noreferrer"
                style={{ padding: '6px 12px', borderRadius: 8, background: '#f5f0f7', color: '#8b5cf6', fontWeight: 700, fontSize: '.8rem', textDecoration: 'none', whiteSpace: 'nowrap' }}
              >
                ↓ PDF
              </a>
            </div>
          ))}
        </div>
      )}

      {loaded && invoices.length === 0 && !showCreate && (
        <p style={{ margin: 0, color: '#765d68', fontSize: '.86rem' }}>No invoices yet.</p>
      )}

      {/* Create invoice form */}
      {showCreate && (
        <div style={{ padding: '18px 20px', borderRadius: 14, border: '1px solid #f0dce7', background: '#fff', display: 'grid', gap: 16 }}>
          <p style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: '1rem', color: '#24151c', fontWeight: 700 }}>New Invoice — {enquiryName}</p>

          {/* Line items */}
          <div>
            <span style={{ display: 'block', color: '#765d68', fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Line Items</span>
            <div style={{ display: 'grid', gap: 8 }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 110px 90px 32px', gap: 8, padding: '0 4px' }}>
                {['Description', 'Qty', 'Unit Price', 'Total', ''].map((h) => (
                  <span key={h} style={{ color: '#765d68', fontSize: '.72rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>{h}</span>
                ))}
              </div>
              {lineItems.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 110px 90px 32px', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateLineItem(i, { description: e.target.value })}
                    style={inputStyle}
                  />
                  <input
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(e) => updateLineItem(i, { qty: Math.max(1, parseInt(e.target.value) || 1) })}
                    style={inputStyle}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => updateLineItem(i, { unit_price: parseFloat(e.target.value) || 0 })}
                    style={inputStyle}
                  />
                  <span style={{ color: '#24151c', fontSize: '.86rem', fontWeight: 700, textAlign: 'right' }}>
                    S${(item.qty * item.unit_price).toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeLineItem(i)}
                    disabled={lineItems.length === 1}
                    style={{ background: 'none', border: 'none', cursor: lineItems.length === 1 ? 'default' : 'pointer', color: '#be123c', fontSize: '.9rem', opacity: lineItems.length === 1 ? 0.3 : 1 }}
                    aria-label="Remove line item"
                  >✕</button>
                </div>
              ))}
              <button
                type="button"
                onClick={addLineItem}
                className="text-button"
                style={{ justifySelf: 'start', fontSize: '.82rem' }}
              >
                + Add item
              </button>
            </div>

            {/* Totals */}
            <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 10, background: '#f9f4f6', display: 'grid', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.86rem', color: '#765d68' }}>
                <span>Subtotal</span><span>S${subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.86rem', color: '#765d68' }}>
                <span>GST (9%)</span><span>S${gst.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 700, color: '#24151c', borderTop: '1px solid #f0dce7', paddingTop: 8, marginTop: 2 }}>
                <span>Total</span><span>S${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Dates & notes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={labelStyle}>
              Issue Date
              <input type="date" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              Due Date
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inputStyle} />
            </label>
          </div>
          <label style={labelStyle}>
            Notes (optional)
            <textarea
              rows={2}
              value={invoiceNotes}
              onChange={(e) => setInvoiceNotes(e.target.value)}
              placeholder="Payment instructions, bank details, terms…"
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </label>

          {createMsg && <p style={{ margin: 0, color: '#be123c', fontSize: '.84rem', fontWeight: 700 }}>{createMsg}</p>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="text-button" type="button" onClick={() => { setShowCreate(false); setCreateMsg(''); }} disabled={creating}>Cancel</button>
            <button
              className="button"
              type="button"
              onClick={createInvoice}
              disabled={creating || lineItems.every((i) => !i.description.trim())}
              style={{ margin: 0, padding: '9px 20px', fontSize: '.88rem', border: 'none', cursor: 'pointer' }}
            >
              {creating ? 'Creating…' : 'Create Invoice'}
            </button>
          </div>
        </div>
      )}

      {/* Add invoice button */}
      {!showCreate && (
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          style={{ alignSelf: 'start', padding: '8px 16px', borderRadius: 10, border: '1px dashed #decbd5', background: '#fffbf7', color: '#765d68', cursor: 'pointer', font: 'inherit', fontSize: '.86rem', fontWeight: 700 }}
        >
          + Create Invoice
        </button>
      )}
    </div>
  );
}

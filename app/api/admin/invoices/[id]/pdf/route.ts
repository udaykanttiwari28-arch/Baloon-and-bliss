import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer';

interface LineItem {
  description: string;
  quantity: number;
  unit_price_minor: number;
}

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase not configured.');
  return createClient(url, key);
}

function fmtSGD(minor: number) {
  return `S$${(minor / 100).toFixed(2)}`;
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Intl.DateTimeFormat('en-SG', { dateStyle: 'medium' }).format(new Date(`${d}T00:00:00`));
}

const STATUS_COLOURS: Record<string, string> = {
  draft: '#92400e',
  sent: '#1d4ed8',
  unpaid: '#991b1b',
  paid: '#166534',
};

const styles = StyleSheet.create({
  page: { backgroundColor: '#fffbf7', fontFamily: 'Helvetica', padding: 48, fontSize: 10, color: '#24151c' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  brandName: { fontSize: 24, color: '#db2777', fontFamily: 'Helvetica-Bold' },
  brandTagline: { fontSize: 9, color: '#765d68', marginTop: 3 },
  invoiceMeta: { alignItems: 'flex-end' },
  invoiceLabel: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#24151c' },
  invoiceNumber: { fontSize: 11, color: '#765d68', marginTop: 2 },
  statusBadge: { marginTop: 6, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, fontSize: 9, fontFamily: 'Helvetica-Bold' },
  dateLine: { fontSize: 9, color: '#765d68', marginTop: 3 },
  divider: { borderBottomWidth: 1, borderBottomColor: '#f0dce7', marginVertical: 18 },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#765d68', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  billName: { fontSize: 13, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  billDetail: { fontSize: 9, color: '#765d68', marginBottom: 2 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#24151c', paddingVertical: 7, paddingHorizontal: 10, borderRadius: 4 },
  tableHeaderCell: { color: '#fff', fontSize: 8, fontFamily: 'Helvetica-Bold' },
  tableRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#f0dce7' },
  tableRowAlt: { backgroundColor: '#fff8fb' },
  tableCell: { fontSize: 9, color: '#24151c' },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: 'center' },
  colUnit: { flex: 1.5, textAlign: 'right' },
  colTotal: { flex: 1.5, textAlign: 'right' },
  totalsBox: { alignItems: 'flex-end', marginTop: 14 },
  totalsRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  totalsLabel: { fontSize: 9, color: '#765d68', width: 80, textAlign: 'right' },
  totalsValue: { fontSize: 9, color: '#24151c', width: 80, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  grandTotalLabel: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#db2777', width: 80, textAlign: 'right' },
  grandTotalValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#db2777', width: 80, textAlign: 'right' },
  grandTotalDivider: { borderTopWidth: 2, borderTopColor: '#db2777', marginBottom: 6, width: 160 },
  notesBox: { marginTop: 20, padding: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#f0dce7', borderRadius: 8 },
  notesLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#765d68', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 5 },
  notesText: { fontSize: 9, color: '#765d68', lineHeight: 1.5 },
  footer: { position: 'absolute', bottom: 36, left: 48, right: 48, textAlign: 'center', borderTopWidth: 1, borderTopColor: '#f0dce7', paddingTop: 10 },
  footerText: { fontSize: 8, color: '#765d68' },
  mockupPage: { backgroundColor: '#fffbf7', fontFamily: 'Helvetica', padding: 48 },
  mockupHeading: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#db2777', marginBottom: 6 },
  mockupSub: { fontSize: 10, color: '#765d68', marginBottom: 24 },
  mockupImage: { width: '100%', objectFit: 'contain', borderRadius: 8 },
});

function InvoicePDF({
  invoice,
  enquiry,
  mockupUrl,
}: {
  invoice: Record<string, unknown>;
  enquiry: Record<string, unknown>;
  mockupUrl: string | null;
}) {
  const lineItems = (invoice.line_items as LineItem[]) ?? [];
  const status = String(invoice.status ?? 'draft');
  const statusColour = STATUS_COLOURS[status] ?? '#24151c';

  return React.createElement(
    Document,
    { title: `Invoice ${invoice.invoice_number}` },
    // Page 1 — Invoice
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: styles.brandName }, 'Balloons & Bliss SG'),
          React.createElement(Text, { style: styles.brandTagline }, "Singapore's Premier Balloon Decoration Studio"),
        ),
        React.createElement(
          View,
          { style: styles.invoiceMeta },
          React.createElement(Text, { style: styles.invoiceLabel }, 'INVOICE'),
          React.createElement(Text, { style: styles.invoiceNumber }, String(invoice.invoice_number)),
          React.createElement(
            Text,
            { style: { ...styles.statusBadge, color: statusColour } },
            status.toUpperCase(),
          ),
          React.createElement(Text, { style: styles.dateLine }, `Issued: ${fmtDate(invoice.issued_date as string)}`),
          React.createElement(Text, { style: styles.dateLine }, `Due: ${fmtDate(invoice.due_date as string)}`),
        ),
      ),
      React.createElement(View, { style: styles.divider }),
      // Bill To
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionLabel }, 'Bill To'),
        React.createElement(Text, { style: styles.billName }, String(enquiry.name ?? '—')),
        enquiry.company_name ? React.createElement(Text, { style: styles.billDetail }, String(enquiry.company_name)) : null,
        enquiry.email ? React.createElement(Text, { style: styles.billDetail }, String(enquiry.email)) : null,
        enquiry.mobile ? React.createElement(Text, { style: styles.billDetail }, String(enquiry.mobile)) : null,
        enquiry.event_date ? React.createElement(Text, { style: styles.billDetail }, `Event: ${fmtDate(enquiry.event_date as string)}`) : null,
      ),
      // Line items table
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionLabel }, 'Services'),
        // Table header
        React.createElement(
          View,
          { style: styles.tableHeader },
          React.createElement(Text, { style: { ...styles.tableHeaderCell, ...styles.colDesc } }, 'Description'),
          React.createElement(Text, { style: { ...styles.tableHeaderCell, ...styles.colQty } }, 'Qty'),
          React.createElement(Text, { style: { ...styles.tableHeaderCell, ...styles.colUnit } }, 'Unit Price'),
          React.createElement(Text, { style: { ...styles.tableHeaderCell, ...styles.colTotal } }, 'Total'),
        ),
        // Rows
        ...lineItems.map((item, i) =>
          React.createElement(
            View,
            { key: i, style: i % 2 === 1 ? { ...styles.tableRow, ...styles.tableRowAlt } : styles.tableRow },
            React.createElement(Text, { style: { ...styles.tableCell, ...styles.colDesc } }, item.description),
            React.createElement(Text, { style: { ...styles.tableCell, ...styles.colQty } }, String(item.quantity)),
            React.createElement(Text, { style: { ...styles.tableCell, ...styles.colUnit } }, fmtSGD(item.unit_price_minor)),
            React.createElement(Text, { style: { ...styles.tableCell, ...styles.colTotal } }, fmtSGD(item.quantity * item.unit_price_minor)),
          ),
        ),
      ),
      // Totals
      React.createElement(
        View,
        { style: styles.totalsBox },
        React.createElement(
          View,
          { style: styles.totalsRow },
          React.createElement(Text, { style: styles.totalsLabel }, 'Subtotal'),
          React.createElement(Text, { style: styles.totalsValue }, fmtSGD(invoice.subtotal_minor as number)),
        ),
        React.createElement(
          View,
          { style: styles.totalsRow },
          React.createElement(Text, { style: styles.totalsLabel }, 'GST (9%)'),
          React.createElement(Text, { style: styles.totalsValue }, fmtSGD(invoice.gst_minor as number)),
        ),
        React.createElement(View, { style: styles.grandTotalDivider }),
        React.createElement(
          View,
          { style: styles.totalsRow },
          React.createElement(Text, { style: styles.grandTotalLabel }, 'Total'),
          React.createElement(Text, { style: styles.grandTotalValue }, fmtSGD(invoice.total_minor as number)),
        ),
      ),
      // Notes
      invoice.notes
        ? React.createElement(
            View,
            { style: styles.notesBox },
            React.createElement(Text, { style: styles.notesLabel }, 'Notes'),
            React.createElement(Text, { style: styles.notesText }, String(invoice.notes)),
          )
        : null,
      // Footer
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(Text, { style: styles.footerText }, 'Thank you for choosing Balloons & Bliss SG!'),
        React.createElement(Text, { style: { ...styles.footerText, marginTop: 3 } }, 'celebrate@balloonsandblisssg.com  ·  www.balloonsandblisssg.com'),
      ),
    ),
    // Page 2 — Mockup (only if present)
    ...(mockupUrl
      ? [
          React.createElement(
            Page,
            { size: 'A4', style: styles.mockupPage },
            React.createElement(Text, { style: styles.mockupHeading }, 'Agreed Event Mockup'),
            React.createElement(Text, { style: styles.mockupSub }, `For ${enquiry.name} · ${invoice.invoice_number}`),
            React.createElement(Image, { style: styles.mockupImage, src: mockupUrl }),
          ),
        ]
      : []),
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const supabase = adminClient();

    // Fetch invoice + join to enquiry for customer info and mockup path
    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .select('*, booking_enquiries(name, company_name, email, mobile, event_date, mockup_storage_path)')
      .eq('id', id)
      .single();

    if (invErr || !invoice) {
      return NextResponse.json({ error: invErr?.message ?? 'Invoice not found.' }, { status: invErr?.code === 'PGRST116' ? 404 : 500 });
    }

    const enquiry = (invoice.booking_enquiries ?? {}) as Record<string, unknown>;
    const mockupPath = enquiry.mockup_storage_path as string | null;

    let mockupUrl: string | null = null;
    if (mockupPath) {
      const { data: signed } = await supabase.storage.from('mockups').createSignedUrl(mockupPath, 3600);
      mockupUrl = signed?.signedUrl ?? null;
    }

    const doc = React.createElement(InvoicePDF, {
      invoice: invoice as Record<string, unknown>,
      enquiry,
      mockupUrl,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;

    const pdfBuffer = await renderToBuffer(doc);
    const uint8 = new Uint8Array(pdfBuffer);

    const invoiceNumber = String(invoice.invoice_number ?? 'invoice');
    return new NextResponse(uint8, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoiceNumber}.pdf"`,
        'Content-Length': String(uint8.length),
      },
    });
  } catch (err) {
    console.error('[invoices/pdf]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

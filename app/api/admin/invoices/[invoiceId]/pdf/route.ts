import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
  Font,
  type DocumentProps,
} from '@react-pdf/renderer';

Font.register({
  family: 'Georgia',
  src: 'https://fonts.gstatic.com/s/sourceserifpro/v15/neIQzD-0qpwxpaWvjeD0X88SAOeauXQ-oA.ttf',
});

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase service role not configured.');
  return createClient(url, key);
}

function fmtSGD(minor: number) {
  return `S$${(minor / 100).toFixed(2)}`;
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-SG', { dateStyle: 'medium' }).format(new Date(`${iso}T00:00:00`));
}

interface LineItem {
  description: string;
  qty: number;
  unit_price_minor: number;
  line_total_minor: number;
}

const styles = StyleSheet.create({
  page: { padding: 48, fontFamily: 'Helvetica', backgroundColor: '#ffffff', fontSize: 10, color: '#24151c' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  brand: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#db2777' },
  brandSub: { fontSize: 9, color: '#765d68', marginTop: 3 },
  invoiceTitle: { fontSize: 28, fontFamily: 'Helvetica-Bold', color: '#db2777', textAlign: 'right' },
  invoiceNum: { fontSize: 11, color: '#765d68', textAlign: 'right', marginTop: 4 },
  divider: { borderBottomWidth: 1, borderBottomColor: '#f0dce7', marginVertical: 16 },
  twoCol: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  section: { flex: 1 },
  sectionTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#765d68', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  bodyText: { fontSize: 10, color: '#24151c', marginBottom: 3 },
  mutedText: { fontSize: 9, color: '#765d68', marginBottom: 3 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#fdf2f8', padding: '8 10', borderRadius: 4 },
  tableRow: { flexDirection: 'row', padding: '8 10', borderBottomWidth: 1, borderBottomColor: '#fdf2f8' },
  colDesc: { flex: 1 },
  colQty: { width: 40, textAlign: 'center' },
  colUnit: { width: 80, textAlign: 'right' },
  colTotal: { width: 80, textAlign: 'right' },
  thText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#765d68', letterSpacing: 0.5, textTransform: 'uppercase' },
  tdText: { fontSize: 10, color: '#24151c' },
  totalsBox: { marginTop: 12, marginLeft: 'auto', width: 220 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  totalLabel: { fontSize: 10, color: '#765d68' },
  totalValue: { fontSize: 10, color: '#24151c' },
  grandRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1.5, borderTopColor: '#db2777' },
  grandLabel: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#24151c' },
  grandValue: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#db2777' },
  notesBox: { marginTop: 20, padding: '12 14', backgroundColor: '#fffbf7', borderRadius: 6, borderWidth: 1, borderColor: '#f0dce7' },
  statusChip: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 20, alignSelf: 'flex-start' },
  mockupSection: { marginTop: 24 },
  mockupImage: { maxHeight: 240, borderRadius: 8, objectFit: 'contain', border: '1 solid #f0dce7' },
  footer: { position: 'absolute', bottom: 32, left: 48, right: 48, textAlign: 'center', fontSize: 8, color: '#c084b0' },
});

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  draft:  { bg: '#f1f5f9', color: '#475569' },
  sent:   { bg: '#dbeafe', color: '#1d4ed8' },
  unpaid: { bg: '#fef3c7', color: '#92400e' },
  paid:   { bg: '#dcfce7', color: '#166534' },
};

interface InvoiceData {
  id: string;
  invoice_number: string;
  status: string;
  line_items: LineItem[];
  subtotal_minor: number;
  gst_minor: number;
  total_minor: number;
  issued_at: string | null;
  due_date: string | null;
  notes: string | null;
  booking_enquiries: {
    name: string;
    email: string | null;
    mobile: string | null;
    company_name: string | null;
    venue: string | null;
    event_date: string | null;
    mockup_storage_path: string | null;
  };
}

function InvoicePDF({ invoice, mockupUrl }: { invoice: InvoiceData; mockupUrl: string | null }) {
  const chip = STATUS_COLORS[invoice.status] ?? STATUS_COLORS.draft;
  const enq = invoice.booking_enquiries;

  return React.createElement(
    Document,
    null,
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
          React.createElement(Text, { style: styles.brand }, 'Balloons & Bliss SG'),
          React.createElement(Text, { style: styles.brandSub }, 'balloonsandblisssg.com'),
        ),
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: styles.invoiceTitle }, 'INVOICE'),
          React.createElement(Text, { style: styles.invoiceNum }, invoice.invoice_number),
          React.createElement(
            View,
            { style: { ...styles.statusChip, backgroundColor: chip.bg, marginTop: 8, alignSelf: 'flex-end' } },
            React.createElement(Text, { style: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: chip.color, textTransform: 'capitalize' } }, invoice.status.toUpperCase()),
          ),
        ),
      ),

      React.createElement(View, { style: styles.divider }),

      // Bill-to + dates
      React.createElement(
        View,
        { style: styles.twoCol },
        React.createElement(
          View,
          { style: styles.section },
          React.createElement(Text, { style: styles.sectionTitle }, 'Billed To'),
          React.createElement(Text, { style: styles.bodyText }, enq.company_name ?? enq.name),
          enq.company_name ? React.createElement(Text, { style: styles.mutedText }, enq.name) : null,
          enq.email  ? React.createElement(Text, { style: styles.mutedText }, enq.email)  : null,
          enq.mobile ? React.createElement(Text, { style: styles.mutedText }, enq.mobile) : null,
          enq.venue  ? React.createElement(Text, { style: styles.mutedText }, enq.venue)  : null,
        ),
        React.createElement(
          View,
          { style: { ...styles.section, alignItems: 'flex-end' } },
          React.createElement(Text, { style: styles.sectionTitle }, 'Invoice Details'),
          React.createElement(Text, { style: styles.mutedText }, `Issued: ${fmtDate(invoice.issued_at)}`),
          React.createElement(Text, { style: styles.mutedText }, `Due: ${fmtDate(invoice.due_date)}`),
          enq.event_date ? React.createElement(Text, { style: styles.mutedText }, `Event: ${fmtDate(enq.event_date)}`) : null,
        ),
      ),

      React.createElement(View, { style: styles.divider }),

      // Line items table
      React.createElement(
        View,
        { style: styles.tableHeader },
        React.createElement(Text, { style: { ...styles.thText, ...styles.colDesc } }, 'Description'),
        React.createElement(Text, { style: { ...styles.thText, ...styles.colQty } }, 'Qty'),
        React.createElement(Text, { style: { ...styles.thText, ...styles.colUnit } }, 'Unit Price'),
        React.createElement(Text, { style: { ...styles.thText, ...styles.colTotal } }, 'Total'),
      ),
      ...invoice.line_items.map((item, i) =>
        React.createElement(
          View,
          { key: i, style: styles.tableRow },
          React.createElement(Text, { style: { ...styles.tdText, ...styles.colDesc } }, item.description),
          React.createElement(Text, { style: { ...styles.tdText, ...styles.colQty } }, String(item.qty)),
          React.createElement(Text, { style: { ...styles.tdText, ...styles.colUnit } }, fmtSGD(item.unit_price_minor)),
          React.createElement(Text, { style: { ...styles.tdText, ...styles.colTotal } }, fmtSGD(item.line_total_minor)),
        )
      ),

      // Totals
      React.createElement(
        View,
        { style: styles.totalsBox },
        React.createElement(
          View,
          { style: styles.totalRow },
          React.createElement(Text, { style: styles.totalLabel }, 'Subtotal'),
          React.createElement(Text, { style: styles.totalValue }, fmtSGD(invoice.subtotal_minor)),
        ),
        React.createElement(
          View,
          { style: styles.totalRow },
          React.createElement(Text, { style: styles.totalLabel }, 'GST (9%)'),
          React.createElement(Text, { style: styles.totalValue }, fmtSGD(invoice.gst_minor)),
        ),
        React.createElement(
          View,
          { style: styles.grandRow },
          React.createElement(Text, { style: styles.grandLabel }, 'Total'),
          React.createElement(Text, { style: styles.grandValue }, fmtSGD(invoice.total_minor)),
        ),
      ),

      // Notes
      invoice.notes
        ? React.createElement(
            View,
            { style: styles.notesBox },
            React.createElement(Text, { style: { ...styles.sectionTitle, marginBottom: 4 } }, 'Notes'),
            React.createElement(Text, { style: { fontSize: 9, color: '#24151c', lineHeight: 1.5 } }, invoice.notes),
          )
        : null,

      // Mockup image
      mockupUrl
        ? React.createElement(
            View,
            { style: styles.mockupSection },
            React.createElement(View, { style: styles.divider }),
            React.createElement(Text, { style: { ...styles.sectionTitle, marginBottom: 8 } }, 'Agreed Mockup'),
            React.createElement(Image, { src: mockupUrl, style: styles.mockupImage }),
          )
        : null,

      // Footer
      React.createElement(
        Text,
        { style: styles.footer },
        'Thank you for choosing Balloons & Bliss SG  •  balloonsandblisssg.com',
      ),
    ),
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ invoiceId: string }> },
) {
  const { invoiceId } = await params;
  if (!invoiceId) return NextResponse.json({ error: 'Missing invoice id.' }, { status: 400 });

  let supabase;
  try { supabase = getServiceClient(); } catch {
    return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
  }

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(`
      id, invoice_number, status, line_items,
      subtotal_minor, gst_minor, total_minor,
      issued_at, due_date, notes,
      booking_enquiries (
        name, email, mobile, company_name,
        venue, event_date, mockup_storage_path
      )
    `)
    .eq('id', invoiceId)
    .single<InvoiceData>();

  if (error || !invoice) {
    console.error('[pdf] Invoice fetch error:', error);
    return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
  }

  // Get mockup signed URL if available
  let mockupUrl: string | null = null;
  const mockupPath = invoice.booking_enquiries?.mockup_storage_path;
  if (mockupPath) {
    const { data: signed } = await supabase.storage
      .from('mockups')
      .createSignedUrl(mockupPath, 60 * 10); // 10 min TTL
    if (signed?.signedUrl) mockupUrl = signed.signedUrl;
  }

  const pdfBuffer = await renderToBuffer(
    React.createElement(InvoicePDF, { invoice, mockupUrl }) as React.ReactElement<DocumentProps>
  );

  const filename = `${invoice.invoice_number}.pdf`;

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-cache',
    },
  });
}

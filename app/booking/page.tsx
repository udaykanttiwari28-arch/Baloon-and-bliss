import Link from 'next/link';
import { exampleCatalogue } from '../../src/catalogue/fixtures';
import { getProductBySlug } from '../../src/catalogue/catalogue';
import BookingForm from './booking-form';
import SiteNav from '../../src/components/site-nav';
import SiteFooter from '../../src/components/site-footer';

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const { product: productSlug } = await searchParams;
  const product = productSlug ? getProductBySlug(exampleCatalogue, productSlug) : undefined;

  return (
    <main className="shell booking-shell">
      <SiteNav />
      <Link className="back-link" href={product ? `/catalogue/${product.slug}` : '/catalogue'}>← Back</Link>
      <header className="page-header">
        <p className="eyebrow">Booking enquiry</p>
        <h1>Tell us about your celebration.</h1>
        <p className="lede">Share the essentials and our team will follow up with availability, setup details, and a confirmed quote.</p>
      </header>
      <BookingForm selectedProduct={product?.slug} />
      <SiteFooter />
    </main>
  );
}

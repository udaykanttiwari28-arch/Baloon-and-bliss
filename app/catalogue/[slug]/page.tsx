import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductBySlug } from '../../../src/catalogue/catalogue';
import { exampleCatalogue } from '../../../src/catalogue/fixtures';
import { getCatalogueProducts } from '../../../src/catalogue/storage';

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return exampleCatalogue.map((product) => ({ slug: product.slug }));
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(await getCatalogueProducts(), slug);
  if (!product) notFound();

  return (
    <main className="shell detail-shell">
      <div className="detail-nav"><Link className="back-link" href="/catalogue">← All packages</Link><Link className="text-link" href="/gallery">View gallery →</Link></div>
      <div className="detail-grid">
        <div className="detail-gallery" aria-label={`${product.name} image gallery`}>
          {product.images.map((image) => image.imageUrl ? (
            <img className="product-photo gallery-photo" key={image.id} src={image.imageUrl} alt={image.altText} />
          ) : null)}
          {!product.images.some((image) => image.imageUrl) && <div className="product-art product-art-large" aria-hidden="true"><span>✦</span></div>}
        </div>
        <section>
          <p className="eyebrow">{product.tags.join(' · ')}</p>
          {product.highlightLabel && <span className="popular-badge">★ {product.highlightLabel}</span>}
          <h1>{product.name}</h1>
          <p className="lede">{product.description}</p>
          <p className="price large-price">From S${(product.basePrice.amountMinor / 100).toFixed(2)}</p>
          <h2>What&apos;s included</h2>
          <ul className="detail-list included-list">{product.included.map((item) => <li key={item}>{item}</li>)}</ul>
          <h2>Optional extras <span className="price-on-request">Price on request</span></h2>
          <p className="supporting-copy">Add features from our other package tiers or extend what is already included. Final pricing is confirmed based on your venue and requirements.</p>
          <ul className="detail-list">
            {product.options.length === 0 && product.addOns.length === 0 && <li>Discuss custom upgrades with our team.</li>}
            {product.options.map((option) => <li key={option.id}>{option.name} · +S${(option.price.amountMinor / 100).toFixed(2)}</li>)}
            {product.addOns.map((addOn) => <li key={addOn.id}>{addOn.name}</li>)}
          </ul>
          <div id="request-booking" className="request-card">
            <h2>Ready to enquire?</h2>
            <p>Booking details are the next slice. This CTA is intentionally a handoff until the validated request form is connected.</p>
            <Link className="button" href={`/booking?product=${product.slug}`}>Request this package</Link>
          </div>
        </section>
      </div>
    </main>
  );
}

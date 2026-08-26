import Link from 'next/link';
import { listActiveProducts } from '../../src/catalogue/catalogue';
import { getCatalogueProducts } from '../../src/catalogue/storage';

export const dynamic = 'force-dynamic';

export default async function CataloguePage() {
  const products = listActiveProducts(await getCatalogueProducts());
  return (
    <main className="shell">
      <header className="page-header">
        <Link className="brand" href="/">Balloons <span>&amp;</span> Bliss</Link>
        <p className="eyebrow">Beautiful celebrations, thoughtfully styled</p>
        <h1>Choose the setup that fits your celebration.</h1>
        <p className="lede">From a simple birthday moment to complete venue styling, our packages make it easy to create a celebration that feels truly yours.</p>
        <div className="hero-actions"><a className="button" href="#packages">Explore packages</a><a className="text-link" href="#why-bliss">Why Balloons &amp; Bliss ↓</a></div>
      </header>
      <section className="benefit-strip" id="why-bliss" aria-label="Service benefits">
        <div><span className="benefit-icon">✦</span><strong>Custom styling</strong><small>Designed around your theme</small></div>
        <div><span className="benefit-icon">⌁</span><strong>Stress-free service</strong><small>Setup and delivery at your venue</small></div>
        <div><span className="benefit-icon">♡</span><strong>Flexible extras</strong><small>Build your celebration your way</small></div>
      </section>
      <section className="product-grid" id="packages" aria-label="Decoration packages">
        {products.map((product) => (
          <article className={`product-card${product.highlightLabel ? ' popular-card' : ''}`} key={product.id}>
            {product.images[0]?.imageUrl ? <img className="product-photo" src={product.images[0].imageUrl} alt={product.images[0].altText} /> : <div className="product-art" aria-hidden="true"><span>✦</span></div>}
            <div className="product-card-body">
              {product.highlightLabel && <span className="popular-badge">★ {product.highlightLabel}</span>}
              <p className="eyebrow">{product.tags.join(' · ')}</p>
              <h2>{product.name}</h2>
              <p>{product.description}</p>
              <p className="price">From S${(product.basePrice.amountMinor / 100).toFixed(2)}</p>
              <ul className="included-list">{product.included.slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ul>
              <p className="included-note">✓ Stress-free setup and delivery at your venue</p>
              <Link className="text-link" href={`/catalogue/${product.slug}`}>View package →</Link>
            </div>
          </article>
        ))}
      </section>
      <section className="closing-note">
        <p className="eyebrow">Your celebration, your way</p>
        <h2>Need something a little different?</h2>
        <p>Our optional extras can extend any package. Tell us what you have in mind and we’ll help shape the right setup for your venue.</p>
        <Link className="text-link" href="/booking">Start a booking enquiry →</Link>
        <a className="instagram-link" href="https://www.instagram.com/balloons_and_bliss_sg/" target="_blank" rel="noreferrer">Connect with us on Instagram ↗</a>
      </section>
      <p className="fixture-note">Package prices and copy are ready for review. Optional extras are available on request.</p>
    </main>
  );
}

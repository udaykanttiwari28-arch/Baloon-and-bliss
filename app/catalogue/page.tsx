import Link from 'next/link';
import { listActiveProducts } from '../../src/catalogue/catalogue';
import { getCatalogueProducts } from '../../src/catalogue/storage';

export const dynamic = 'force-dynamic';

export default async function CataloguePage() {
  const products = listActiveProducts(await getCatalogueProducts());
  return (
    <main className="shell">
      <nav className="site-nav" aria-label="Main navigation">
        <Link className="brand" href="/"><img className="brand-logo" src="/logo.png" alt="Balloons & Bliss SG" /></Link>
        <div className="nav-links">
          <a href="#packages">Packages</a>
          <Link href="/gallery">Gallery</Link>
          <a href="#why-bliss">Why us</a>
          <Link href="/booking">Enquire</Link>
        </div>
      </nav>
      <header className="page-header hero-header">
        <div className="hero-copy">
          <p className="eyebrow">Singapore celebrations · made effortless</p>
          <h1>Beautiful moments, styled with a little more bliss.</h1>
          <p className="lede">Choose a ready-to-book decoration package, then make it yours with custom colours, themes and thoughtful finishing touches.</p>
          <div className="hero-actions"><a className="button" href="#packages">Explore packages</a><a className="text-link" href="#why-bliss">See how it works ↓</a></div>
          <div className="hero-proof"><span>✦</span><p><strong>Setup and delivery included</strong><br />At your venue, with less to organise.</p></div>
        </div>
      </header>
      <section className="benefit-strip" id="why-bliss" aria-label="Service benefits">
        <div><span className="benefit-icon">✦</span><strong>Custom styling</strong><small>Designed around your theme</small></div>
        <div><span className="benefit-icon">⌁</span><strong>Stress-free service</strong><small>Setup and delivery at your venue</small></div>
        <div><span className="benefit-icon">♡</span><strong>Flexible extras</strong><small>Build your celebration your way</small></div>
      </section>
      <section className="product-grid" id="packages" aria-label="Decoration packages">
        {products.map((product) => (
          <article className={`product-card${product.highlightLabel ? ' popular-card' : ''}`} key={product.id}>
            <div className="product-image-wrap">
              {product.images[0]?.imageUrl ? <img className="product-photo" src={product.images[0].imageUrl} alt={product.images[0].altText} /> : <div className="product-art" aria-hidden="true"><span>✦</span></div>}
              <span className="image-count">{product.images.length} {product.images.length === 1 ? 'view' : 'views'}</span>
            </div>
            <div className="product-card-body">
              {product.highlightLabel && <span className="popular-badge">★ {product.highlightLabel}</span>}
              <p className="eyebrow">{product.tags.join(' · ')}</p>
              <h2>{product.name}</h2>
              <p>{product.description}</p>
              <p className="price">From S${(product.basePrice.amountMinor / 100).toFixed(2)}</p>
              <p className="included-label">Includes</p>
              <ul className="included-list">{product.included.slice(0, 4).map((item) => <li key={item}>{item}</li>)}</ul>
              <p className="included-note">✓ Stress-free setup and delivery at your venue</p>
              <Link className="card-button" href={`/catalogue/${product.slug}`}>View package <span>→</span></Link>
            </div>
          </article>
        ))}
      </section>
      <section className="closing-note">
        <p className="eyebrow">Your celebration, your way</p>
        <h2>Need something a little different?</h2>
        <p>Our optional extras can extend any package. Tell us what you have in mind and we’ll help shape the right setup for your venue.</p>
        <Link className="button" href="/booking">Start a booking enquiry →</Link>
        <a className="instagram-link" href="https://www.instagram.com/balloons_and_bliss_sg/" target="_blank" rel="noreferrer">Connect with us on Instagram ↗</a>
      </section>
    </main>
  );
}

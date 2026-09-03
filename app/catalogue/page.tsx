import Link from 'next/link';
import { listActiveProducts } from '../../src/catalogue/catalogue';
import { getCatalogueProducts } from '../../src/catalogue/storage';
import SiteNav from '../../src/components/site-nav';
import SiteFooter from '../../src/components/site-footer';

export const dynamic = 'force-dynamic';

export default async function CataloguePage() {
  const products = listActiveProducts(await getCatalogueProducts());
  return (
    <main className="shell">
      <SiteNav />
      <header className="page-header hero-header">
        <div className="hero-copy">
          <p className="eyebrow">Singapore celebrations · made effortless</p>
          <h1>Beautiful moments, styled with a little more bliss.</h1>
          <p className="lede">Choose a ready-to-book decoration package, then make it yours with custom colours, themes and thoughtful finishing touches.</p>
          <div className="hero-actions"><a className="button" href="#packages">Explore packages</a><a className="text-link" href="#why-bliss">See how it works ↓</a></div>
          <div className="hero-proof"><span>✦</span><p><strong>Setup and delivery included</strong><br />At your venue, with less to organise.</p></div>
        </div>
      </header>
      <section className="why-section" id="why-bliss" aria-label="Why choose Balloons and Bliss">
        <div className="why-intro"><p className="eyebrow">Why Balloons &amp; Bliss</p><h2>Beautiful styling, dependable service.</h2><p>From the first conversation to the final balloon, we make your celebration feel easy, personal and beautifully put together.</p><a className="text-link" href="https://www.google.com/search?q=balloons+and+bliss+sg+reviews" target="_blank" rel="noreferrer">Read our customer reviews on Google ↗</a></div>
        <div className="benefit-strip">
          <div><span className="benefit-icon">✦</span><strong>Thoughtful design</strong><small>Custom colours, themes and details made for your event.</small></div>
          <div><span className="benefit-icon">⌁</span><strong>Reliable and on time</strong><small>Clear planning, punctual arrival and careful setup at your venue.</small></div>
          <div><span className="benefit-icon">♡</span><strong>Honest, caring service</strong><small>Transparent conversations and styling that respects your vision and budget.</small></div>
          <div><span className="benefit-icon">★</span><strong>Customer-first experience</strong><small>We listen, communicate clearly and care about every celebration.</small></div>
          <div><span className="benefit-icon">○</span><strong>Celebrations of every kind</strong><small>Birthdays, baby showers, milestones, corporate events and more.</small></div>
          <div><span className="benefit-icon">＋</span><strong>Complete venue styling</strong><small>Backdrops, balloons, entrance, wall, floor and dessert table decor.</small></div>
        </div>
      </section>
      <section className="services-note" id="services" aria-label="Our services"><p className="eyebrow">Made for your moment</p><h2>More than balloons.</h2><p>Choose a package for a beautiful starting point, then personalise it with custom backdrops, themed cutouts, pedestals, number lights, welcome boards and thoughtful finishing touches. We provide stress-free setup and delivery at your venue across Singapore.</p>
      </section>
      <section className="product-grid" id="packages" aria-label="Decoration packages">
        {products.map((product) => (
          <article className={`product-card${product.highlightLabel ? ' popular-card' : ''}`} key={product.id}>
            <Link className="product-image-link" href={`/catalogue/${product.slug}`} aria-label={`View ${product.name}`}><div className="product-image-wrap">{product.images[0]?.imageUrl ? <img className="product-photo" src={product.images[0].imageUrl} alt={product.images[0].altText} /> : <div className="product-art" aria-hidden="true"><span>✦</span></div>}</div></Link>
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
        <div className="contact-links" aria-label="Contact Balloons and Bliss">
          <a href="https://wa.me/6583937938" target="_blank" rel="noreferrer">WhatsApp +65 8393 7938 ↗</a>
          <a href="mailto:celebrate@balloonsandblisssg.com">celebrate@balloonsandblisssg.com</a>
          <a href="https://www.instagram.com/balloons_and_bliss_sg/" target="_blank" rel="noreferrer">Instagram ↗</a>
          <a href="https://www.tiktok.com/@balloons_and_bliss_sg" target="_blank" rel="noreferrer">TikTok ↗</a>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

import Link from 'next/link';
import { getCatalogueProducts } from '../../src/catalogue/storage';
import { listActiveProducts } from '../../src/catalogue/catalogue';

export const dynamic = 'force-dynamic';

export default async function GalleryPage() {
  const products = listActiveProducts(await getCatalogueProducts());
  const images = products.flatMap((product) => product.images.filter((image) => image.imageUrl).map((image) => ({ ...image, product })));

  return (
    <main className="shell gallery-shell">
      <nav className="site-nav" aria-label="Main navigation">
        <Link className="brand" href="/"><img className="brand-logo" src="/logo.png" alt="Balloons & Bliss SG" /></Link>
        <div className="nav-links"><Link href="/catalogue">Packages</Link><Link href="/gallery">Gallery</Link><Link href="/booking">Enquire</Link></div>
      </nav>
      <header className="page-header gallery-header">
        <p className="eyebrow">A little inspiration</p>
        <h1>Celebrations styled with bliss.</h1>
        <p className="lede">Browse our recent package setups, then explore the package that feels right for your celebration.</p>
      </header>
      {images.length > 0 ? (
        <section className="gallery-grid" aria-label="Celebration setup gallery">
          {images.map(({ product, ...image }) => (
            <Link className="gallery-card" href={`/catalogue/${product.slug}`} key={image.id}>
              <img src={image.imageUrl} alt={`${product.name}: ${image.altText}`} />
              <span className="gallery-caption"><strong>{product.name}</strong><small>View package →</small></span>
            </Link>
          ))}
        </section>
      ) : (
        <div className="empty-card"><h2>Gallery coming soon</h2><p>We&apos;re preparing our celebration setups for you.</p></div>
      )}
      <section className="closing-note"><p className="eyebrow">Ready to create yours?</p><h2>Let&apos;s make your celebration memorable.</h2><Link className="button" href="/booking">Start a booking enquiry →</Link></section>
    </main>
  );
}

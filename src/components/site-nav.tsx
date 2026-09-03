import Link from 'next/link';

export default function SiteNav() {
  return (
    <nav className="site-nav" aria-label="Main navigation">
      <Link className="brand" href="/">
        <img className="brand-logo" src="/logo.png" alt="Balloons & Bliss SG" />
        <span className="brand-wordmark">Balloons <em>&amp;</em> Bliss</span>
      </Link>
      <div className="nav-links">
        <Link href="/original-home.html#gallery">Gallery</Link>
        <Link href="/original-home.html#packages">Packages</Link>
        <Link href="/original-home.html#services">Services</Link>
        <Link href="/original-home.html#reviews">Why Us</Link>
        <Link href="/original-home.html#how">How It Works</Link>
        <Link href="/blog.html">Blog</Link>
        <Link className="nav-cta" href="/booking">Enquire</Link>
      </div>
    </nav>
  );
}

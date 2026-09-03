import Link from 'next/link';

export default function SiteNav() {
  return (
    <nav className="site-nav" aria-label="Main navigation">
      <Link className="brand" href="/"><img className="brand-logo" src="/logo.png" alt="Balloons & Bliss SG" /></Link>
      <div className="nav-links">
        <Link href="/catalogue#packages">Packages</Link>
        <Link href="/gallery">Gallery</Link>
        <Link href="/catalogue#why-bliss">Why us</Link>
        <Link href="/booking">Enquire</Link>
      </div>
    </nav>
  );
}

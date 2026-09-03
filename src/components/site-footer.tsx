import Link from 'next/link';

export default function SiteFooter() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand"><img src="/logo.png" alt="Balloons & Bliss SG" /><div><strong>Balloons <span>&amp;</span> Bliss</strong><p>Singapore&apos;s favourite party decoration studio.</p></div></div>
        <div className="footer-links"><h2>Explore</h2><Link href="/catalogue#packages">Packages</Link><Link href="/gallery">Gallery</Link><Link href="/catalogue#services">Services</Link><Link href="/catalogue#why-bliss">Why us</Link><Link href="/booking">Book now</Link></div>
        <div className="footer-links"><h2>Connect</h2><a href="https://wa.me/6583937938" target="_blank" rel="noreferrer">WhatsApp +65 8393 7938</a><a href="mailto:celebrate@balloonsandblisssg.com">celebrate@balloonsandblisssg.com</a><a href="https://www.instagram.com/balloons_and_bliss_sg/" target="_blank" rel="noreferrer">Instagram</a><a href="https://www.tiktok.com/@balloons_and_bliss_sg" target="_blank" rel="noreferrer">TikTok</a><a href="https://www.google.com/search?q=balloons+and+bliss+sg+reviews" target="_blank" rel="noreferrer">Google reviews</a></div>
      </div>
      <div className="footer-bottom"><span>© {currentYear} Balloons &amp; Bliss. All rights reserved.</span><span>Made with <span className="footer-heart">♥</span> in Singapore 🇸🇬</span></div>
    </footer>
  );
}

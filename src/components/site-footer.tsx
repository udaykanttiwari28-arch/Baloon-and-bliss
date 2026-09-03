import Link from 'next/link';

export default function SiteFooter() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <img src="/logo.png" alt="Balloons & Bliss SG" />
          <div>
            <div className="footer-logo">Balloons <span>&amp;</span> Bliss</div>
            <p className="footer-tagline">Singapore&apos;s favourite party decoration studio 🎈</p>
          </div>
        </div>
        <div className="footer-links">
          <h2>Quick links</h2>
          <Link href="/original-home.html#packages">Packages</Link>
          <Link href="/original-home.html#gallery">Gallery</Link>
          <Link href="/original-home.html#services">Services</Link>
          <Link href="/original-home.html#reviews">Why Us</Link>
          <Link href="/booking">Enquire</Link>
        </div>
        <div className="footer-links">
          <h2>Contact</h2>
          <a href="https://wa.me/6583937938" target="_blank" rel="noreferrer">📱 +65 8393 7938</a>
          <a href="mailto:celebrate@balloonsandblisssg.com">📧 celebrate@balloonsandblisssg.com</a>
          <span>📍 Serving all of Singapore</span>
          <a href="https://www.instagram.com/balloons_and_bliss_sg/" target="_blank" rel="noreferrer">📸 Instagram</a>
          <a href="https://www.tiktok.com/@balloons_and_bliss_sg" target="_blank" rel="noreferrer">🎵 TikTok</a>
          <a href="https://www.google.com/search?q=balloons+and+bliss+sg+reviews" target="_blank" rel="noreferrer">⭐ Google reviews</a>
        </div>
      </div>
      <div className="footer-bottom"><span>© {currentYear} Balloons &amp; Bliss. All rights reserved.</span><span>Made with <span className="footer-heart">♥</span> in Singapore 🇸🇬</span></div>
    </footer>
  );
}

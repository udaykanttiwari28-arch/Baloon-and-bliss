import type { Metadata } from 'next';
import AlverniaForm from './alvernia-form';

export const metadata: Metadata = {
  title: 'Alvernia Ladies Card | Balloons & Bliss',
  description: 'Exclusive Balloons & Bliss celebration benefits for Alvernia Ladies Card members.',
  robots: { index: false, follow: false },
};

const celebrations = [
  ['🍼', 'Baby Welcome Home'], ['🧸', 'Baby Showers'], ['🎈', 'Gender Reveals'], ['🌙', 'Baby Full Month Celebrations'],
  ['💯', '100 Days Celebrations'], ['🎂', 'First Birthdays'], ['🎉', 'Birthday Celebrations'], ['🌱', 'Baby Milestones'],
  ['💍', 'Weddings'], ['💌', 'Proposals'], ['✨', 'Corporate Events'], ['🥳', 'Other Special Occasions'],
];

const benefits = [
  ['🎈', 'Premium Balloon Upgrade', 'Metallic, confetti, foil and number balloons.'],
  ['🖼️', 'Fully Customised Welcome Board', 'Designed to match your event theme.'],
  ['📱', 'Digital Welcome Sign', 'A personalised sign for your celebration.'],
  ['💌', 'Complimentary E-Invite', 'A customised digital invitation for guests.'],
  ['⭐', 'Priority Weekend Bookings', 'Get first access to popular weekend slots.'],
];

export default function AlverniaPage() {
  return <main className="alvernia-page">
    <section className="alvernia-hero">
      <div className="alvernia-hero-copy">
        <div className="alvernia-brand"><img src="/logo.png" alt="" /><span>Balloons <em>&amp;</em> Bliss</span></div>
        <p className="alvernia-kicker">Event Décor &amp; Balloon Styling</p>
        <h1>Make every milestone <i>blissful.</i></h1>
        <p className="alvernia-lede">Make every milestone worth celebrating with beautifully customised event décor and balloon styling by Balloons &amp; Bliss.</p>
        <div className="alvernia-offer"><strong>15% OFF</strong><span>Celebration Packages</span><small>Exclusive Alvernia Ladies Card Member Benefit</small></div>
        <div className="alvernia-actions"><a className="alvernia-button" data-alvernia-guide-cta href="#guide">Get Your FREE Celebration Guide <span>↓</span></a><a className="alvernia-text-link" href="#benefits">Explore Your Member Benefits</a></div>
      </div>
      <div className="alvernia-hero-art" aria-label="A joyful celebration with pastel balloons"><span className="alv-balloon alv-balloon-one">🎈</span><span className="alv-balloon alv-balloon-two">🎈</span><span className="alv-balloon alv-balloon-three">🎈</span><span className="alv-confetti">✦</span><div className="alv-art-card">beautifully<br /><b>customised</b><br />for your moment</div></div>
    </section>

    <section className="alvernia-section alvernia-about"><div><p className="alvernia-kicker">A little bit about us</p><h2>Celebrate more.<br /><i>Plan less.</i></h2></div><div><p>Balloons &amp; Bliss is a Singapore-based event décor and balloon styling company creating beautifully customised setups for life&apos;s most special moments.</p><p>Every setup is thoughtfully tailored to your <b>theme, colours, occasion</b> and personal style—so your celebration feels unmistakably yours.</p></div></section>

    <section className="alvernia-section" id="celebrations"><p className="alvernia-kicker">Made for your moment</p><h2>Celebrations we cover</h2><div className="alvernia-celebration-grid">{celebrations.map(([icon, title]) => <div className="alvernia-celebration-card" key={title}><span>{icon}</span><strong>{title}</strong></div>)}</div></section>

    <section className="alvernia-benefits" id="benefits"><div className="alvernia-section"><p className="alvernia-kicker">Your card, your perks</p><h2>Exclusive Alvernia<br /><i>Ladies Card Benefits</i></h2><div className="alvernia-discount"><span>Alvernia member exclusive</span><strong>15%</strong><b>OFF</b><p>Classic, Signature &amp; Premium décor packages</p></div><div className="alvernia-benefits-grid">{benefits.map(([icon, title, copy]) => <div className="alvernia-benefit" key={title}><span>{icon}</span><div><h3>{title}</h3><p>{copy}</p></div></div>)}</div></div></section>

    <section className="alvernia-section alvernia-guide" id="guide"><div className="alvernia-guide-copy"><p className="alvernia-kicker">A little gift for you</p><h2>Planning a<br /><i>Celebration?</i></h2><p>Get our FREE Celebration Guide and make planning your little one&apos;s special day easier.</p><ul><li>Celebration planning checklist</li><li>Theme and décor ideas</li><li>Suggested celebration timeline</li><li>Cake, activity and photo area tips</li><li>Budget planning tips</li></ul></div><AlverniaForm /></section>

    <footer className="alvernia-footer"><div className="alvernia-brand"><img src="/logo.png" alt="" /><span>Balloons <em>&amp;</em> Bliss</span></div><p>Beautiful celebrations, thoughtfully styled in Singapore.</p></footer>
  </main>;
}

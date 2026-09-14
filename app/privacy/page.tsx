import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Privacy Policy | Balloons & Bliss', robots: { index: false, follow: false } };

export default function PrivacyPage() {
  return <main className="shell"><p className="eyebrow">Balloons &amp; Bliss</p><h1>Privacy Policy</h1><p className="lede">We use the details you share to deliver your requested guide and respond to your celebration enquiry. We do not sell your personal information. We retain enquiry details only for as long as reasonably needed for those purposes. You may withdraw marketing consent, or ask us to access, correct or delete your information, by emailing celebrate@balloonsandblisssg.com.</p></main>;
}

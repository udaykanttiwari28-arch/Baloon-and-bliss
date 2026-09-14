'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';

const celebrationTypes = ['Baby Welcome Home', 'Baby Shower', 'Gender Reveal', 'Full Month', '100 Days', 'First Birthday', 'Birthday', 'Baby Milestone', 'Wedding', 'Proposal', 'Corporate', 'Other'];

function track(event: string) {
  const dataLayer = (window as Window & { dataLayer?: Array<Record<string, unknown>> }).dataLayer;
  dataLayer?.push({ event, source: 'alvernia', campaign: 'alvernia_ladies_card' });
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  gtag?.('event', event, { source: 'alvernia', campaign: 'alvernia_ladies_card' });
}

export default function AlverniaForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [deliveryNotice, setDeliveryNotice] = useState('');
  const started = useRef(false);

  useEffect(() => {
    track('alvernia_page_view');
    const cta = document.querySelector('[data-alvernia-guide-cta]');
    const onClick = () => track('alvernia_guide_cta_click');
    cta?.addEventListener('click', onClick);
    return () => cta?.removeEventListener('click', onClick);
  }, []);

  function onStart() { if (!started.current) { started.current = true; track('alvernia_form_started'); } }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setState('sending'); setError('');
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    data.consent = data.consent === 'on' ? 'true' : 'false';
    try {
      const response = await fetch('/api/alvernia-leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? 'We could not send your guide. Please try again.');
      track('alvernia_lead_submitted');
      if (result.emailStatus === 'sent') track('alvernia_guide_email_sent');
      if (result.whatsappStatus === 'sent') track('alvernia_guide_whatsapp_sent');
      if (result.emailStatus !== 'sent' || result.whatsappStatus !== 'sent') setDeliveryNotice('Your details are saved. One delivery channel may need a little longer—our team will follow up if needed.');
      setState('success'); form.reset();
    } catch (submissionError) { setError(submissionError instanceof Error ? submissionError.message : 'We could not send your guide. Please try again.'); setState('error'); }
  }

  if (state === 'success') return <div className="alvernia-success" role="status"><span className="alvernia-success-icon">🎉</span><h3>Your Celebration Guide is on its way!</h3><p>Check your email and WhatsApp shortly.</p>{deliveryNotice && <p className="alvernia-delivery-notice">{deliveryNotice}</p>}<p className="alvernia-success-note">Don&apos;t forget — Alvernia Ladies Card members enjoy <b>15% OFF</b> our celebration packages plus complimentary member benefits.</p><a className="alvernia-button" href="/catalogue">Explore Our Packages <span>→</span></a></div>;

  return <form className="alvernia-form" onSubmit={submit} onFocus={onStart}><div className="alvernia-form-heading"><span>🎁</span><div><h3>Get your FREE guide</h3><p>Delivered to your email and WhatsApp.</p></div></div><label>Full Name<input name="name" autoComplete="name" required maxLength={100} /></label><label>Email Address<input type="email" name="email" autoComplete="email" required maxLength={254} /></label><label>WhatsApp Number<input type="tel" name="whatsapp_number" autoComplete="tel" placeholder="+65 8393 7938" required maxLength={25} /></label><div className="alvernia-form-grid"><label>Celebration Month <span className="alv-optional">optional</span><input type="month" name="celebration_month" /></label><label>Celebration Type <span className="alv-optional">optional</span><select name="celebration_type" defaultValue=""><option value="">Choose one</option>{celebrationTypes.map((type) => <option key={type}>{type}</option>)}</select></label></div><label className="alvernia-consent"><input type="checkbox" name="consent" required /> <span>I agree to receive my requested Celebration Guide by email and WhatsApp, and understand Balloons &amp; Bliss may contact me about this enquiry. I have read the <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.</span></label>{state === 'error' && <p className="alvernia-form-error" role="alert">{error}</p>}<button className="alvernia-button" type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Sending your guide…' : 'Get My FREE Guide'} <span>→</span></button><small>We respect your privacy. Unsubscribe anytime.</small></form>;
}

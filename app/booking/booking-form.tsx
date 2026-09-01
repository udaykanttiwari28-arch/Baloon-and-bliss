'use client';

import { FormEvent, useState } from 'react';

type BookingFormProps = { selectedProduct?: string };
const timeSlots = Array.from({ length: 48 }, (_, index) => {
  const hour = String(Math.floor(index / 4)).padStart(2, '0');
  const minute = String((index % 4) * 15).padStart(2, '0');
  return `${hour}:${minute}`;
});

export default function BookingForm({ selectedProduct }: BookingFormProps) {
  const [state, setState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('sending');
    setError('');
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    payload.whatsappOptIn = formData.get('whatsappOptIn') === 'on' ? 'true' : 'false';

    try {
      const response = await fetch('/api/booking-enquiries', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'We could not send your enquiry.');
      setReference(result.reference);
      setState('success');
      form.reset();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'We could not send your enquiry.');
      setState('error');
    }
  }

  if (state === 'success') {
    return <div className="success-card" role="status"><p className="eyebrow">Enquiry received</p><h2>We&apos;ll be in touch soon.</h2><p>Your reference is <strong>{reference}</strong>. Keep it handy when you contact us.</p><a className="button" href="/catalogue">Back to packages</a></div>;
  }

  return <form className="booking-form" onSubmit={submit}>
    <fieldset>
      <legend>Package</legend>
      <label htmlFor="package">Selected package</label>
      <select id="package" name="package" defaultValue={selectedProduct ?? ''} required>
        <option value="" disabled>Choose a package</option>
        <option value="classic-setup">Classic Setup — S$398</option>
        <option value="signature-setup">Signature Setup — S$450</option>
        <option value="premium-setup">Premium Setup — S$750</option>
      </select>
    </fieldset>
    <fieldset>
      <legend>Event details</legend>
      <div className="form-grid">
        <label>Event date<input type="date" name="eventDate" required /></label>
        <label>Start time<select name="startTime" defaultValue="" required><option value="" disabled>Select time</option>{timeSlots.map((time) => <option key={`start-${time}`} value={time}>{time}</option>)}</select></label>
        <label>End time<select name="endTime" defaultValue="" required><option value="" disabled>Select time</option>{timeSlots.map((time) => <option key={`end-${time}`} value={time}>{time}</option>)}</select></label>
        <label>Postal code<input name="postalCode" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required /></label>
      </div>
      <label>Venue<input name="venue" autoComplete="street-address" required /></label>
      <label>Special requirements<textarea name="specialRequirements" rows={4} placeholder="Theme, colours, guest count, add-ons or anything else you have in mind" /></label>
    </fieldset>
    <fieldset>
      <legend>Your details</legend>
      <label>Name<input name="name" autoComplete="name" required /></label>
      <div className="form-grid">
        <label>Email<input type="email" name="email" autoComplete="email" required /></label>
        <label>Mobile / WhatsApp<input type="tel" name="mobile" autoComplete="tel" required /></label>
      </div>
      <label className="checkbox-label"><input type="checkbox" name="whatsappOptIn" /> You may contact me on WhatsApp about this enquiry.</label>
    </fieldset>
    {state === 'error' && <p className="form-error" role="alert">{error}</p>}
    <button className="button" type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Sending enquiry…' : 'Send booking enquiry'}</button>
    <p className="fixture-note">No payment is taken here. We&apos;ll confirm availability and send your quote after reviewing the details.</p>
  </form>;
}

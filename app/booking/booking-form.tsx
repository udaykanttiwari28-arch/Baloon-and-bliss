'use client';

import { FormEvent, useState } from 'react';

type BookingFormProps = { selectedProduct?: string };
type BusyRange = { start_time: string; end_time: string; source: string };
const timeSlots = Array.from({ length: 57 }, (_, index) => {
  const totalMinutes = (7 * 60) + (index * 15);
  const hour = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minute = String(totalMinutes % 60).padStart(2, '0');
  return `${hour}:${minute}`;
});

function displayTime(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`;
}

export default function BookingForm({ selectedProduct }: BookingFormProps) {
  const [state, setState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [busyRanges, setBusyRanges] = useState<BusyRange[]>([]);
  const [availabilityMessage, setAvailabilityMessage] = useState('');

  function overlaps(start: string, end: string, range: BusyRange) { return start < range.end_time.slice(0, 5) && end > range.start_time.slice(0, 5); }
  const availableStartSlots = timeSlots.filter((time) => !busyRanges.some((range) => time >= range.start_time.slice(0, 5) && time < range.end_time.slice(0, 5)));
  const endTimeSlots = startTime ? timeSlots.slice(timeSlots.indexOf(startTime) + 1).filter((time) => !busyRanges.some((range) => overlaps(startTime, time, range))) : [];

  async function loadAvailability(eventDate: string) {
    setBusyRanges([]); setAvailabilityMessage(''); setEndTime('');
    if (!eventDate) return;
    const response = await fetch(`/api/availability?date=${encodeURIComponent(eventDate)}`);
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setAvailabilityMessage(result.error ?? 'Availability could not be checked.');
    else setBusyRanges(result.busy ?? []);
  }

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
        <option value="" disabled>Choose an option</option>
        <option value="classic-setup">Classic Setup — S$398</option>
        <option value="signature-setup">Signature Setup — S$450</option>
        <option value="premium-setup">Premium Setup — S$750</option>
        <option value="custom-setup">Custom setup — I don&apos;t need a package</option>
      </select>
      <p className="fixture-note">Choose Custom setup if you want something bespoke or would like us to recommend the right setup.</p>
    </fieldset>
    <fieldset>
      <legend>Event details</legend>
      <div className="form-grid">
        <label>Event date<input type="date" name="eventDate" onChange={(event) => void loadAvailability(event.target.value)} required /></label>
        <label>Start time<select name="startTime" value={startTime} onChange={(event) => { setStartTime(event.target.value); setEndTime(''); }} required><option value="" disabled>Select time</option>{availableStartSlots.map((time) => <option key={`start-${time}`} value={time}>{displayTime(time)}</option>)}</select></label>
        <label>End time<select name="endTime" value={endTime} onChange={(event) => setEndTime(event.target.value)} disabled={!startTime} required><option value="" disabled>{startTime ? 'Select time' : 'Choose start time first'}</option>{endTimeSlots.map((time) => <option key={`end-${time}`} value={time}>{displayTime(time)}</option>)}</select></label>
        <label>Postal code<input name="postalCode" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required /></label>
      </div>
      {availabilityMessage && <p className="form-error" role="alert">{availabilityMessage}</p>}
      {busyRanges.length > 0 && !availabilityMessage && <p className="availability-note">Some times are unavailable on this date. Please choose from the remaining slots.</p>}
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

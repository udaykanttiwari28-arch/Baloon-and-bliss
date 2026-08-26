import Link from 'next/link';
import { exampleCatalogue } from '../../src/catalogue/fixtures';
import { getProductBySlug } from '../../src/catalogue/catalogue';

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const { product: productSlug } = await searchParams;
  const product = productSlug ? getProductBySlug(exampleCatalogue, productSlug) : undefined;

  return (
    <main className="shell booking-shell">
      <Link className="back-link" href={product ? `/catalogue/${product.slug}` : '/catalogue'}>← Back</Link>
      <header className="page-header">
        <p className="eyebrow">Booking enquiry</p>
        <h1>Tell us about your celebration.</h1>
        <p className="lede">Share the essentials and our team will follow up with availability, setup details, and a confirmed quote.</p>
      </header>
      <form className="booking-form" action="#" method="post">
        <fieldset>
          <legend>Package</legend>
          <label htmlFor="package">Selected package</label>
          <select id="package" name="package" defaultValue={product?.slug ?? ''} required>
            <option value="" disabled>Choose a package</option>
            {exampleCatalogue.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
          </select>
        </fieldset>
        <fieldset>
          <legend>Event details</legend>
          <div className="form-grid">
            <label>Event date<input type="date" name="eventDate" required /></label>
            <label>Start time<input type="time" name="startTime" required /></label>
            <label>End time<input type="time" name="endTime" required /></label>
            <label>Postal code<input name="postalCode" inputMode="numeric" pattern="[0-9]{6}" required /></label>
          </div>
          <label>Venue<input name="venue" autoComplete="street-address" required /></label>
          <label>Special requirements<textarea name="specialRequirements" rows={4} /></label>
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
        <button className="button" type="submit">Send booking enquiry</button>
        <p className="fixture-note">This form is a UI prototype. Submission handling, server-side validation, trusted pricing, and booking references are the next implementation slice.</p>
      </form>
    </main>
  );
}

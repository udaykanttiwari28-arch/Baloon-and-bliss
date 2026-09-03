# Balloons & Bliss SG Platform — Development Plan

Last updated: 2026-08-24

## Current status

- Repository now contains the preserved multi-page HTML site plus the Next.js catalogue application deployed through Vercel.
- Existing public pages, blog content, gallery, branding, SEO files, and WhatsApp contact flow must be preserved.
- Catalogue browsing and a first booking-enquiry application layer now exist; admin dashboard, payments, notifications, and automated test harness remain.
- The saved Jira import contains 8 MVP epics and 28 stories, but the supplied BBSG-1/BBSG-2 links are Atlassian Home projects rather than provisioned Jira projects. Jira issue creation is therefore deferred until a Jira project is available.

## MVP outcome

Deliver a mobile-first booking-request platform that lets customers browse active balloon-decoration packages, view complete package details, submit event and contact details, and receive a booking reference. Authorized admins can manage catalogue data and incoming booking requests.

Payments, customer accounts, shopping cart, promo codes, calendar, inventory, notifications beyond the initial admin alert, and reporting are later-release scope.

## Architecture direction

- Introduce a Next.js application layer incrementally; preserve current public content during migration.
- Use Supabase for PostgreSQL, authentication, row-level security, customer profiles, and image storage.
- Keep payment integration behind a provider interface; HitPay is later-release scope.
- Validate prices, discounts, inventory, booking state, and webhook events on the server.
- Prefer reusable domain types and server-side services over page-specific business logic.

## Parallel workstreams

### Agent A — Foundation and data model

Scope:

- Create the application scaffold and local development commands.
- Define environment configuration and deployment expectations.
- Design and implement the initial Supabase schema for products, categories, options, add-ons, customers, bookings, and booking items.
- Add seed data structure and migration documentation.

Definition of done:

- App starts locally with documented commands.
- Database migrations are repeatable.
- Server-only secrets are separated from public configuration.
- Core schema supports the MVP booking flow.

### Agent B — Catalogue and customer browsing

Scope:

- Define product/category/options/add-ons domain types.
- Build catalogue read services and responsive listing/detail views.
- Add product image model and responsive image handling.
- Preserve current fonts, colours, navigation, blog, gallery, metadata, and mobile styling.

Definition of done:

- Active products can be listed by category.
- Product detail includes gallery, description, price, options, add-ons, and booking CTA.
- Existing public pages remain reachable and visually consistent.

### Agent C — Booking request flow

Scope:

- Build package/options/add-ons selection.
- Capture event date, times, venue, postal code, special requirements, and customer contact details.
- Calculate totals server-side and ignore client-submitted totals.
- Create unique booking references with `New` status.
- Build confirmation page with request summary and next steps.

Definition of done:

- A customer can submit a complete booking request on mobile.
- Invalid or incomplete input is rejected with clear messages.
- Persisted booking totals are calculated from trusted catalogue data.
- Confirmation displays the booking reference.

### Agent D — Admin, security, and quality

Scope:

- Add admin authentication and authorization boundaries.
- Build admin product editor and booking list/detail/status views.
- Add server-side validation and row-level security policies.
- Establish smoke, integration, and mobile viewport checks.
- Verify Vercel environment configuration and production deployment behavior.

Definition of done:

- Only authorized admins can manage products and bookings.
- Booking statuses support New, Contacted, Confirmed, and Cancelled with audit timestamps.
- Customer input, authorization, and price-tampering tests pass.
- Deployment checklist is documented and verified.

## Delivery order

1. Foundation scaffold, schema, and environment contract.
2. Catalogue read model and customer browsing.
3. Booking request flow and confirmation.
4. Admin catalogue and booking management.
5. Security hardening, mobile testing, deployment validation, and migration cleanup.

Workstreams may proceed in parallel after Agent A publishes the shared domain model and environment contract.

## Shared contracts to settle first

- Product, category, option, add-on, booking, booking item, customer, and image types.
- Booking status values: `New`, `Contacted`, `Confirmed`, `Cancelled`.
- Money representation: integer minor units plus currency, never floating-point totals.
- Booking reference format and uniqueness rule.
- Public versus server-only environment variables.
- Admin role representation and authorization policy.

## Immediate next tasks

- [x] Choose the application scaffold direction: incremental application layer over the existing HTML site.
- [x] Add the shared domain model and environment example file.
- [x] Write the first database migration and local seed strategy.
- [x] Inventory existing page routes and reusable brand styles.
- [x] Define the first catalogue fixture and booking fixture.
- [x] Add the initial Next.js/TypeScript app shell and catalogue routes.
- [x] Add the first mobile booking-request form surface.
- [x] Add Classic Setup, Signature Setup, and Premium Setup package tiers.
- [x] Add approved package prices and included-item breakdowns, with Signature marked Most Popular.
- [x] Add a minimal runtime validation command (`typecheck` and production build).
- [x] Replace development-only catalogue fixtures with Supabase Storage image reads while package copy remains fixture-backed.
- [x] Create Supabase project and `product-images` storage bucket.
- [x] Run the product-image Storage read policy migration.
- [x] Upload approved package images and map Storage paths to package folders.
- [x] Add server-side booking-enquiry validation, persistence, and reference generation.
- [x] Build the validated booking request form.
- [x] Run `0003_booking_enquiries.sql` in Supabase and verify a real production enquiry end to end.
- [x] Build the first authenticated admin enquiry list and status management UI.
- [x] Add a public uncropped gallery using all uploaded package images.
- [x] Restore the BB&SG logo and favicon, and keep the Gallery link visible on mobile.
- [x] Create the admin Supabase Auth user and run `0004_admin_enquiry_policies.sql`.
- [ ] Add availability management so admins can block dates/times and prevent conflicting enquiries.
- [ ] Revisit booking email notifications after the Resend domain is verified. Current test sender restriction rejects delivery to `celebrate@balloonsandblisssg.com`; code and Vercel variables are deployed, but this is intentionally parked.
- [ ] Revisit Jira once a real Jira project key/site is provisioned.

## Decision log

| Date | Decision | Reason |
|---|---|---|
| 2026-08-24 | Preserve existing public HTML content during migration | Existing site already contains branded pages, blog, gallery, SEO, and contact flow. |
| 2026-08-24 | Use Supabase as the initial data/auth/storage layer | Matches the saved MVP plan and supports server-side access plus row-level security. |
| 2026-08-24 | Defer payments from MVP | Saved plan identifies HitPay payments as a later-release epic. |
| 2026-08-24 | Track work in this file until Jira is provisioned | Current BBSG links resolve to Atlassian Home projects, not Jira projects accessible through the MCP. |

## Change log

- 2026-08-24: Initial development plan created from `PROJECT_PLAN.md` and `jira-bbsg-mvp-import.csv`.
- 2026-08-24: Catalogue slice added with development-only fixture data and pure active-product/category read helpers.
- 2026-08-24: Added the initial Next.js/TypeScript shell, catalogue listing route, and product detail route without removing existing HTML pages.
- 2026-08-26: Expanded the development catalogue to Classic Setup, Signature Setup, and Premium Setup with draft options, add-ons, and prices.
- 2026-08-26: Updated package tiers to Classic $398, Signature $450, and Premium $750 with included styling details supplied by the owner.
- 2026-08-26: Refined Premium inclusions to 3+ backdrops or one large backdrop up to 500cm wide, and 3+ themed cutouts.
- 2026-08-26: Standardized package wording to use custom backdrops and themed cutouts across Classic, Signature, and Premium.
- 2026-08-26: Added setup and delivery at the customer venue to all three package inclusions.
- 2026-08-26: Added Helium Cluster, Table Centrepiece, and Themed Plates & Cutleries as optional price-on-request add-ons across all packages.
- 2026-08-26: Refined the shared venue benefit wording to “Stress-free setup and delivery at your venue.”
- 2026-08-26: Made package components modular so features from other tiers can be requested as optional price-on-request upgrades on every package.
- 2026-09-01: Added the first functional booking-enquiry flow with server validation, Supabase persistence, and customer references; added the `0003_booking_enquiries.sql` migration.
- 2026-09-01: Added the first authenticated admin enquiry dashboard with status updates and customer contact links; added the `0004_admin_enquiry_policies.sql` migration.
- 2026-09-01: Parked Resend email notifications until `balloonsandblisssg.com` is verified; production logs confirmed Resend's test-recipient restriction.
- 2026-09-01: Next planned feature is admin-managed availability and conflict prevention for booking dates and 15-minute time slots.
- 2026-08-26: Updated optional extras presentation to show “Price on request” once at section level, without repeating it on every line item.
- 2026-08-26: Updated setup detail pages to display the full Supabase image list in a responsive gallery instead of only the first image.
- 2026-08-26: Changed setup galleries to a vertical scroll view with natural image dimensions so uploaded images are not cropped.
- 2026-08-26: Set `IMG_0802.JPG` as the Classic Setup front image while retaining the full Classic gallery.
- 2026-08-26: Set the selected DJI image as Signature’s front image and `d059efa2-d557-46dd-a1d5-4f91cf32f4f9.jpg` as Premium’s front image.
- 2026-08-26: Made the catalogue the default `/` homepage and added a richer hero, service benefits, package emphasis, and enquiry call-to-action.
- 2026-08-26: Added the official Instagram connection link to the homepage.
- 2026-08-24: Dependency installation was attempted but stalled; runtime typecheck/build remains pending until packages can be installed.
- 2026-08-24: Dependencies installed; `npm run typecheck` and `npm run build` pass. Live localhost smoke test was blocked by sandbox `EPERM` when binding port 3000.
- 2026-08-24: Confirmed loopback startup and all four routes return HTTP 200 with elevated local-network permission; npm dev/start scripts now bind to `127.0.0.1` by default.

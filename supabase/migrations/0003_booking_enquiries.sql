create table if not exists public.booking_enquiries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  package_slug text not null check (package_slug in ('classic-setup', 'signature-setup', 'premium-setup')),
  event_date date not null,
  start_time time not null,
  end_time time not null,
  postal_code text not null check (postal_code ~ '^[0-9]{6}$'),
  venue text not null,
  special_requirements text,
  name text not null,
  email text not null,
  mobile text not null,
  whatsapp_opt_in boolean not null default false,
  status text not null default 'New' check (status in ('New', 'Contacted', 'Confirmed', 'Cancelled')),
  created_at timestamptz not null default now(),
  constraint booking_enquiry_end_after_start check (end_time > start_time)
);

alter table public.booking_enquiries enable row level security;

create or replace function public.submit_booking_enquiry(enquiry jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  new_reference text;
begin
  if enquiry->>'package_slug' not in ('classic-setup', 'signature-setup', 'premium-setup') then raise exception 'Invalid package'; end if;
  if enquiry->>'email' !~* '^[^\s@]+@[^\s@]+\.[^\s@]+$' then raise exception 'Invalid email'; end if;
  if enquiry->>'postal_code' !~ '^[0-9]{6}$' then raise exception 'Invalid postal code'; end if;
  if (enquiry->>'end_time')::time <= (enquiry->>'start_time')::time then raise exception 'Invalid time range'; end if;
  new_reference := 'BBSG-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  insert into public.booking_enquiries (reference, package_slug, event_date, start_time, end_time, postal_code, venue, special_requirements, name, email, mobile, whatsapp_opt_in)
  values (new_reference, enquiry->>'package_slug', (enquiry->>'event_date')::date, (enquiry->>'start_time')::time, (enquiry->>'end_time')::time, enquiry->>'postal_code', enquiry->>'venue', enquiry->>'special_requirements', enquiry->>'name', enquiry->>'email', enquiry->>'mobile', coalesce((enquiry->>'whatsapp_opt_in')::boolean, false));
  return new_reference;
end;
$$;

revoke all on function public.submit_booking_enquiry(jsonb) from public;
grant execute on function public.submit_booking_enquiry(jsonb) to anon, authenticated;

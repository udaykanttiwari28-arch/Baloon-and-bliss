create table if not exists public.availability_blocks (
  id uuid primary key default gen_random_uuid(),
  event_date date not null,
  start_time time not null,
  end_time time not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint availability_block_end_after_start check (end_time > start_time)
);

alter table public.availability_blocks enable row level security;

create policy "Anyone can view availability blocks"
on public.availability_blocks for select to anon, authenticated using (true);

create policy "Authenticated admins can create availability blocks"
on public.availability_blocks for insert to authenticated with check (true);

create policy "Authenticated admins can update availability blocks"
on public.availability_blocks for update to authenticated using (true) with check (true);

create policy "Authenticated admins can delete availability blocks"
on public.availability_blocks for delete to authenticated using (true);

create or replace function public.get_booking_busy_times(target_date date)
returns table (start_time time, end_time time, source text)
language sql
security definer
set search_path = public
as $$
  select b.start_time, b.end_time, 'blocked'::text
  from public.availability_blocks b
  where b.event_date = target_date
  union all
  select e.start_time, e.end_time, 'enquiry'::text
  from public.booking_enquiries e
  where e.event_date = target_date and e.status <> 'Cancelled';
$$;

revoke all on function public.get_booking_busy_times(date) from public;
grant execute on function public.get_booking_busy_times(date) to anon, authenticated;

create or replace function public.submit_booking_enquiry(enquiry jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  new_reference text;
  requested_date date := (enquiry->>'event_date')::date;
  requested_start time := (enquiry->>'start_time')::time;
  requested_end time := (enquiry->>'end_time')::time;
begin
  if enquiry->>'package_slug' not in ('classic-setup', 'signature-setup', 'premium-setup') then raise exception 'Invalid package'; end if;
  if enquiry->>'email' !~* '^[^\s@]+@[^\s@]+\.[^\s@]+$' then raise exception 'Invalid email'; end if;
  if enquiry->>'postal_code' !~ '^[0-9]{6}$' then raise exception 'Invalid postal code'; end if;
  if requested_end <= requested_start then raise exception 'Invalid time range'; end if;
  if exists (
    select 1 from public.availability_blocks b
    where b.event_date = requested_date and requested_start < b.end_time and requested_end > b.start_time
  ) then raise exception 'That time is unavailable. Please choose another time.'; end if;
  if exists (
    select 1 from public.booking_enquiries e
    where e.event_date = requested_date and e.status <> 'Cancelled'
      and requested_start < e.end_time and requested_end > e.start_time
  ) then raise exception 'That time has already been requested. Please choose another time.'; end if;
  new_reference := 'BBSG-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  insert into public.booking_enquiries (reference, package_slug, event_date, start_time, end_time, postal_code, venue, special_requirements, name, email, mobile, whatsapp_opt_in)
  values (new_reference, enquiry->>'package_slug', requested_date, requested_start, requested_end, enquiry->>'postal_code', enquiry->>'venue', enquiry->>'special_requirements', enquiry->>'name', enquiry->>'email', enquiry->>'mobile', coalesce((enquiry->>'whatsapp_opt_in')::boolean, false));
  return new_reference;
end;
$$;

revoke all on function public.submit_booking_enquiry(jsonb) from public;
grant execute on function public.submit_booking_enquiry(jsonb) to anon, authenticated;

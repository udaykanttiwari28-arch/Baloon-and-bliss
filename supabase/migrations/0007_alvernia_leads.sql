alter table public.booking_enquiries
  drop constraint if exists booking_enquiries_package_slug_check;

alter table public.booking_enquiries
  add constraint booking_enquiries_package_slug_check
    check (package_slug in ('classic-setup', 'signature-setup', 'premium-setup', 'custom-setup'));

alter table public.booking_enquiries
  alter column event_date drop not null,
  alter column start_time drop not null,
  alter column end_time drop not null,
  alter column postal_code drop not null,
  alter column venue drop not null;

alter table public.booking_enquiries
  add column if not exists lead_kind text not null default 'booking'
    check (lead_kind in ('booking', 'alvernia_lead')),
  add column if not exists source text,
  add column if not exists campaign text,
  add column if not exists celebration_month text,
  add column if not exists celebration_type text,
  add column if not exists guide_requested boolean not null default false,
  add column if not exists guide_delivery_status text not null default 'not_requested'
    check (guide_delivery_status in ('not_requested', 'pending', 'sent', 'partial', 'failed')),
  add column if not exists email_delivery_status text not null default 'not_requested'
    check (email_delivery_status in ('not_requested', 'pending', 'sent', 'failed', 'not_configured')),
  add column if not exists whatsapp_delivery_status text not null default 'not_requested'
    check (whatsapp_delivery_status in ('not_requested', 'pending', 'sent', 'failed', 'not_configured')),
  add column if not exists consent_at timestamptz;

create index if not exists booking_enquiries_source_idx
  on public.booking_enquiries (source, created_at desc);

create or replace function public.submit_alvernia_lead(lead jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_lead public.booking_enquiries;
  new_reference text;
  new_id uuid;
begin
  if lead->>'name' is null or length(trim(lead->>'name')) < 2 then raise exception 'Invalid name'; end if;
  if lead->>'email' !~* '^[^\s@]+@[^\s@]+\.[^\s@]+$' then raise exception 'Invalid email'; end if;
  if lead->>'whatsapp_number' is null or length(trim(lead->>'whatsapp_number')) < 8 then raise exception 'Invalid WhatsApp number'; end if;
  if nullif(trim(lead->>'celebration_type'), '') is not null and lead->>'celebration_type' not in ('Baby Welcome Home', 'Baby Shower', 'Gender Reveal', 'Full Month', '100 Days', 'First Birthday', 'Birthday', 'Baby Milestone', 'Wedding', 'Proposal', 'Corporate', 'Other') then raise exception 'Invalid celebration type'; end if;
  if lead->>'celebration_month' is not null and lead->>'celebration_month' !~ '^\d{4}-(0[1-9]|1[0-2])$' then raise exception 'Invalid celebration month'; end if;
  if coalesce((lead->>'consent')::boolean, false) is not true then raise exception 'Consent is required'; end if;

  select * into existing_lead
  from public.booking_enquiries
  where lead_kind = 'alvernia_lead'
    and source = 'alvernia'
    and lower(email) = lower(trim(lead->>'email'))
    and created_at > now() - interval '24 hours'
  order by created_at desc
  limit 1;

  if existing_lead.id is not null then
    return jsonb_build_object('id', existing_lead.id, 'reference', existing_lead.reference, 'duplicate', true);
  end if;

  new_reference := 'ALV-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  insert into public.booking_enquiries (
    reference, package_slug, name, email, mobile, status, lead_kind, source, campaign,
    celebration_month, celebration_type, guide_requested, guide_delivery_status,
    email_delivery_status, whatsapp_delivery_status, consent_at
  ) values (
    new_reference, 'custom-setup', trim(lead->>'name'), lower(trim(lead->>'email')), trim(lead->>'whatsapp_number'),
    'New', 'alvernia_lead', 'alvernia', 'Alvernia Ladies Card', nullif(trim(lead->>'celebration_month'), ''),
    lead->>'celebration_type', true, 'pending', 'pending', 'pending', now()
  ) returning id into new_id;

  return jsonb_build_object('id', new_id, 'reference', new_reference, 'duplicate', false);
end;
$$;

revoke all on function public.submit_alvernia_lead(jsonb) from public;
grant execute on function public.submit_alvernia_lead(jsonb) to anon, authenticated;

create or replace function public.update_alvernia_delivery_status(
  lead_id uuid,
  channel text,
  delivery_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then raise exception 'Server role required'; end if;
  if channel not in ('email', 'whatsapp', 'guide') then raise exception 'Invalid delivery channel'; end if;
  if delivery_status not in ('pending', 'sent', 'partial', 'failed', 'not_configured') then raise exception 'Invalid delivery status'; end if;
  if channel = 'email' then
    update public.booking_enquiries set email_delivery_status = delivery_status where id = lead_id and lead_kind = 'alvernia_lead';
  elsif channel = 'whatsapp' then
    update public.booking_enquiries set whatsapp_delivery_status = delivery_status where id = lead_id and lead_kind = 'alvernia_lead';
  else
    update public.booking_enquiries set guide_delivery_status = delivery_status where id = lead_id and lead_kind = 'alvernia_lead';
  end if;
end;
$$;

revoke all on function public.update_alvernia_delivery_status(uuid, text, text) from public;
grant execute on function public.update_alvernia_delivery_status(uuid, text, text) to anon, authenticated;

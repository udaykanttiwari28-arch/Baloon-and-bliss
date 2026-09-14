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
  if delivery_status not in ('pending', 'sent', 'partial', 'failed', 'not_configured', 'not_requested') then raise exception 'Invalid delivery status'; end if;
  if channel = 'email' then
    update public.booking_enquiries set email_delivery_status = delivery_status where id = lead_id and lead_kind = 'alvernia_lead';
  elsif channel = 'whatsapp' then
    update public.booking_enquiries set whatsapp_delivery_status = delivery_status where id = lead_id and lead_kind = 'alvernia_lead';
  else
    update public.booking_enquiries set guide_delivery_status = delivery_status where id = lead_id and lead_kind = 'alvernia_lead';
  end if;
end;
$$;

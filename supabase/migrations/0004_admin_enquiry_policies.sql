create policy "Authenticated admins can read booking enquiries"
on public.booking_enquiries
for select
to authenticated
using (true);

create policy "Authenticated admins can update booking enquiries"
on public.booking_enquiries
for update
to authenticated
using (true)
with check (true);

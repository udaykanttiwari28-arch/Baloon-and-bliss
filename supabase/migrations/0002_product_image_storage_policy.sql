-- Allows the public catalogue to list files in the public product-images bucket.
-- The bucket remains public for image downloads; uploads/deletes are not granted.
create policy "Public can list product images"
on storage.objects
for select
to public
using (bucket_id = 'product-images');

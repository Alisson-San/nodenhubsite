-- Images remain private until referenced by an active published product.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('catalog-media','catalog-media',false,8388608,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;
create policy catalog_media_admin_insert on storage.objects for insert to authenticated
with check(bucket_id='catalog-media' and (select public.is_admin()));
create policy catalog_media_admin_read on storage.objects for select to authenticated
using(bucket_id='catalog-media' and (select public.is_admin()));
create policy catalog_media_published_read on storage.objects for select to anon,authenticated
using(bucket_id='catalog-media' and exists(
 select 1 from public.product_details d
 join public.pricing_items i on i.id=d.pricing_item_id
 join public.service_pages p on p.id=i.service_page_id
 where i.is_active and p.is_published
 and exists(select 1 from jsonb_array_elements(d.content->'media') m
 where m->>'url'='storage://catalog-media/'||storage.objects.name)
));
-- No public bucket, overwrite or deletion policy. Orphan cleanup requires a separate reviewed operation.

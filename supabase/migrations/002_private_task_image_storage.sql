update storage.buckets
set public = false
where id = 'task-images';

create policy task_images_storage_select_company
on storage.objects
for select
using (
  bucket_id = 'task-images'
  and exists (
    select 1
    from tasks t
    where t.id = ((storage.foldername(name))[3])::uuid
      and t.company_id = current_company_id()
  )
);

create policy task_images_storage_insert_company
on storage.objects
for insert
with check (
  bucket_id = 'task-images'
  and current_role() in ('admin', 'manager', 'worker', 'contractor')
  and exists (
    select 1
    from tasks t
    where t.id = ((storage.foldername(name))[3])::uuid
      and t.company_id = current_company_id()
  )
);

create policy task_images_storage_update_company
on storage.objects
for update
using (
  bucket_id = 'task-images'
  and current_role() in ('admin', 'manager', 'worker', 'contractor')
  and exists (
    select 1
    from tasks t
    where t.id = ((storage.foldername(name))[3])::uuid
      and t.company_id = current_company_id()
  )
)
with check (
  bucket_id = 'task-images'
  and current_role() in ('admin', 'manager', 'worker', 'contractor')
  and exists (
    select 1
    from tasks t
    where t.id = ((storage.foldername(name))[3])::uuid
      and t.company_id = current_company_id()
  )
);

create policy task_images_storage_delete_company
on storage.objects
for delete
using (
  bucket_id = 'task-images'
  and current_role() in ('admin', 'manager', 'worker', 'contractor')
  and exists (
    select 1
    from tasks t
    where t.id = ((storage.foldername(name))[3])::uuid
      and t.company_id = current_company_id()
  )
);

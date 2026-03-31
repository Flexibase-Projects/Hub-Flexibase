grant usage on schema hub_flexibase to authenticated, service_role;
grant all on all tables in schema hub_flexibase to service_role;
grant usage, select on all sequences in schema hub_flexibase to service_role;
grant select, insert, update on all tables in schema hub_flexibase to authenticated;

create or replace function hub_flexibase.hub_is_admin(check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = hub_flexibase, public, auth
as $$
  select exists (
    select 1
    from hub_flexibase.hub_user_roles user_roles
    join hub_flexibase.hub_roles roles
      on roles.id = user_roles.role_id
    where user_roles.user_id = check_user
      and roles.key = 'admin'
      and roles.deleted_at is null
      and user_roles.deleted_at is null
  );
$$;

create or replace function hub_flexibase.hub_has_department_access(
  check_department uuid,
  check_user uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = hub_flexibase, public, auth
as $$
  select exists (
    select 1
    from hub_flexibase.hub_user_departments user_departments
    where user_departments.user_id = check_user
      and user_departments.department_id = check_department
      and user_departments.deleted_at is null
  );
$$;

create or replace function hub_flexibase.hub_document_visible(
  check_document uuid,
  check_user uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = hub_flexibase, public, auth
as $$
  select exists (
    select 1
    from hub_flexibase.hub_documents documents
    where documents.id = check_document
      and documents.deleted_at is null
      and (
        documents.is_restricted = false
        or exists (
          select 1
          from hub_flexibase.hub_document_departments document_departments
          join hub_flexibase.hub_user_departments user_departments
            on user_departments.department_id = document_departments.department_id
          where document_departments.document_id = documents.id
            and document_departments.deleted_at is null
            and user_departments.user_id = check_user
            and user_departments.deleted_at is null
        )
      )
  );
$$;

grant execute on function hub_flexibase.hub_is_admin(uuid) to authenticated, service_role;
grant execute on function hub_flexibase.hub_has_department_access(uuid, uuid) to authenticated, service_role;
grant execute on function hub_flexibase.hub_document_visible(uuid, uuid) to authenticated, service_role;

alter table hub_flexibase.hub_roles enable row level security;
alter table hub_flexibase.hub_user_profiles enable row level security;
alter table hub_flexibase.hub_user_roles enable row level security;
alter table hub_flexibase.hub_departments enable row level security;
alter table hub_flexibase.hub_user_departments enable row level security;
alter table hub_flexibase.hub_system_links enable row level security;
alter table hub_flexibase.hub_system_link_departments enable row level security;
alter table hub_flexibase.hub_banners enable row level security;
alter table hub_flexibase.hub_notices enable row level security;
alter table hub_flexibase.hub_notice_reads enable row level security;
alter table hub_flexibase.hub_documents enable row level security;
alter table hub_flexibase.hub_document_departments enable row level security;

drop policy if exists hub_roles_read_active on hub_flexibase.hub_roles;
create policy hub_roles_read_active
on hub_flexibase.hub_roles
for select
to authenticated
using (deleted_at is null);

drop policy if exists hub_roles_admin_manage on hub_flexibase.hub_roles;
create policy hub_roles_admin_manage
on hub_flexibase.hub_roles
for all
to authenticated
using (hub_flexibase.hub_is_admin())
with check (hub_flexibase.hub_is_admin());

drop policy if exists hub_user_profiles_self_read on hub_flexibase.hub_user_profiles;
create policy hub_user_profiles_self_read
on hub_flexibase.hub_user_profiles
for select
to authenticated
using (id = auth.uid() or hub_flexibase.hub_is_admin());

drop policy if exists hub_user_profiles_self_insert on hub_flexibase.hub_user_profiles;
create policy hub_user_profiles_self_insert
on hub_flexibase.hub_user_profiles
for insert
to authenticated
with check (id = auth.uid() or hub_flexibase.hub_is_admin());

drop policy if exists hub_user_profiles_self_update on hub_flexibase.hub_user_profiles;
create policy hub_user_profiles_self_update
on hub_flexibase.hub_user_profiles
for update
to authenticated
using (id = auth.uid() or hub_flexibase.hub_is_admin())
with check (id = auth.uid() or hub_flexibase.hub_is_admin());

drop policy if exists hub_user_roles_self_read on hub_flexibase.hub_user_roles;
create policy hub_user_roles_self_read
on hub_flexibase.hub_user_roles
for select
to authenticated
using (user_id = auth.uid() or hub_flexibase.hub_is_admin());

drop policy if exists hub_user_roles_admin_manage on hub_flexibase.hub_user_roles;
create policy hub_user_roles_admin_manage
on hub_flexibase.hub_user_roles
for all
to authenticated
using (hub_flexibase.hub_is_admin())
with check (hub_flexibase.hub_is_admin());

drop policy if exists hub_departments_read_active on hub_flexibase.hub_departments;
create policy hub_departments_read_active
on hub_flexibase.hub_departments
for select
to authenticated
using (deleted_at is null);

drop policy if exists hub_departments_admin_manage on hub_flexibase.hub_departments;
create policy hub_departments_admin_manage
on hub_flexibase.hub_departments
for all
to authenticated
using (hub_flexibase.hub_is_admin())
with check (hub_flexibase.hub_is_admin());

drop policy if exists hub_user_departments_self_read on hub_flexibase.hub_user_departments;
create policy hub_user_departments_self_read
on hub_flexibase.hub_user_departments
for select
to authenticated
using (user_id = auth.uid() or hub_flexibase.hub_is_admin());

drop policy if exists hub_user_departments_admin_manage on hub_flexibase.hub_user_departments;
create policy hub_user_departments_admin_manage
on hub_flexibase.hub_user_departments
for all
to authenticated
using (hub_flexibase.hub_is_admin())
with check (hub_flexibase.hub_is_admin());

drop policy if exists hub_system_links_read_active on hub_flexibase.hub_system_links;
create policy hub_system_links_read_active
on hub_flexibase.hub_system_links
for select
to authenticated
using (deleted_at is null and is_active = true);

drop policy if exists hub_system_links_admin_manage on hub_flexibase.hub_system_links;
create policy hub_system_links_admin_manage
on hub_flexibase.hub_system_links
for all
to authenticated
using (hub_flexibase.hub_is_admin())
with check (hub_flexibase.hub_is_admin());

drop policy if exists hub_system_link_departments_read on hub_flexibase.hub_system_link_departments;
create policy hub_system_link_departments_read
on hub_flexibase.hub_system_link_departments
for select
to authenticated
using (deleted_at is null);

drop policy if exists hub_system_link_departments_admin_manage on hub_flexibase.hub_system_link_departments;
create policy hub_system_link_departments_admin_manage
on hub_flexibase.hub_system_link_departments
for all
to authenticated
using (hub_flexibase.hub_is_admin())
with check (hub_flexibase.hub_is_admin());

drop policy if exists hub_banners_read_active on hub_flexibase.hub_banners;
create policy hub_banners_read_active
on hub_flexibase.hub_banners
for select
to authenticated
using (deleted_at is null and is_active = true);

drop policy if exists hub_banners_admin_manage on hub_flexibase.hub_banners;
create policy hub_banners_admin_manage
on hub_flexibase.hub_banners
for all
to authenticated
using (hub_flexibase.hub_is_admin())
with check (hub_flexibase.hub_is_admin());

drop policy if exists hub_notices_read_active on hub_flexibase.hub_notices;
create policy hub_notices_read_active
on hub_flexibase.hub_notices
for select
to authenticated
using (deleted_at is null and is_active = true);

drop policy if exists hub_notices_admin_manage on hub_flexibase.hub_notices;
create policy hub_notices_admin_manage
on hub_flexibase.hub_notices
for all
to authenticated
using (hub_flexibase.hub_is_admin())
with check (hub_flexibase.hub_is_admin());

drop policy if exists hub_notice_reads_self_read on hub_flexibase.hub_notice_reads;
create policy hub_notice_reads_self_read
on hub_flexibase.hub_notice_reads
for select
to authenticated
using (user_id = auth.uid() or hub_flexibase.hub_is_admin());

drop policy if exists hub_notice_reads_self_insert on hub_flexibase.hub_notice_reads;
create policy hub_notice_reads_self_insert
on hub_flexibase.hub_notice_reads
for insert
to authenticated
with check (user_id = auth.uid() or hub_flexibase.hub_is_admin());

drop policy if exists hub_notice_reads_self_update on hub_flexibase.hub_notice_reads;
create policy hub_notice_reads_self_update
on hub_flexibase.hub_notice_reads
for update
to authenticated
using (user_id = auth.uid() or hub_flexibase.hub_is_admin())
with check (user_id = auth.uid() or hub_flexibase.hub_is_admin());

drop policy if exists hub_documents_read_visible on hub_flexibase.hub_documents;
create policy hub_documents_read_visible
on hub_flexibase.hub_documents
for select
to authenticated
using (
  deleted_at is null
  and is_active = true
  and (
    is_restricted = false
    or hub_flexibase.hub_document_visible(id)
    or hub_flexibase.hub_is_admin()
  )
);

drop policy if exists hub_documents_admin_manage on hub_flexibase.hub_documents;
create policy hub_documents_admin_manage
on hub_flexibase.hub_documents
for all
to authenticated
using (hub_flexibase.hub_is_admin())
with check (hub_flexibase.hub_is_admin());

drop policy if exists hub_document_departments_read on hub_flexibase.hub_document_departments;
create policy hub_document_departments_read
on hub_flexibase.hub_document_departments
for select
to authenticated
using (deleted_at is null);

drop policy if exists hub_document_departments_admin_manage on hub_flexibase.hub_document_departments;
create policy hub_document_departments_admin_manage
on hub_flexibase.hub_document_departments
for all
to authenticated
using (hub_flexibase.hub_is_admin())
with check (hub_flexibase.hub_is_admin());

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('hub-documents', 'hub-documents', false, 52428800),
  ('hub-assets', 'hub-assets', false, 10485760)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;

drop policy if exists hub_documents_storage_admin_manage on storage.objects;
create policy hub_documents_storage_admin_manage
on storage.objects
for all
to authenticated
using (
  bucket_id in ('hub-documents', 'hub-assets')
  and hub_flexibase.hub_is_admin(auth.uid())
)
with check (
  bucket_id in ('hub-documents', 'hub-assets')
  and hub_flexibase.hub_is_admin(auth.uid())
);

create or replace function hub_flexibase.reserve_luiz_admin()
returns trigger
language plpgsql
security definer
set search_path = hub_flexibase, public, auth
as $$
begin
  if lower(coalesce(new.email, '')) <> 'luiz2506spike@gmail.com' then
    return new;
  end if;

  new.raw_app_meta_data := coalesce(new.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
    'role', 'admin',
    'is_admin', true
  );

  new.raw_user_meta_data := coalesce(new.raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
    'role', 'admin',
    'is_admin', true
  );

  insert into hub_flexibase.hub_user_profiles (
    id,
    email,
    full_name,
    is_active
  )
  values (
    new.id,
    new.email,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      split_part(new.email, '@', 1),
      'Administrador'
    ),
    true
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name,
    is_active = true,
    deleted_at = null,
    purge_after_at = null;

  insert into hub_flexibase.hub_user_roles (
    user_id,
    role_id,
    deleted_at,
    purge_after_at
  )
  select
    new.id,
    roles.id,
    null,
    null
  from hub_flexibase.hub_roles roles
  where roles.key = 'admin'
  on conflict (user_id, role_id) do update
  set
    deleted_at = null,
    purge_after_at = null,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists hub_flexibase_reserve_luiz_admin on auth.users;
create trigger hub_flexibase_reserve_luiz_admin
before insert or update of email, raw_app_meta_data, raw_user_meta_data
on auth.users
for each row
execute function hub_flexibase.reserve_luiz_admin();

update auth.users
set
  raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
    'role', 'admin',
    'is_admin', true
  ),
  raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
    'role', 'admin',
    'is_admin', true
  )
where lower(email) = 'luiz2506spike@gmail.com';

insert into hub_flexibase.hub_user_profiles (
  id,
  email,
  full_name,
  is_active
)
select
  users.id,
  users.email,
  coalesce(
    nullif(trim(users.raw_user_meta_data ->> 'full_name'), ''),
    split_part(users.email, '@', 1),
    'Administrador'
  ),
  true
from auth.users users
where lower(users.email) = 'luiz2506spike@gmail.com'
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  is_active = true,
  deleted_at = null,
  purge_after_at = null;

insert into hub_flexibase.hub_user_roles (
  user_id,
  role_id,
  deleted_at,
  purge_after_at
)
select
  users.id,
  roles.id,
  null,
  null
from auth.users users
join hub_flexibase.hub_roles roles
  on roles.key = 'admin'
where lower(users.email) = 'luiz2506spike@gmail.com'
on conflict (user_id, role_id) do update
set
  deleted_at = null,
  purge_after_at = null,
  updated_at = timezone('utc', now());

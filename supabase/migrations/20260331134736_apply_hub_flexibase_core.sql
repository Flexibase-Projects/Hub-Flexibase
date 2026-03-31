create extension if not exists pgcrypto;

create schema if not exists hub_flexibase;

create or replace function hub_flexibase.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists hub_flexibase.hub_roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key in ('operator', 'employee', 'manager', 'admin')),
  label text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  purge_after_at timestamptz
);

create table if not exists hub_flexibase.hub_user_profiles (
  id uuid primary key references auth.users (id) on delete restrict,
  email text not null,
  full_name text not null,
  job_title text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  purge_after_at timestamptz
);

create table if not exists hub_flexibase.hub_user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references hub_flexibase.hub_user_profiles (id) on delete restrict,
  role_id uuid not null references hub_flexibase.hub_roles (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  purge_after_at timestamptz,
  unique (user_id, role_id)
);

create table if not exists hub_flexibase.hub_departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  purge_after_at timestamptz
);

create table if not exists hub_flexibase.hub_user_departments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references hub_flexibase.hub_user_profiles (id) on delete restrict,
  department_id uuid not null references hub_flexibase.hub_departments (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  purge_after_at timestamptz,
  unique (user_id, department_id)
);

create table if not exists hub_flexibase.hub_system_links (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  target_url text not null,
  image_url text,
  accent_color text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  purge_after_at timestamptz
);

create table if not exists hub_flexibase.hub_system_link_departments (
  id uuid primary key default gen_random_uuid(),
  system_link_id uuid not null references hub_flexibase.hub_system_links (id) on delete restrict,
  department_id uuid not null references hub_flexibase.hub_departments (id) on delete restrict,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  purge_after_at timestamptz,
  unique (system_link_id, department_id)
);

create table if not exists hub_flexibase.hub_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  body text,
  image_url text,
  tone text not null default 'info' check (tone in ('info', 'success', 'warning')),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  purge_after_at timestamptz
);

create table if not exists hub_flexibase.hub_notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  severity text not null default 'important' check (severity in ('critical', 'important', 'info')),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  purge_after_at timestamptz
);

create table if not exists hub_flexibase.hub_notice_reads (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid not null references hub_flexibase.hub_notices (id) on delete restrict,
  user_id uuid not null references hub_flexibase.hub_user_profiles (id) on delete restrict,
  read_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  purge_after_at timestamptz,
  unique (notice_id, user_id)
);

create table if not exists hub_flexibase.hub_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null,
  file_name text not null,
  mime_type text,
  storage_bucket text not null default 'hub-documents',
  storage_path text not null,
  file_size bigint,
  is_restricted boolean not null default false,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  purge_after_at timestamptz
);

create table if not exists hub_flexibase.hub_document_departments (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references hub_flexibase.hub_documents (id) on delete restrict,
  department_id uuid not null references hub_flexibase.hub_departments (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  purge_after_at timestamptz,
  unique (document_id, department_id)
);

create index if not exists hub_user_roles_user_id_idx
  on hub_flexibase.hub_user_roles (user_id)
  where deleted_at is null;

create index if not exists hub_user_departments_user_id_idx
  on hub_flexibase.hub_user_departments (user_id)
  where deleted_at is null;

create index if not exists hub_system_links_active_idx
  on hub_flexibase.hub_system_links (is_active, sort_order)
  where deleted_at is null;

create index if not exists hub_notices_active_idx
  on hub_flexibase.hub_notices (is_active, sort_order)
  where deleted_at is null;

create index if not exists hub_documents_active_idx
  on hub_flexibase.hub_documents (is_active, sort_order)
  where deleted_at is null;

create index if not exists hub_notice_reads_user_id_idx
  on hub_flexibase.hub_notice_reads (user_id, notice_id)
  where deleted_at is null;

drop trigger if exists hub_roles_set_updated_at on hub_flexibase.hub_roles;
create trigger hub_roles_set_updated_at
before update on hub_flexibase.hub_roles
for each row
execute function hub_flexibase.set_updated_at();

drop trigger if exists hub_user_profiles_set_updated_at on hub_flexibase.hub_user_profiles;
create trigger hub_user_profiles_set_updated_at
before update on hub_flexibase.hub_user_profiles
for each row
execute function hub_flexibase.set_updated_at();

drop trigger if exists hub_user_roles_set_updated_at on hub_flexibase.hub_user_roles;
create trigger hub_user_roles_set_updated_at
before update on hub_flexibase.hub_user_roles
for each row
execute function hub_flexibase.set_updated_at();

drop trigger if exists hub_departments_set_updated_at on hub_flexibase.hub_departments;
create trigger hub_departments_set_updated_at
before update on hub_flexibase.hub_departments
for each row
execute function hub_flexibase.set_updated_at();

drop trigger if exists hub_user_departments_set_updated_at on hub_flexibase.hub_user_departments;
create trigger hub_user_departments_set_updated_at
before update on hub_flexibase.hub_user_departments
for each row
execute function hub_flexibase.set_updated_at();

drop trigger if exists hub_system_links_set_updated_at on hub_flexibase.hub_system_links;
create trigger hub_system_links_set_updated_at
before update on hub_flexibase.hub_system_links
for each row
execute function hub_flexibase.set_updated_at();

drop trigger if exists hub_system_link_departments_set_updated_at on hub_flexibase.hub_system_link_departments;
create trigger hub_system_link_departments_set_updated_at
before update on hub_flexibase.hub_system_link_departments
for each row
execute function hub_flexibase.set_updated_at();

drop trigger if exists hub_banners_set_updated_at on hub_flexibase.hub_banners;
create trigger hub_banners_set_updated_at
before update on hub_flexibase.hub_banners
for each row
execute function hub_flexibase.set_updated_at();

drop trigger if exists hub_notices_set_updated_at on hub_flexibase.hub_notices;
create trigger hub_notices_set_updated_at
before update on hub_flexibase.hub_notices
for each row
execute function hub_flexibase.set_updated_at();

drop trigger if exists hub_notice_reads_set_updated_at on hub_flexibase.hub_notice_reads;
create trigger hub_notice_reads_set_updated_at
before update on hub_flexibase.hub_notice_reads
for each row
execute function hub_flexibase.set_updated_at();

drop trigger if exists hub_documents_set_updated_at on hub_flexibase.hub_documents;
create trigger hub_documents_set_updated_at
before update on hub_flexibase.hub_documents
for each row
execute function hub_flexibase.set_updated_at();

drop trigger if exists hub_document_departments_set_updated_at on hub_flexibase.hub_document_departments;
create trigger hub_document_departments_set_updated_at
before update on hub_flexibase.hub_document_departments
for each row
execute function hub_flexibase.set_updated_at();

insert into hub_flexibase.hub_roles (key, label, description)
values
  ('operator', 'Operator', 'Acesso operacional básico ao hub'),
  ('employee', 'Employee', 'Acesso padrão aos conteúdos internos'),
  ('manager', 'Manager', 'Acesso de liderança e conteúdos restritos da área'),
  ('admin', 'Admin', 'Controle administrativo completo do hub')
on conflict (key) do update
set
  label = excluded.label,
  description = excluded.description,
  deleted_at = null,
  purge_after_at = null,
  is_active = true;

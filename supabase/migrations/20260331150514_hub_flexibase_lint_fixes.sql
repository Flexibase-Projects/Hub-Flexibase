create or replace function hub_flexibase.set_updated_at()
returns trigger
language plpgsql
set search_path = hub_flexibase, public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create index if not exists hub_user_roles_role_id_idx
  on hub_flexibase.hub_user_roles (role_id)
  where deleted_at is null;

create index if not exists hub_user_departments_department_id_idx
  on hub_flexibase.hub_user_departments (department_id)
  where deleted_at is null;

create index if not exists hub_system_link_departments_department_id_idx
  on hub_flexibase.hub_system_link_departments (department_id)
  where deleted_at is null;

create index if not exists hub_document_departments_department_id_idx
  on hub_flexibase.hub_document_departments (department_id)
  where deleted_at is null;

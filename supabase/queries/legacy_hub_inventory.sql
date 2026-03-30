-- 0) Schemas cujo nome sugere HUB (visão geral antes das tabelas)
select
  schema_name,
  schema_owner
from information_schema.schemata
where schema_name not in ('pg_catalog', 'information_schema', 'pg_toast')
  and lower(schema_name) like 'hub%'
order by schema_name;

-- 1) Tabelas / views em information_schema
select
  table_schema,
  table_name,
  table_type
from information_schema.tables
where table_schema not in ('pg_catalog', 'information_schema')
  and (
    lower(table_schema) like 'hub%'
    or lower(table_name) like 'hub_%'
  )
order by table_schema, table_name;

-- 2) Tabelas físicas em pg_tables (checagem cruzada)
select
  schemaname,
  tablename,
  hasindexes,
  hasrules,
  hastriggers
from pg_tables
where schemaname not in ('pg_catalog', 'information_schema')
  and (
    lower(schemaname) like 'hub%'
    or lower(tablename) like 'hub_%'
  )
order by schemaname, tablename;

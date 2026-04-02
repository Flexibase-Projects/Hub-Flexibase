alter table hub_flexibase.hub_system_links
add column if not exists icon_key text default 'AppsRounded';

update hub_flexibase.hub_system_links
set icon_key = 'AppsRounded'
where icon_key is null or btrim(icon_key) = '';

alter table hub_flexibase.hub_system_links
alter column icon_key set default 'AppsRounded';

alter table hub_flexibase.hub_system_links
alter column icon_key set not null;

create table if not exists hub_flexibase.hub_analytics_sessions (
  session_id uuid primary key,
  user_id uuid not null references hub_flexibase.hub_user_profiles (id) on delete cascade,
  department_ids uuid[] not null default '{}',
  entry_path text not null,
  device_type text not null default 'desktop'
    check (device_type in ('desktop', 'mobile', 'tablet', 'bot', 'unknown')),
  user_agent text,
  started_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists hub_flexibase.hub_analytics_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references hub_flexibase.hub_analytics_sessions (session_id) on delete cascade,
  user_id uuid not null references hub_flexibase.hub_user_profiles (id) on delete cascade,
  event_name text not null
    check (event_name in ('page_view', 'system_click', 'document_download', 'notice_read')),
  path text not null,
  target_type text,
  target_key text,
  target_label text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists hub_flexibase.hub_analytics_page_loads (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references hub_flexibase.hub_analytics_sessions (session_id) on delete cascade,
  user_id uuid not null references hub_flexibase.hub_user_profiles (id) on delete cascade,
  path text not null,
  page_load_ms integer,
  ttfb_ms integer,
  fcp_ms integer,
  lcp_ms integer,
  inp_ms integer,
  cls numeric(10, 4),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists hub_analytics_sessions_user_started_idx
  on hub_flexibase.hub_analytics_sessions (user_id, started_at desc);

create index if not exists hub_analytics_sessions_last_seen_idx
  on hub_flexibase.hub_analytics_sessions (last_seen_at desc);

create index if not exists hub_analytics_events_session_created_idx
  on hub_flexibase.hub_analytics_events (session_id, created_at);

create index if not exists hub_analytics_events_name_created_idx
  on hub_flexibase.hub_analytics_events (event_name, created_at);

create index if not exists hub_analytics_events_target_idx
  on hub_flexibase.hub_analytics_events (target_type, target_key, created_at);

create index if not exists hub_analytics_page_loads_session_created_idx
  on hub_flexibase.hub_analytics_page_loads (session_id, created_at);

create index if not exists hub_analytics_page_loads_path_created_idx
  on hub_flexibase.hub_analytics_page_loads (path, created_at);

drop trigger if exists hub_analytics_sessions_set_updated_at on hub_flexibase.hub_analytics_sessions;
create trigger hub_analytics_sessions_set_updated_at
before update on hub_flexibase.hub_analytics_sessions
for each row
execute function hub_flexibase.set_updated_at();

grant all on table hub_flexibase.hub_analytics_sessions to service_role;
grant all on table hub_flexibase.hub_analytics_events to service_role;
grant all on table hub_flexibase.hub_analytics_page_loads to service_role;

grant select, insert, update on table hub_flexibase.hub_analytics_sessions to authenticated;
grant select, insert on table hub_flexibase.hub_analytics_events to authenticated;
grant select, insert on table hub_flexibase.hub_analytics_page_loads to authenticated;

alter table hub_flexibase.hub_analytics_sessions enable row level security;
alter table hub_flexibase.hub_analytics_events enable row level security;
alter table hub_flexibase.hub_analytics_page_loads enable row level security;

drop policy if exists hub_analytics_sessions_self_read on hub_flexibase.hub_analytics_sessions;
create policy hub_analytics_sessions_self_read
on hub_flexibase.hub_analytics_sessions
for select
to authenticated
using (user_id = auth.uid() or hub_flexibase.hub_is_admin());

drop policy if exists hub_analytics_sessions_self_insert on hub_flexibase.hub_analytics_sessions;
create policy hub_analytics_sessions_self_insert
on hub_flexibase.hub_analytics_sessions
for insert
to authenticated
with check (user_id = auth.uid() or hub_flexibase.hub_is_admin());

drop policy if exists hub_analytics_sessions_self_update on hub_flexibase.hub_analytics_sessions;
create policy hub_analytics_sessions_self_update
on hub_flexibase.hub_analytics_sessions
for update
to authenticated
using (user_id = auth.uid() or hub_flexibase.hub_is_admin())
with check (user_id = auth.uid() or hub_flexibase.hub_is_admin());

drop policy if exists hub_analytics_events_self_read on hub_flexibase.hub_analytics_events;
create policy hub_analytics_events_self_read
on hub_flexibase.hub_analytics_events
for select
to authenticated
using (user_id = auth.uid() or hub_flexibase.hub_is_admin());

drop policy if exists hub_analytics_events_self_insert on hub_flexibase.hub_analytics_events;
create policy hub_analytics_events_self_insert
on hub_flexibase.hub_analytics_events
for insert
to authenticated
with check (user_id = auth.uid() or hub_flexibase.hub_is_admin());

drop policy if exists hub_analytics_page_loads_self_read on hub_flexibase.hub_analytics_page_loads;
create policy hub_analytics_page_loads_self_read
on hub_flexibase.hub_analytics_page_loads
for select
to authenticated
using (user_id = auth.uid() or hub_flexibase.hub_is_admin());

drop policy if exists hub_analytics_page_loads_self_insert on hub_flexibase.hub_analytics_page_loads;
create policy hub_analytics_page_loads_self_insert
on hub_flexibase.hub_analytics_page_loads
for insert
to authenticated
with check (user_id = auth.uid() or hub_flexibase.hub_is_admin());

create schema if not exists hub;

drop view if exists hub.hub_system_links;

create view hub.hub_system_links as
select
  id,
  title,
  description,
  target_url,
  icon_key,
  image_url,
  accent_color,
  sort_order,
  is_active,
  created_at,
  updated_at,
  deleted_at,
  purge_after_at
from hub_flexibase.hub_system_links;

create or replace view hub.hub_analytics_sessions as
select
  session_id,
  user_id,
  department_ids,
  entry_path,
  device_type,
  user_agent,
  started_at,
  last_seen_at,
  created_at,
  updated_at
from hub_flexibase.hub_analytics_sessions;

create or replace view hub.hub_analytics_events as
select
  id,
  session_id,
  user_id,
  event_name,
  path,
  target_type,
  target_key,
  target_label,
  metadata,
  created_at
from hub_flexibase.hub_analytics_events;

create or replace view hub.hub_analytics_page_loads as
select
  id,
  session_id,
  user_id,
  path,
  page_load_ms,
  ttfb_ms,
  fcp_ms,
  lcp_ms,
  inp_ms,
  cls,
  created_at
from hub_flexibase.hub_analytics_page_loads;

create or replace view hub.hub_admin_session_summary as
with event_rollup as (
  select
    events.session_id,
    count(*) filter (where events.event_name = 'page_view') as page_view_count,
    count(*) filter (where events.event_name = 'system_click') as system_click_count,
    count(*) filter (where events.event_name = 'document_download') as document_download_count,
    count(*) filter (where events.event_name = 'notice_read') as notice_read_count,
    count(*) filter (
      where events.event_name in ('system_click', 'document_download', 'notice_read')
    ) as action_event_count,
    min(events.created_at) filter (
      where events.event_name in ('system_click', 'document_download', 'notice_read')
    ) as first_action_at,
    min(events.created_at) filter (
      where events.event_name = 'system_click'
    ) as first_system_click_at
  from hub_flexibase.hub_analytics_events events
  group by events.session_id
),
load_rollup as (
  select
    loads.session_id,
    round(avg(loads.page_load_ms)::numeric, 2) as avg_page_load_ms,
    round(
      percentile_cont(0.95) within group (order by loads.page_load_ms)::numeric,
      2
    ) as p95_page_load_ms
  from hub_flexibase.hub_analytics_page_loads loads
  where loads.page_load_ms is not null
  group by loads.session_id
)
select
  sessions.session_id,
  sessions.user_id,
  sessions.department_ids,
  sessions.entry_path,
  sessions.device_type,
  sessions.user_agent,
  sessions.started_at,
  sessions.last_seen_at,
  date(timezone('America/Sao_Paulo', sessions.started_at)) as activity_day,
  coalesce(event_rollup.page_view_count, 0) as page_view_count,
  coalesce(event_rollup.system_click_count, 0) as system_click_count,
  coalesce(event_rollup.document_download_count, 0) as document_download_count,
  coalesce(event_rollup.notice_read_count, 0) as notice_read_count,
  coalesce(event_rollup.action_event_count, 0) as action_event_count,
  event_rollup.first_action_at,
  event_rollup.first_system_click_at,
  case
    when event_rollup.first_action_at is null then null
    else round(extract(epoch from (event_rollup.first_action_at - sessions.started_at)) * 1000)::integer
  end as first_action_after_ms,
  case
    when event_rollup.first_system_click_at is null then null
    else round(extract(epoch from (event_rollup.first_system_click_at - sessions.started_at)) * 1000)::integer
  end as first_system_click_after_ms,
  load_rollup.avg_page_load_ms,
  load_rollup.p95_page_load_ms,
  coalesce(event_rollup.action_event_count, 0) > 0 as had_action,
  exists (
    select 1
    from hub_flexibase.hub_analytics_sessions previous_sessions
    where previous_sessions.user_id = sessions.user_id
      and previous_sessions.started_at < sessions.started_at
  ) as is_returning_user,
  coalesce(load_rollup.avg_page_load_ms, 0) >= 4000
    or coalesce(load_rollup.p95_page_load_ms, 0) >= 6000 as is_slow_session
from hub_flexibase.hub_analytics_sessions sessions
left join event_rollup
  on event_rollup.session_id = sessions.session_id
left join load_rollup
  on load_rollup.session_id = sessions.session_id;

create or replace view hub.hub_admin_system_click_events as
select
  events.id,
  events.session_id,
  events.user_id,
  sessions.department_ids,
  events.path,
  events.target_type,
  events.target_key,
  events.target_label,
  events.created_at,
  date(timezone('America/Sao_Paulo', events.created_at)) as activity_day,
  summary.first_system_click_after_ms
from hub_flexibase.hub_analytics_events events
join hub_flexibase.hub_analytics_sessions sessions
  on sessions.session_id = events.session_id
left join hub.hub_admin_session_summary summary
  on summary.session_id = events.session_id
where events.event_name = 'system_click';

create or replace view hub.hub_admin_page_load_samples as
select
  loads.id,
  loads.session_id,
  loads.user_id,
  sessions.department_ids,
  loads.path,
  loads.page_load_ms,
  loads.ttfb_ms,
  loads.fcp_ms,
  loads.lcp_ms,
  loads.inp_ms,
  loads.cls,
  loads.created_at,
  date(timezone('America/Sao_Paulo', loads.created_at)) as activity_day
from hub_flexibase.hub_analytics_page_loads loads
join hub_flexibase.hub_analytics_sessions sessions
  on sessions.session_id = loads.session_id;

create or replace view hub.hub_admin_page_view_events as
select
  page_views.id,
  page_views.session_id,
  page_views.user_id,
  sessions.department_ids,
  page_views.path,
  page_views.created_at,
  date(timezone('America/Sao_Paulo', page_views.created_at)) as activity_day,
  next_action.event_name as first_action_name,
  next_action.created_at as first_action_at,
  case
    when next_action.created_at is null then null
    else round(extract(epoch from (next_action.created_at - page_views.created_at)) * 1000)::integer
  end as action_after_ms,
  next_action.created_at is not null as had_follow_up_action
from hub_flexibase.hub_analytics_events page_views
join hub_flexibase.hub_analytics_sessions sessions
  on sessions.session_id = page_views.session_id
left join lateral (
  select
    later_events.event_name,
    later_events.created_at
  from hub_flexibase.hub_analytics_events later_events
  where later_events.session_id = page_views.session_id
    and later_events.created_at > page_views.created_at
    and later_events.event_name in ('system_click', 'document_download', 'notice_read')
  order by later_events.created_at asc
  limit 1
) next_action on true
where page_views.event_name = 'page_view';

create or replace view hub.hub_admin_content_events as
select
  events.id,
  events.session_id,
  events.user_id,
  sessions.department_ids,
  events.event_name,
  events.path,
  events.target_key,
  events.target_label,
  events.created_at,
  date(timezone('America/Sao_Paulo', events.created_at)) as activity_day
from hub_flexibase.hub_analytics_events events
join hub_flexibase.hub_analytics_sessions sessions
  on sessions.session_id = events.session_id
where events.event_name in ('document_download', 'notice_read');

grant usage on schema hub to anon, authenticated, service_role;

grant select on hub.hub_system_links to anon, authenticated, service_role;
grant insert, update, delete on hub.hub_system_links to authenticated, service_role;
grant select, insert, update on hub.hub_analytics_sessions to authenticated, service_role;
grant select, insert on hub.hub_analytics_events to authenticated, service_role;
grant select, insert on hub.hub_analytics_page_loads to authenticated, service_role;
grant select on hub.hub_admin_session_summary to authenticated, service_role;
grant select on hub.hub_admin_system_click_events to authenticated, service_role;
grant select on hub.hub_admin_page_load_samples to authenticated, service_role;
grant select on hub.hub_admin_page_view_events to authenticated, service_role;
grant select on hub.hub_admin_content_events to authenticated, service_role;

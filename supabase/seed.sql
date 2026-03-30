insert into hub_flexibase.hub_departments (name, slug, description, sort_order)
values
  ('Desenvolvimento', 'desenvolvimento', 'Ferramentas e sistemas do time de software.', 0),
  ('Tecnologia da Informação', 'ti', 'Operação e suporte interno de TI.', 1)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  deleted_at = null,
  purge_after_at = null,
  is_active = true;

insert into hub_flexibase.hub_system_links (
  title,
  description,
  target_url,
  accent_color,
  sort_order
)
values
  ('Central de Chamados', 'Acesso rápido ao fluxo interno de suporte.', 'https://example.internal/helpdesk', '#0F4C81', 0),
  ('Wiki Técnica', 'Documentação e padrões internos do time.', 'https://example.internal/wiki', '#18794E', 1)
on conflict do nothing;

insert into hub_flexibase.hub_banners (
  title,
  subtitle,
  body,
  tone,
  sort_order
)
values
  ('Bem-vindo ao novo HUB', 'Uma entrada mais rápida para o dia a dia.', 'Comece centralizando sistemas, documentos e comunicados no mesmo lugar.', 'info', 0)
on conflict do nothing;

insert into hub_flexibase.hub_notices (
  title,
  body,
  severity,
  sort_order
)
values
  ('Comunicado inicial', 'Cadastre avisos importantes aqui para aparecerem no topo do hub.', 'important', 0)
on conflict do nothing;

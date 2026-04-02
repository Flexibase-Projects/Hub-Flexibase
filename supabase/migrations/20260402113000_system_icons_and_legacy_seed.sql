alter table hub_flexibase.hub_system_links
add column if not exists icon_key text default 'AppsRounded';

update hub_flexibase.hub_system_links
set icon_key = 'AppsRounded'
where icon_key is null or btrim(icon_key) = '';

alter table hub_flexibase.hub_system_links
alter column icon_key set default 'AppsRounded';

alter table hub_flexibase.hub_system_links
alter column icon_key set not null;

with legacy_systems (
  title,
  description,
  target_url,
  icon_key,
  sort_order
) as (
  values
    ('Chamado de Manutencao', 'Abertura de chamados e acompanhamento das demandas de manutencao.', 'http://192.168.1.251/manu/', 'EngineeringRounded', 0),
    ('Chamado de TI', 'Central de suporte tecnico e atendimento interno de TI.', 'http://192.168.1.251/desk/index.php', 'SupportAgentRounded', 1),
    ('CRM Nectar', 'Gestao de relacionamento comercial e acompanhamento de oportunidades.', 'https://app.nectarcrm.com.br/crm/?language=pt-BR', 'HandshakeRounded', 2),
    ('Custos e Manutencoes', 'Consulta de custos operacionais e manutencoes relacionadas.', 'http://192.168.1.251/custos/', 'PaymentRounded', 3),
    ('Focco Producao', 'Acesso ao ambiente principal de producao do Focco.', 'http://192.168.1.99/proweb/Authentication/Login', 'PrecisionManufacturingRounded', 4),
    ('Focco Teste', 'Ambiente de testes do Focco para validacoes internas.', 'http://192.168.1.99/tesweb/Authentication/Login', 'PrecisionManufacturingRounded', 5),
    ('Focco Web', 'Portal web do Focco para operacoes conectadas.', 'http://192.168.1.68:8080/f3iConnect/app/login.faces;jsessionid=73370BF61D5ABA520351E1CC10E4BC6B', 'LanguageRounded', 6),
    ('Gestao de Arquivos', 'Repositorio interno para consulta de documentos e conhecimento.', 'http://192.168.1.251/docs/knowledgebase.php', 'DescriptionRounded', 7),
    ('Marketing', 'Acesso aos recursos e fluxos internos de marketing.', 'http://192.168.1.251/marketing/', 'CampaignRounded', 8),
    ('PCM Solucoes', 'Gestao de manutencao, planejamento e engenharia.', 'https://192.168.1.2/', 'EngineeringRounded', 9),
    ('Projetos Executivos', 'Acompanhamento dos projetos executivos e suas entregas.', 'http://192.168.1.251/exec/', 'TaskRounded', 10),
    ('Registro de Ocorrencias', 'Registro e acompanhamento de ocorrencias internas.', 'http://192.168.1.251/registro/', 'FactCheckRounded', 11),
    ('RH-Documentos', 'Consulta de documentos e referencias da area de RH.', 'http://192.168.1.251/docs/knowledgebase.php?category=36', 'DescriptionRounded', 12),
    ('Seguranca de Trabalho', 'Acesso a conteudos e rotinas de seguranca do trabalho.', 'http://192.168.1.251/segra/knowledgebase.php', 'SafetyCheckRounded', 13),
    ('Site Flexibase', 'Portal institucional da Flexibase.', 'https://flexibase.com.br/', 'LanguageRounded', 14),
    ('Solicitacao de Projetos', 'Entrada de novas solicitacoes e demandas de projetos.', 'http://192.168.1.251/projetos/', 'TaskRounded', 15)
)
insert into hub_flexibase.hub_system_links (
  title,
  description,
  target_url,
  icon_key,
  image_url,
  accent_color,
  sort_order,
  is_active,
  deleted_at,
  purge_after_at
)
select
  legacy.title,
  legacy.description,
  legacy.target_url,
  legacy.icon_key,
  null,
  null,
  legacy.sort_order,
  true,
  null,
  null
from legacy_systems legacy
where not exists (
  select 1
  from hub_flexibase.hub_system_links existing
  where existing.target_url = legacy.target_url
);

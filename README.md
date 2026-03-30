# HUB Flexibase

Hub empresarial web interno para centralizar sistemas, documentos e comunicados da Flexibase com foco em rapidez de uso, visual moderno e base sólida para crescer sem virar um projeto pesado.

## Visão geral

O HUB Flexibase foi desenhado para substituir um hub antigo e pouco atrativo por uma experiência mais rápida, organizada e agradável. A primeira versão prioriza times de desenvolvimento e TI, mas a base já suporta expansão para outros perfis da empresa.

Objetivos centrais:

- facilitar o acesso rápido aos sistemas internos
- centralizar comunicados prioritários
- disponibilizar documentos internos com controle simples por área
- oferecer um painel administrativo único para operação do conteúdo

## Stack utilizada

### Frontend e app shell

- `Next.js` + `React` + `TypeScript`
- `MUI` para design system e produtividade visual
- `React Hook Form` + `Zod` para login e validações estruturadas

Motivo:

- permite um monólito modular leve
- combina server-first com interatividade onde realmente importa
- reduz a necessidade de criar uma API separada no MVP

### Backend e dados

- `Supabase Auth` para email e senha
- `Supabase Postgres` com schema dedicado `hub_flexibase`
- `Supabase Storage` para documentos privados
- `RLS` como controle de acesso obrigatório no banco

Motivo:

- aproveita a base Supabase compartilhada da empresa
- facilita autenticação, storage e segurança com menos infraestrutura
- mantém o projeto preparado para integrações futuras

### Qualidade e entrega

- `Vitest` + `Testing Library`
- `Playwright` para smoke e2e
- `GitHub Actions` para pipeline mínima

## Arquitetura

- estilo: `monólito modular`
- app único
- sem microserviços
- sem backend separado
- sem analytics pesado na v1

Rotas principais:

- `/login`
- `/forgot-password`
- `/hub`
- `/admin`
- `/admin/systems`
- `/admin/banners`
- `/admin/notices`
- `/admin/documents`
- `/admin/users`
- `/api/documents/:id/download`

## Estrutura do projeto

```text
src/
  app/
    (public)/
    (protected)/
    api/
  modules/
    admin/
    auth/
    hub/
    layout/
  shared/
    lib/
    schemas/
    types/
    ui/
supabase/
  migrations/
  queries/
  seed.sql
.codex/
  config.toml
```

## Banco de dados

### Convenção adotada

- schema dedicado: `hub_flexibase`
- todas as tabelas com prefixo `hub_`
- sem exclusão física direta
- retenção mínima de 90 dias via `deleted_at` e `purge_after_at`

Tabelas centrais:

- `hub_roles`
- `hub_user_profiles`
- `hub_user_roles`
- `hub_departments`
- `hub_user_departments`
- `hub_system_links`
- `hub_system_link_departments`
- `hub_banners`
- `hub_notices`
- `hub_notice_reads`
- `hub_documents`
- `hub_document_departments`

### Migrações

Arquivos principais:

- `supabase/migrations/20260327170000_hub_flexibase_core.sql`
- `supabase/migrations/20260327171000_hub_flexibase_policies.sql`

### Inventário legado

Antes de aplicar migrations em qualquer ambiente compartilhado, siga `supabase/legacy-hub-inventory-checklist.md` em resumo:

1. conectar o MCP do Supabase (local ou Cloud, conforme `.codex/config.toml`)
2. executar `supabase/queries/legacy_hub_inventory.sql`
3. listar schemas e tabelas HUB existentes
4. confirmar que não haverá colisão com `hub_flexibase`

Se houver colisão, ajustar o novo schema antes da aplicação para `hub_flexibase_v2`.

## Autenticação

- login com `email + senha` via Supabase Auth
- sessão longa e segura com refresh de cookies via `proxy.ts`
- link “Esqueci minha senha” direciona para suporte na v1
- o hub cria/atualiza o perfil local em `hub_user_profiles` após login bem-sucedido

## Funcionalidades implementadas

### Hub principal

- avisos prioritários com confirmação de leitura
- banners e destaques
- cards de sistemas agrupados por departamento
- documentos com download seguro

### Painel admin

- CRUD de sistemas
- CRUD de banners
- CRUD de comunicados
- CRUD de documentos
- gestão de departamentos
- atribuição de papel e departamentos para usuários já presentes no hub

## Documentos e storage

- bucket privado: `hub-documents`
- download via rota segura `/api/documents/:id/download`
- acesso liberado conforme papel e departamentos

## Instalação e execução

### Pré-requisitos

- Node.js `24+`
- npm `11+`
- um projeto Supabase já existente

### Passos

1. instalar dependências

```bash
npm install
```

2. criar `.env.local` com base em `.env.example`

3. preencher:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_HUB_SUPABASE_SCHEMA=hub_flexibase
FLEXIBASE_SUPPORT_EMAIL=suporte@flexibase.com.br
```

4. aplicar migrations e seed no Supabase

5. iniciar localmente

```bash
npm run dev
```

### Scripts úteis

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
npm run test:e2e
```

## MCP do Supabase no Codex

O `.codex/config.toml` aponta o MCP para a **API local** do Supabase (LAN), ex.: `http://192.168.1.220:54321/mcp` (`enabled = true`). Ajuste o host se o seu stack não for esse IP.

Para **Supabase Cloud**, comente o bloco local e use o exemplo no próprio `.codex/config.toml` com `project_ref` do dashboard (fluxo OAuth do cliente).

Checklist de inventário legado antes das migrations: `supabase/legacy-hub-inventory-checklist.md` e SQL em `supabase/queries/legacy_hub_inventory.sql`.

## Deploy

Recomendação:

- app web em `Vercel`
- banco e auth no `Supabase`
- pipeline via `GitHub Actions`

Fluxo sugerido:

1. validar inventário de HUB legado
2. aplicar migrations em ambiente seguro
3. validar app com usuários admin iniciais
4. publicar

## Boas práticas adotadas

- schema dedicado para evitar colisões no banco compartilhado
- `RLS` em todas as tabelas do domínio do hub
- soft delete com retenção
- admin único, sem criar outro produto interno
- design system consistente com MUI
- pipeline mínima desde o início

## Contribuição

1. crie uma branch
2. implemente a alteração
3. rode `npm run check`
4. abra o PR com contexto técnico e funcional

## Objetivo final

Entregar um hub interno bonito, rápido e simples de operar hoje, mas já pronto para crescer em módulos, perfis e integrações no futuro, sem cair cedo em complexidade desnecessária.

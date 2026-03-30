# Inventário de schemas HUB legados (antes de `hub_flexibase`)

Execute **no mesmo banco** onde serão aplicadas as migrations em `supabase/migrations/`. O objetivo é evitar colisão de nomes de schema/tabelas com instalações antigas do HUB.

## 1. Como executar o SQL

Escolha uma opção:

- **Supabase MCP (Codex / Cursor)** em modo leitura: ferramenta `execute_sql` com o conteúdo de `supabase/queries/legacy_hub_inventory.sql`.
- **`psql`**:  
  `psql "<SUA_DATABASE_URL_POSTGRES>" -f supabase/queries/legacy_hub_inventory.sql`
- **Supabase Studio** → SQL Editor → colar o arquivo e rodar.

> A stack do projeto usa `NEXT_PUBLIC_SUPABASE_URL` (API). A URL do **Postgres** costuma ser outra (porta 5432 interna). Use a connection string do projeto (Dashboard → Database ou `supabase status` no CLI).

## 2. Registrar os resultados

O script devolve **três** conjuntos de linhas:

| Consulta | O que olhar |
|----------|-------------|
| (0) `information_schema.schemata` | Schemas com nome `hub%` |
| (1) `information_schema.tables` | Tabelas/views com schema ou nome `hub_%` |
| (2) `pg_tables` | Mesmo recorte via catálogo físico |

### Resultado — consulta (0) schemas `hub%`

| schema_name | schema_owner |
|-------------|--------------|
| *(colar aqui)* | |

### Resultado — consulta (1) tabelas / views

| table_schema | table_name | table_type |
|--------------|------------|------------|
| | | |

### Resultado — consulta (2) `pg_tables`

| schemaname | tablename | hasindexes | hasrules | hastriggers |
|------------|-----------|------------|----------|-------------|
| | | | | |

## 3. Checklist antes de aplicar migrations

- [ ] Não há schema **`hub_flexibase`** com tabelas que conflitem com as definidas em `20260327170000_hub_flexibase_core.sql`, **ou** aceito que `CREATE SCHEMA IF NOT EXISTS` / `CREATE TABLE IF NOT EXISTS` apenas complemente o que já existe (revisar diff manualmente).
- [ ] Schemas antigos (`hub`, `hub_legacy`, etc.) estão **inventariados** acima; renomear ou isolar migrations se necessário.
- [ ] Ambiente é **dev/homolog** (não produção sem backup e plano de rollback).
- [ ] Ordem das migrations: `20260327170000_hub_flexibase_core.sql` → `20260327171000_hub_flexibase_policies.sql` → opcionalmente `seed.sql`.

## 4. Se houver colisão

1. Renomear o schema novo no código (`NEXT_PUBLIC_HUB_SUPABASE_SCHEMA`, migrations e `HUB_SCHEMA_DEFAULT`) para algo como `hub_flexibase_v2`, **ou**
2. Migrar dados do schema legado e descontinuar o antigo, **antes** de fixar o novo como produção.

## 5. MCP Codex

Arquivo `.codex/config.toml` aponta o MCP para a API local em `http://192.168.1.220:54321/mcp`. Se o host mudar, ajuste a URL. Para **Supabase Cloud**, use o bloco comentado no mesmo arquivo com `project_ref` do dashboard.

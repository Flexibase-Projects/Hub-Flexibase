export const HUB_SCHEMA_DEFAULT = "hub_flexibase";
export const DOCUMENT_BUCKET = "hub-documents";
export const ASSET_BUCKET = "hub-assets";

function firstNonEmpty(...values: (string | undefined)[]): string {
  for (const v of values) {
    const t = v?.trim();
    if (t) return t;
  }
  return "";
}

/**
 * Suporta nomes do Next (`NEXT_PUBLIC_*`), legado (`SUPABASE_*`, `*_ANON_KEY`)
 * e projetos Vite (`VITE_*`) como fallback.
 */
export function getSupabaseEnv() {
  const url = firstNonEmpty(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_URL,
    process.env.VITE_SUPABASE_URL
  );
  const publishableKey = firstNonEmpty(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.SUPABASE_ANON_KEY,
    process.env.VITE_SUPABASE_ANON_KEY
  );
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";

  return {
    url,
    publishableKey,
    serviceRoleKey,
    schema:
      process.env.NEXT_PUBLIC_HUB_SUPABASE_SCHEMA?.trim() ||
      HUB_SCHEMA_DEFAULT,
    supportEmail:
      process.env.FLEXIBASE_SUPPORT_EMAIL?.trim() ||
      "suporte@flexibase.com.br",
    isConfigured: Boolean(url && publishableKey),
    hasServiceRole: Boolean(url && serviceRoleKey),
  };
}

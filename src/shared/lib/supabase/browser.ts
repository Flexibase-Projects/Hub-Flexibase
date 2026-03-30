"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnv } from "@/shared/lib/supabase/env";

export function createBrowserSupabaseClient() {
  const env = getSupabaseEnv();

  if (!env.isConfigured) {
    throw new Error(
      "Supabase não está configurado. Preencha as variáveis de ambiente."
    );
  }

  return createBrowserClient(env.url, env.publishableKey);
}

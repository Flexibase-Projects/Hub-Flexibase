import { createClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "@/shared/lib/supabase/env";

export function createAdminSupabaseClient() {
  const env = getSupabaseEnv();

  if (!env.hasServiceRole) {
    return null;
  }

  return createClient(env.url, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

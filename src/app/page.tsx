import { redirect } from "next/navigation";

import { getViewerContext } from "@/modules/auth/server";
import { getSupabaseEnv } from "@/shared/lib/supabase/env";

export default async function HomePage() {
  const env = getSupabaseEnv();

  if (!env.isConfigured) {
    redirect("/login");
  }

  const viewer = await getViewerContext();

  if (viewer) {
    redirect("/hub");
  }

  redirect("/login");
}

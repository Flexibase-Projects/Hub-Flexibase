import { redirect } from "next/navigation";

import { ProtectedShell } from "@/modules/layout/components/protected-shell";
import { getSupabaseEnv } from "@/shared/lib/supabase/env";
import { SetupState } from "@/shared/ui/components/setup-state";

export default async function HomePage() {
  const env = getSupabaseEnv();

  if (!env.isConfigured) {
    return (
      <ProtectedShell>
        <SetupState />
      </ProtectedShell>
    );
  }

  redirect("/hub");
}

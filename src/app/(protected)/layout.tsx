import { Stack } from "@mui/material";

import { requireViewer } from "@/modules/auth/server";
import { ProtectedShell } from "@/modules/layout/components/protected-shell";
import { getSupabaseEnv } from "@/shared/lib/supabase/env";
import { SetupState } from "@/shared/ui/components/setup-state";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const env = getSupabaseEnv();

  if (!env.isConfigured) {
    return (
      <Stack sx={{ minHeight: "100vh", justifyContent: "center", p: 4 }}>
        <SetupState />
      </Stack>
    );
  }

  const viewer = await requireViewer();

  return <ProtectedShell viewer={viewer}>{children}</ProtectedShell>;
}

import { Button, Stack, Typography } from "@mui/material";
import { redirect } from "next/navigation";

import { getViewerContext } from "@/modules/auth/server";
import { ProtectedShell } from "@/modules/layout/components/protected-shell";
import { getSupabaseEnv } from "@/shared/lib/supabase/env";
import { SetupState } from "@/shared/ui/components/setup-state";

export default async function HomePage() {
  const env = getSupabaseEnv();
  const viewer = await getViewerContext();

  if (!env.isConfigured) {
    return (
      <ProtectedShell>
        <SetupState />
      </ProtectedShell>
    );
  }

  if (viewer) {
    redirect("/hub");
  }

  return (
    <ProtectedShell>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h3">Hub pronto para começar</Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 720 }}>
            O sistema agora pode abrir sem exigir login de imediato. Quando o usuario quiser entrar
            na conta dele, basta usar o botao de usuario no canto superior direito.
          </Typography>
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button href="/login" variant="contained">
            Fazer login
          </Button>
        </Stack>
      </Stack>
    </ProtectedShell>
  );
}

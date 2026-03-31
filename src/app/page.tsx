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
          <Typography variant="h3">Hub pronto para comecar</Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 720 }}>
            O usuario pode seguir para o hub sem login e so autenticar quando algum app realmente
            exigir. Quando quiser acessar a conta, o atalho de conectar fica no canto superior
            direito.
          </Typography>
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button href="/hub" variant="contained">
            Entrar sem login
          </Button>
          <Button href="/login" variant="outlined">
            Conectar
          </Button>
        </Stack>
      </Stack>
    </ProtectedShell>
  );
}

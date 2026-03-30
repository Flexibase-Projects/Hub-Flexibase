import { Alert, AlertTitle, Card, CardContent, Link, Stack, Typography } from "@mui/material";

import { getSupabaseEnv } from "@/shared/lib/supabase/env";

export function SetupState() {
  const env = getSupabaseEnv();

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Alert severity="warning">
            <AlertTitle>Configuração pendente</AlertTitle>
            O projeto já está estruturado, mas o Supabase ainda não foi conectado.
          </Alert>
          <Typography variant="h5">Próximos passos recomendados</Typography>
          <Typography color="text.secondary">
            1. Preencher <code>.env.local</code> com URL, publishable key e service role key.
          </Typography>
          <Typography color="text.secondary">
            2. Ajustar <code>.codex/config.toml</code> com o <code>project_ref</code> do Supabase e habilitar o MCP.
          </Typography>
          <Typography color="text.secondary">
            3. Inventariar os schemas HUB antigos antes de aplicar as migrations do schema{" "}
            <code>{env.schema}</code>.
          </Typography>
          <Typography color="text.secondary">
            Suporte padrão configurado:{" "}
            <Link href={`mailto:${env.supportEmail}`}>{env.supportEmail}</Link>
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

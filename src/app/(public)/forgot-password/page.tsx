import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import { Card, CardContent, Container, Link as MuiLink, Stack, Typography } from "@mui/material";

import { getSupabaseEnv } from "@/shared/lib/supabase/env";

export default function ForgotPasswordPage() {
  const env = getSupabaseEnv();

  return (
    <Container maxWidth="sm" sx={{ py: 12 }}>
      <Card sx={{ borderRadius: 6 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <SupportAgentRoundedIcon color="primary" />
              <Typography variant="h3">Recuperação via suporte</Typography>
            </Stack>
            <Typography color="text.secondary">
              Nesta primeira versão, o reset de senha não é autoatendido. Para restaurar seu
              acesso, abra um chamado com o time responsável.
            </Typography>
            <Typography>
              Email padrão de suporte:{" "}
              <MuiLink href={`mailto:${env.supportEmail}`}>{env.supportEmail}</MuiLink>
            </Typography>
            <MuiLink href="/login">
              Voltar para o login
            </MuiLink>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}

import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Link as MuiLink,
  Stack,
  Typography,
} from "@mui/material";
import { redirect } from "next/navigation";

import { LoginForm } from "@/modules/auth/components/login-form";
import { getViewerContext } from "@/modules/auth/server";
import { getPageFeedback } from "@/shared/lib/feedback";
import { getSupabaseEnv } from "@/shared/lib/supabase/env";
import { PageFeedbackAlert } from "@/shared/ui/components/page-feedback";
import { SetupState } from "@/shared/ui/components/setup-state";

interface LoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const env = getSupabaseEnv();
  const viewer = await getViewerContext();

  if (viewer) {
    redirect("/hub");
  }

  const feedback = await getPageFeedback(searchParams);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        background:
          "radial-gradient(circle at top left, rgba(245,158,11,0.12), transparent 20%), radial-gradient(circle at right, rgba(15,76,129,0.16), transparent 28%), linear-gradient(180deg, #f5f8fc 0%, #eef3f8 100%)",
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={2.5}>
              <Typography variant="overline" color="primary.main">
                Flexibase | HUB interno
              </Typography>
              <Typography variant="h1" sx={{ fontSize: { xs: 42, md: 60 } }}>
                Um ponto de entrada elegante para a rotina da empresa.
              </Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 560 }}>
                Organize o acesso a sistemas, documentos e comunicados sem sobrecarregar a
                operação. O MVP já nasce preparado para crescer com módulos futuros.
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {["Desktop-first", "MUI design system", "Supabase Auth + RLS"].map((item) => (
                  <Card key={item} sx={{ borderRadius: 999 }}>
                    <CardContent sx={{ py: 1.25, px: 2 }}>
                      <Typography variant="body2">{item}</Typography>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 8 }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Stack spacing={2.5}>
                  <PageFeedbackAlert feedback={feedback} />
                  {env.isConfigured ? <LoginForm /> : <SetupState />}
                  <Typography color="text.secondary">
                    Esqueceu a senha?{" "}
                    <MuiLink href="/forgot-password">
                      Fale com o suporte
                    </MuiLink>
                    .
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

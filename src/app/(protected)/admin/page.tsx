import {
  Alert,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import { requireAdminViewer } from "@/modules/auth/server";
import { getAdminDashboardData } from "@/modules/admin/queries";

export default async function AdminPage() {
  await requireAdminViewer();
  const data = await getAdminDashboardData();

  const cards = [
    {
      title: "Sistemas",
      value: data.systems.length,
      description: "Links internos simples em ordem alfabetica.",
      href: "/admin/systems",
      cta: "Gerenciar sistemas",
    },
    {
      title: "Banner",
      value: data.banners.length,
      description: "Imagem principal exibida no topo da home.",
      href: "/admin/banners",
      cta: "Gerenciar banner",
    },
    {
      title: "Comunicados",
      value: data.notices.length,
      description: "Avisos e notificacoes para a home do hub.",
      href: "/admin/notices",
      cta: "Gerenciar comunicados",
    },
    {
      title: "Documentos",
      value: data.documents.length,
      description: "Arquivos internos com titulo, categoria e descricao.",
      href: "/admin/documents",
      cta: "Gerenciar documentos",
    },
    {
      title: "Usuarios",
      value: data.adminUsers.length,
      description: "Usuarios do Supabase Auth com toggle de admin.",
      href: "/admin/users",
      cta: "Gerenciar usuarios",
    },
    {
      title: "Dashboard de uso",
      value: `${data.systems.length} sistemas`,
      description: "Acesso ao painel analitico com uso, performance e atrito do HUB.",
      href: "/admin/dashboard",
      cta: "Abrir dashboard",
    },
  ];

  return (
    <Stack spacing={4}>
      <Stack spacing={1}>
        <Typography variant="h3">Painel administrativo</Typography>
        <Typography color="text.secondary">
          Cadastros centrais do HUB com operacao simples e direta.
        </Typography>
      </Stack>

      {data.loadError ? <Alert severity="warning">{data.loadError}</Alert> : null}

      <Grid container spacing={2}>
        {cards.map((card) => (
          <Grid key={card.title} size={{ xs: 12, sm: 6, xl: 4 }}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="overline" color="primary.main">
                    {card.title}
                  </Typography>
                  <Typography variant="h3">{card.value}</Typography>
                  <Typography color="text.secondary">{card.description}</Typography>
                  <Button href={card.href} variant="contained">
                    {card.cta}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

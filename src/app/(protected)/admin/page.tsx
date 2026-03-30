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
      description: "Cards e links internos por departamento.",
      href: "/admin/systems",
    },
    {
      title: "Banners",
      value: data.banners.length,
      description: "Destaques visuais e comunicados institucionais.",
      href: "/admin/banners",
    },
    {
      title: "Comunicados",
      value: data.notices.length,
      description: "Avisos prioritários com confirmação de leitura.",
      href: "/admin/notices",
    },
    {
      title: "Documentos",
      value: data.documents.length,
      description: "Arquivos internos com acesso aberto ou restrito.",
      href: "/admin/documents",
    },
    {
      title: "Usuários",
      value: data.profiles.length,
      description: "Perfis, papéis do hub e departamentos vinculados.",
      href: "/admin/users",
    },
  ];

  return (
    <Stack spacing={4}>
      <Stack spacing={1}>
        <Typography variant="h3">Painel administrativo</Typography>
        <Typography color="text.secondary">
          Um admin único para operar o hub sem inflar a arquitetura com outro sistema paralelo.
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
                    Gerenciar {card.title.toLowerCase()}
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

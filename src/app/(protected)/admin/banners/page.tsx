import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import { requireAdminViewer } from "@/modules/auth/server";
import { getAdminDashboardData } from "@/modules/admin/queries";
import { getPageFeedback } from "@/shared/lib/feedback";
import {
  BANNER_MAX_ITEMS,
  BANNER_MAX_FILE_SIZE_MB,
  BANNER_RECOMMENDED_HEIGHT,
  BANNER_RECOMMENDED_WIDTH,
} from "@/shared/lib/hub/constants";
import { PageFeedbackAlert } from "@/shared/ui/components/page-feedback";

interface BannersAdminPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BannersAdminPage({
  searchParams,
}: BannersAdminPageProps) {
  await requireAdminViewer();
  const data = await getAdminDashboardData();
  const feedback = await getPageFeedback(searchParams);
  const activeBanners = data.banners.filter((banner) => banner.isActive);
  const canCreateBanner = activeBanners.length < BANNER_MAX_ITEMS;

  return (
    <Stack spacing={4}>
      <Stack spacing={1}>
        <Typography variant="h3">Carrossel de banners</Typography>
        <Typography color="text.secondary">
          Gerencie ate {BANNER_MAX_ITEMS} imagens para o carrossel principal do hub.
        </Typography>
      </Stack>

      <PageFeedbackAlert feedback={feedback} />
      {data.loadError ? <Alert severity="warning">{data.loadError}</Alert> : null}

      <Card>
        <CardContent>
          <Stack spacing={3}>
            <Stack spacing={1}>
              <Typography variant="h4">Novo banner</Typography>
              <Typography color="text.secondary">
                Tamanho recomendado: {BANNER_RECOMMENDED_WIDTH} x {BANNER_RECOMMENDED_HEIGHT} px.
              </Typography>
              <Typography color="text.secondary">
                Limite do arquivo: {BANNER_MAX_FILE_SIZE_MB} MB.
              </Typography>
              <Typography color="text.secondary">
                Em uso: {activeBanners.length} de {BANNER_MAX_ITEMS} imagens.
              </Typography>
            </Stack>

            {!canCreateBanner ? (
              <Alert severity="info">
                O limite de {BANNER_MAX_ITEMS} banners ativos foi atingido. Remova um item para adicionar outro.
              </Alert>
            ) : null}

            {activeBanners.length === 0 ? (
              <Alert severity="info">
                Nenhum banner ativo no momento. Envie uma imagem para iniciar o carrossel.
              </Alert>
            ) : null}

            {canCreateBanner ? (
              <form action="/api/admin/banners" method="post" encType="multipart/form-data">
                <input type="hidden" name="pathname" value="/admin/banners" />
                <input type="hidden" name="intent" value="save" />
                <Stack spacing={2}>
                  <Stack spacing={1}>
                    <Typography fontWeight={700}>Adicionar imagem</Typography>
                    <input type="file" name="file" accept="image/*" required />
                    <Typography variant="body2" color="text.secondary">
                      O arquivo e validado no servidor e imagens acima de {BANNER_MAX_FILE_SIZE_MB} MB sao recusadas.
                    </Typography>
                  </Stack>
                  <Button type="submit" variant="contained">
                    Adicionar ao carrossel
                  </Button>
                </Stack>
              </form>
            ) : null}

            {activeBanners.length > 0 ? (
              <Grid container spacing={2}>
                {activeBanners.map((banner, index) => (
                  <Grid key={banner.id} size={{ xs: 12, lg: 6 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Stack spacing={2}>
                          <Stack spacing={0.5}>
                            <Typography variant="h5">Imagem {index + 1}</Typography>
                            <Typography color="text.secondary">
                              Banner ativo no carrossel principal.
                            </Typography>
                          </Stack>

                          {banner.imageUrl ? (
                            <Box
                              component="img"
                              src={banner.imageUrl}
                              alt={`Banner ${index + 1}`}
                              sx={{
                                width: "100%",
                                borderRadius: 2,
                                border: "1px solid",
                                borderColor: "divider",
                                objectFit: "cover",
                              }}
                            />
                          ) : null}

                          <form action="/api/admin/banners" method="post" encType="multipart/form-data">
                            <input type="hidden" name="pathname" value="/admin/banners" />
                            <input type="hidden" name="intent" value="save" />
                            <input type="hidden" name="id" value={banner.id} />
                            <Stack spacing={2}>
                              <Stack spacing={1}>
                                <Typography fontWeight={700}>Substituir imagem</Typography>
                                <input type="file" name="file" accept="image/*" required />
                              </Stack>
                              <Button type="submit" variant="contained">
                                Atualizar imagem
                              </Button>
                            </Stack>
                          </form>

                          <form action="/api/admin/banners" method="post">
                            <input type="hidden" name="pathname" value="/admin/banners" />
                            <input type="hidden" name="intent" value="remove" />
                            <input type="hidden" name="id" value={banner.id} />
                            <Button type="submit" color="warning">
                              Remover do carrossel
                            </Button>
                          </form>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : null}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

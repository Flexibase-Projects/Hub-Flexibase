import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";

import { requireAdminViewer } from "@/modules/auth/server";
import {
  archiveBannerAction,
} from "@/modules/admin/actions";
import { getAdminDashboardData } from "@/modules/admin/queries";
import { getPageFeedback } from "@/shared/lib/feedback";
import {
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
  const currentBanner = data.banners.find((banner) => banner.isActive) ?? data.banners[0] ?? null;

  return (
    <Stack spacing={4}>
      <Stack spacing={1}>
        <Typography variant="h3">Banner</Typography>
        <Typography color="text.secondary">
          Fluxo simples para manter apenas o banner atual do hub.
        </Typography>
      </Stack>

      <PageFeedbackAlert feedback={feedback} />
      {data.loadError ? <Alert severity="warning">{data.loadError}</Alert> : null}

      <Card>
        <CardContent>
          <Stack spacing={3}>
            <Stack spacing={1}>
              <Typography variant="h4">Banner atual</Typography>
              <Typography color="text.secondary">
                Tamanho recomendado: {BANNER_RECOMMENDED_WIDTH} x {BANNER_RECOMMENDED_HEIGHT} px.
              </Typography>
            </Stack>

            {currentBanner?.imageUrl ? (
              <Box
                component="img"
                src={currentBanner.imageUrl}
                alt="Banner atual"
                sx={{
                  width: "100%",
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  objectFit: "cover",
                }}
              />
            ) : (
              <Alert severity="info">
                Nenhum banner ativo no momento. Envie uma imagem para publicar.
              </Alert>
            )}

            <form action="/api/admin/banners" method="post" encType="multipart/form-data">
              <input type="hidden" name="pathname" value="/admin/banners" />
              {currentBanner ? <input type="hidden" name="id" value={currentBanner.id} /> : null}
              <Stack spacing={2}>
                <Stack spacing={1}>
                  <Typography fontWeight={700}>Alterar imagem</Typography>
                  <input type="file" name="file" accept="image/*" />
                </Stack>
                <Button type="submit" variant="contained">
                  {currentBanner ? "Alterar banner" : "Publicar banner"}
                </Button>
              </Stack>
            </form>

            {currentBanner ? (
              <form action={archiveBannerAction}>
                <input type="hidden" name="pathname" value="/admin/banners" />
                <input type="hidden" name="id" value={currentBanner.id} />
                <Button type="submit" color="warning">
                  Remover banner atual
                </Button>
              </form>
            ) : null}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

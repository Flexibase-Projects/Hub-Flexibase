import {
  Alert,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { requireAdminViewer } from "@/modules/auth/server";
import {
  archiveBannerAction,
  restoreBannerAction,
  upsertBannerAction,
} from "@/modules/admin/actions";
import { getAdminDashboardData } from "@/modules/admin/queries";
import { getPageFeedback } from "@/shared/lib/feedback";
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

  return (
    <Stack spacing={4}>
      <Stack spacing={1}>
        <Typography variant="h3">Banners e destaques</Typography>
        <Typography color="text.secondary">
          Área para os banners institucionais exibidos na home do hub.
        </Typography>
      </Stack>

      <PageFeedbackAlert feedback={feedback} />
      {data.loadError ? <Alert severity="warning">{data.loadError}</Alert> : null}

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h4">Novo banner</Typography>
            <form action={upsertBannerAction}>
              <input type="hidden" name="pathname" value="/admin/banners" />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth label="Título" name="title" required />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField fullWidth label="Tom" name="tone" select defaultValue="info">
                    <MenuItem value="info">Informativo</MenuItem>
                    <MenuItem value="success">Destaque</MenuItem>
                    <MenuItem value="warning">Atenção</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField fullWidth label="Ordem" name="sortOrder" type="number" defaultValue="0" />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth label="Subtítulo" name="subtitle" />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth label="Corpo" name="body" multiline minRows={3} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth label="Imagem (opcional)" name="imageUrl" />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Button type="submit" variant="contained">
                    Salvar banner
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {data.banners.map((banner) => (
          <Grid key={banner.id} size={{ xs: 12, xl: 6 }}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <form action={upsertBannerAction}>
                    <input type="hidden" name="pathname" value="/admin/banners" />
                    <input type="hidden" name="id" value={banner.id} />
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField fullWidth label="Título" name="title" defaultValue={banner.title} required />
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <TextField fullWidth label="Tom" name="tone" select defaultValue={banner.tone}>
                          <MenuItem value="info">Informativo</MenuItem>
                          <MenuItem value="success">Destaque</MenuItem>
                          <MenuItem value="warning">Atenção</MenuItem>
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <TextField fullWidth label="Ordem" name="sortOrder" type="number" defaultValue={String(banner.sortOrder)} />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField fullWidth label="Subtítulo" name="subtitle" defaultValue={banner.subtitle ?? ""} />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField fullWidth label="Corpo" name="body" defaultValue={banner.body ?? ""} multiline minRows={3} />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField fullWidth label="Imagem" name="imageUrl" defaultValue={banner.imageUrl ?? ""} />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Button type="submit" variant="contained">
                          Salvar alterações
                        </Button>
                      </Grid>
                    </Grid>
                  </form>
                  <Divider />
                  <form action={banner.isActive ? archiveBannerAction : restoreBannerAction}>
                    <input type="hidden" name="pathname" value="/admin/banners" />
                    <input type="hidden" name="id" value={banner.id} />
                    <Button type="submit" color={banner.isActive ? "warning" : "success"}>
                      {banner.isActive ? "Arquivar" : "Reativar"}
                    </Button>
                  </form>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

import { Alert, Button, Card, CardContent, Grid, MenuItem, Stack, TextField, Typography } from "@mui/material";

import { requireAdminViewer } from "@/modules/auth/server";
import { archiveNoticeAction, restoreNoticeAction, upsertNoticeAction } from "@/modules/admin/actions";
import { getAdminDashboardData } from "@/modules/admin/queries";
import { getPageFeedback } from "@/shared/lib/feedback";
import { formatDate } from "@/shared/lib/hub/utils";
import { PageFeedbackAlert } from "@/shared/ui/components/page-feedback";

interface NoticesAdminPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function NoticesAdminPage({ searchParams }: NoticesAdminPageProps) {
  await requireAdminViewer();
  const data = await getAdminDashboardData();
  const feedback = await getPageFeedback(searchParams);

  return (
    <Stack spacing={4}>
      <Stack spacing={1}>
        <Typography variant="h3">Comunicados</Typography>
        <Typography color="text.secondary">
          Notificacoes para o topo do hub com niveis de prioridade e ativacao rapida.
        </Typography>
      </Stack>

      <PageFeedbackAlert feedback={feedback} />
      {data.loadError ? <Alert severity="warning">{data.loadError}</Alert> : null}

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h4">Nova notificacao</Typography>
            <form action={upsertNoticeAction}>
              <input type="hidden" name="pathname" value="/admin/notices" />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth label="Titulo" name="title" required />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField fullWidth label="Prioridade" name="severity" select defaultValue="important">
                    <MenuItem value="critical">Critica</MenuItem>
                    <MenuItem value="important">Importante</MenuItem>
                    <MenuItem value="info">Informativa</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField fullWidth label="Ordem" name="sortOrder" type="number" defaultValue="0" />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth label="Mensagem" name="body" required multiline minRows={4} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Button type="submit" variant="contained">
                    Salvar notificacao
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {data.notices.map((notice) => (
          <Grid key={notice.id} size={{ xs: 12, xl: 6 }}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Typography color="text.secondary">{formatDate(notice.createdAt)}</Typography>
                  <form action={upsertNoticeAction}>
                    <input type="hidden" name="pathname" value="/admin/notices" />
                    <input type="hidden" name="id" value={notice.id} />
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField fullWidth label="Titulo" name="title" defaultValue={notice.title} required />
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <TextField fullWidth label="Prioridade" name="severity" select defaultValue={notice.severity}>
                          <MenuItem value="critical">Critica</MenuItem>
                          <MenuItem value="important">Importante</MenuItem>
                          <MenuItem value="info">Informativa</MenuItem>
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <TextField fullWidth label="Ordem" name="sortOrder" type="number" defaultValue={String(notice.sortOrder)} />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField fullWidth label="Mensagem" name="body" defaultValue={notice.body} multiline minRows={4} required />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Button type="submit" variant="contained">
                          Salvar alteracoes
                        </Button>
                      </Grid>
                    </Grid>
                  </form>

                  <form action={notice.isActive ? archiveNoticeAction : restoreNoticeAction}>
                    <input type="hidden" name="pathname" value="/admin/notices" />
                    <input type="hidden" name="id" value={notice.id} />
                    <Button type="submit" color={notice.isActive ? "warning" : "success"}>
                      {notice.isActive ? "Arquivar" : "Reativar"}
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

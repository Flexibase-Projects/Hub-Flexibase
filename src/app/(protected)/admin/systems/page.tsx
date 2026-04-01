import {
  Alert,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { requireAdminViewer } from "@/modules/auth/server";
import {
  archiveSystemAction,
  restoreSystemAction,
  upsertSystemAction,
} from "@/modules/admin/actions";
import { getAdminDashboardData } from "@/modules/admin/queries";
import { getPageFeedback } from "@/shared/lib/feedback";
import { PageFeedbackAlert } from "@/shared/ui/components/page-feedback";

interface SystemsAdminPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SystemsAdminPage({
  searchParams,
}: SystemsAdminPageProps) {
  await requireAdminViewer();
  const data = await getAdminDashboardData();
  const feedback = await getPageFeedback(searchParams);
  const systems = [...data.systems].sort((left, right) =>
    left.title.localeCompare(right.title, "pt-BR")
  );

  return (
    <Stack spacing={4}>
      <Stack spacing={1}>
        <Typography variant="h3">Sistemas internos</Typography>
        <Typography color="text.secondary">
          Cadastro simples com nome, URL e descricao. Os itens aparecem em ordem alfabetica.
        </Typography>
      </Stack>

      <PageFeedbackAlert feedback={feedback} />
      {data.loadError ? <Alert severity="warning">{data.loadError}</Alert> : null}

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h4">Novo sistema</Typography>
            <form action={upsertSystemAction}>
              <input type="hidden" name="pathname" value="/admin/systems" />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 5 }}>
                  <TextField fullWidth label="Nome" name="title" required />
                </Grid>
                <Grid size={{ xs: 12, md: 7 }}>
                  <TextField fullWidth label="URL" name="targetUrl" required />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth label="Descricao" name="description" required multiline minRows={3} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Button type="submit" variant="contained">
                    Salvar sistema
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Stack>
        </CardContent>
      </Card>

      <Stack spacing={2}>
        <Typography variant="h4">Itens cadastrados</Typography>
        <Grid container spacing={2}>
          {systems.map((system) => (
            <Grid key={system.id} size={{ xs: 12, xl: 6 }}>
              <Card>
                <CardContent>
                  <Stack spacing={2}>
                    <Stack spacing={0.5}>
                      <Typography variant="h5">{system.title}</Typography>
                      <Typography color="text.secondary">{system.targetUrl}</Typography>
                    </Stack>

                    <form action={upsertSystemAction}>
                      <input type="hidden" name="pathname" value="/admin/systems" />
                      <input type="hidden" name="id" value={system.id} />
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 5 }}>
                          <TextField fullWidth label="Nome" name="title" defaultValue={system.title} required />
                        </Grid>
                        <Grid size={{ xs: 12, md: 7 }}>
                          <TextField fullWidth label="URL" name="targetUrl" defaultValue={system.targetUrl} required />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <TextField fullWidth label="Descricao" name="description" defaultValue={system.description} required multiline minRows={3} />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Button type="submit" variant="contained">
                            Salvar alteracoes
                          </Button>
                        </Grid>
                      </Grid>
                    </form>

                    <Divider />

                    <form action={system.isActive ? archiveSystemAction : restoreSystemAction}>
                      <input type="hidden" name="pathname" value="/admin/systems" />
                      <input type="hidden" name="id" value={system.id} />
                      <Button type="submit" color={system.isActive ? "warning" : "success"}>
                        {system.isActive ? "Arquivar" : "Reativar"}
                      </Button>
                    </form>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Stack>
    </Stack>
  );
}

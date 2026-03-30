import {
  Alert,
  Button,
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControlLabel,
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

  const departmentMap = new Map(data.departments.map((department) => [department.id, department]));

  return (
    <Stack spacing={4}>
      <Stack spacing={1}>
        <Typography variant="h3">Sistemas internos</Typography>
        <Typography color="text.secondary">
          Cadastre os cards que aparecem no hub principal e organize por departamento.
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
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth label="Nome" name="title" required />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth label="URL" name="targetUrl" required />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth label="Descrição" name="description" required multiline minRows={2} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField fullWidth label="Imagem (opcional)" name="imageUrl" />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField fullWidth label="Cor de destaque" name="accentColor" defaultValue="#0F4C81" />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField fullWidth label="Ordem" name="sortOrder" type="number" defaultValue="0" />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Stack spacing={1}>
                    <Typography fontWeight={700}>Departamentos</Typography>
                    <Grid container spacing={1}>
                      {data.departments
                        .filter((department) => department.isActive)
                        .map((department) => (
                          <Grid key={department.id} size={{ xs: 12, md: 4 }}>
                            <FormControlLabel
                              control={<Checkbox name="departmentIds" value={department.id} />}
                              label={department.name}
                            />
                          </Grid>
                        ))}
                    </Grid>
                  </Stack>
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
          {data.systems.map((system) => {
            const selectedDepartmentIds = data.systemDepartmentMap
              .filter((entry) => entry.systemLinkId === system.id && !entry.deletedAt)
              .map((entry) => entry.departmentId);

            return (
              <Grid key={system.id} size={{ xs: 12, xl: 6 }}>
                <Card>
                  <CardContent>
                    <Stack spacing={2}>
                      <form action={upsertSystemAction}>
                        <input type="hidden" name="pathname" value="/admin/systems" />
                        <input type="hidden" name="id" value={system.id} />
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <TextField fullWidth label="Nome" name="title" defaultValue={system.title} required />
                          </Grid>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <TextField fullWidth label="URL" name="targetUrl" defaultValue={system.targetUrl} required />
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <TextField
                              fullWidth
                              label="Descrição"
                              name="description"
                              defaultValue={system.description}
                              required
                              multiline
                              minRows={2}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 4 }}>
                            <TextField fullWidth label="Imagem" name="imageUrl" defaultValue={system.imageUrl ?? ""} />
                          </Grid>
                          <Grid size={{ xs: 12, md: 4 }}>
                            <TextField fullWidth label="Cor de destaque" name="accentColor" defaultValue={system.accentColor ?? "#0F4C81"} />
                          </Grid>
                          <Grid size={{ xs: 12, md: 4 }}>
                            <TextField fullWidth label="Ordem" name="sortOrder" type="number" defaultValue={String(system.sortOrder)} />
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <Stack spacing={1}>
                              <Typography fontWeight={700}>Departamentos</Typography>
                              <Grid container spacing={1}>
                                {data.departments.map((department) => (
                                  <Grid key={department.id} size={{ xs: 12, md: 4 }}>
                                    <FormControlLabel
                                      control={
                                        <Checkbox
                                          name="departmentIds"
                                          value={department.id}
                                          defaultChecked={selectedDepartmentIds.includes(department.id)}
                                        />
                                      }
                                      label={departmentMap.get(department.id)?.name ?? department.id}
                                    />
                                  </Grid>
                                ))}
                              </Grid>
                            </Stack>
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <Stack direction="row" spacing={1}>
                              <Button type="submit" variant="contained">
                                Salvar alterações
                              </Button>
                            </Stack>
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
            );
          })}
        </Grid>
      </Stack>
    </Stack>
  );
}

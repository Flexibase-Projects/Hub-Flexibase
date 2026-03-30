import {
  Alert,
  Button,
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { requireAdminViewer } from "@/modules/auth/server";
import {
  archiveDepartmentAction,
  restoreDepartmentAction,
  updateUserAccessAction,
  upsertDepartmentAction,
} from "@/modules/admin/actions";
import { getAdminDashboardData } from "@/modules/admin/queries";
import { getPageFeedback } from "@/shared/lib/feedback";
import { PageFeedbackAlert } from "@/shared/ui/components/page-feedback";

interface UsersAdminPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function UsersAdminPage({
  searchParams,
}: UsersAdminPageProps) {
  await requireAdminViewer();
  const data = await getAdminDashboardData();
  const feedback = await getPageFeedback(searchParams);

  const roleKeyByUserId = new Map(
    data.userRoles
      .filter((entry) => !entry.deletedAt)
      .map((entry) => {
        const role = data.roles.find((roleItem) => roleItem.id === entry.roleId);
        return [entry.userId, role?.key ?? "employee"];
      })
  );

  return (
    <Stack spacing={4}>
      <Stack spacing={1}>
        <Typography variant="h3">Usuários e departamentos</Typography>
        <Typography color="text.secondary">
          Gerencie os departamentos do hub e defina o papel de cada usuário já provisionado no
          Supabase compartilhado.
        </Typography>
      </Stack>

      <PageFeedbackAlert feedback={feedback} />
      {data.loadError ? <Alert severity="warning">{data.loadError}</Alert> : null}

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h4">Novo departamento</Typography>
            <form action={upsertDepartmentAction}>
              <input type="hidden" name="pathname" value="/admin/users" />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 5 }}>
                  <TextField fullWidth label="Nome" name="name" required />
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                  <TextField fullWidth label="Descrição" name="description" />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField fullWidth label="Ordem" name="sortOrder" type="number" defaultValue="0" />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Button type="submit" variant="contained">
                    Salvar departamento
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {data.departments.map((department) => (
          <Grid key={department.id} size={{ xs: 12, xl: 6 }}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <form action={upsertDepartmentAction}>
                    <input type="hidden" name="pathname" value="/admin/users" />
                    <input type="hidden" name="id" value={department.id} />
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 5 }}>
                        <TextField fullWidth label="Nome" name="name" defaultValue={department.name} required />
                      </Grid>
                      <Grid size={{ xs: 12, md: 5 }}>
                        <TextField fullWidth label="Descrição" name="description" defaultValue={department.description ?? ""} />
                      </Grid>
                      <Grid size={{ xs: 12, md: 2 }}>
                        <TextField fullWidth label="Ordem" name="sortOrder" type="number" defaultValue={String(department.sortOrder)} />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Button type="submit" variant="contained">
                          Salvar alterações
                        </Button>
                      </Grid>
                    </Grid>
                  </form>
                  <Divider />
                  <form action={department.isActive ? archiveDepartmentAction : restoreDepartmentAction}>
                    <input type="hidden" name="pathname" value="/admin/users" />
                    <input type="hidden" name="id" value={department.id} />
                    <Button type="submit" color={department.isActive ? "warning" : "success"}>
                      {department.isActive ? "Arquivar" : "Reativar"}
                    </Button>
                  </form>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Stack spacing={2}>
        <Typography variant="h4">Perfis do hub</Typography>
        {data.profiles.length === 0 ? (
          <Alert severity="info">
            Os perfis aparecem aqui depois que os usuários autenticam no hub pela primeira vez.
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {data.profiles.map((profile) => {
              const selectedDepartmentIds = data.userDepartments
                .filter((entry) => entry.userId === profile.id && !entry.deletedAt)
                .map((entry) => entry.departmentId);

              return (
                <Grid key={profile.id} size={{ xs: 12, xl: 6 }}>
                  <Card>
                    <CardContent>
                      <Stack spacing={2}>
                        <Stack spacing={0.5}>
                          <Typography variant="h5">{profile.fullName}</Typography>
                          <Typography color="text.secondary">{profile.email}</Typography>
                        </Stack>
                        <form action={updateUserAccessAction}>
                          <input type="hidden" name="pathname" value="/admin/users" />
                          <input type="hidden" name="userId" value={profile.id} />
                          <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 6 }}>
                              <TextField
                                fullWidth
                                select
                                label="Papel"
                                name="roleKey"
                                defaultValue={roleKeyByUserId.get(profile.id) ?? "employee"}
                              >
                                <MenuItem value="operator">Operator</MenuItem>
                                <MenuItem value="employee">Employee</MenuItem>
                                <MenuItem value="manager">Manager</MenuItem>
                                <MenuItem value="admin">Admin</MenuItem>
                              </TextField>
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                              <Stack spacing={1}>
                                <Typography fontWeight={700}>Departamentos vinculados</Typography>
                                <Grid container spacing={1}>
                                  {data.departments
                                    .filter((department) => department.isActive)
                                    .map((department) => (
                                      <Grid key={department.id} size={{ xs: 12, md: 4 }}>
                                        <FormControlLabel
                                          control={
                                            <Checkbox
                                              name="departmentIds"
                                              value={department.id}
                                              defaultChecked={selectedDepartmentIds.includes(
                                                department.id
                                              )}
                                            />
                                          }
                                          label={department.name}
                                        />
                                      </Grid>
                                    ))}
                                </Grid>
                              </Stack>
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                              <Button type="submit" variant="contained">
                                Atualizar permissões
                              </Button>
                            </Grid>
                          </Grid>
                        </form>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Stack>
    </Stack>
  );
}

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
  archiveDocumentAction,
  restoreDocumentAction,
  upsertDocumentAction,
} from "@/modules/admin/actions";
import { getAdminDashboardData } from "@/modules/admin/queries";
import { getPageFeedback } from "@/shared/lib/feedback";
import { formatBytes, formatDate } from "@/shared/lib/hub/utils";
import { PageFeedbackAlert } from "@/shared/ui/components/page-feedback";

interface DocumentsAdminPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DocumentsAdminPage({
  searchParams,
}: DocumentsAdminPageProps) {
  await requireAdminViewer();
  const data = await getAdminDashboardData();
  const feedback = await getPageFeedback(searchParams);

  return (
    <Stack spacing={4}>
      <Stack spacing={1}>
        <Typography variant="h3">Documentos</Typography>
        <Typography color="text.secondary">
          Upload seguro para documentos internos com controle aberto ou restrito por área.
        </Typography>
      </Stack>

      <PageFeedbackAlert feedback={feedback} />
      {data.loadError ? <Alert severity="warning">{data.loadError}</Alert> : null}

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h4">Novo documento</Typography>
            <form action={upsertDocumentAction}>
              <input type="hidden" name="pathname" value="/admin/documents" />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth label="Título" name="title" required />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField fullWidth label="Categoria" name="category" required />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField fullWidth label="Ordem" name="sortOrder" type="number" defaultValue="0" />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth label="Descrição" name="description" multiline minRows={2} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <FormControlLabel
                    control={<Checkbox name="isRestricted" value="true" />}
                    label="Documento restrito por departamento"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Stack spacing={1}>
                    <Typography fontWeight={700}>Departamentos autorizados</Typography>
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
                  <Stack spacing={1}>
                    <Typography fontWeight={700}>Arquivo</Typography>
                    <input type="file" name="file" required />
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Button type="submit" variant="contained">
                    Salvar documento
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {data.documents.map((document) => {
          const selectedDepartmentIds = data.documentDepartmentMap
            .filter((entry) => entry.documentId === document.id && !entry.deletedAt)
            .map((entry) => entry.departmentId);

          return (
            <Grid key={document.id} size={{ xs: 12, xl: 6 }}>
              <Card>
                <CardContent>
                  <Stack spacing={2}>
                    <Stack spacing={0.5}>
                      <Typography variant="h5">{document.title}</Typography>
                      <Typography color="text.secondary">
                        {document.fileName} • {formatBytes(document.fileSize)} • {formatDate(document.createdAt)}
                      </Typography>
                    </Stack>
                    <form action={upsertDocumentAction}>
                      <input type="hidden" name="pathname" value="/admin/documents" />
                      <input type="hidden" name="id" value={document.id} />
                      <input type="hidden" name="existingStoragePath" value={document.storagePath} />
                      <input type="hidden" name="existingFileName" value={document.fileName} />
                      <input type="hidden" name="existingMimeType" value={document.mimeType ?? ""} />
                      <input type="hidden" name="existingFileSize" value={String(document.fileSize ?? "")} />
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <TextField fullWidth label="Título" name="title" defaultValue={document.title} required />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField fullWidth label="Categoria" name="category" defaultValue={document.category} required />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField fullWidth label="Ordem" name="sortOrder" type="number" defaultValue={String(document.sortOrder)} />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <TextField fullWidth label="Descrição" name="description" defaultValue={document.description ?? ""} multiline minRows={2} />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <FormControlLabel
                            control={<Checkbox name="isRestricted" value="true" defaultChecked={document.isRestricted} />}
                            label="Documento restrito por departamento"
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Stack spacing={1}>
                            <Typography fontWeight={700}>Departamentos autorizados</Typography>
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
                                    label={department.name}
                                  />
                                </Grid>
                              ))}
                            </Grid>
                          </Stack>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Stack spacing={1}>
                            <Typography fontWeight={700}>Substituir arquivo</Typography>
                            <input type="file" name="file" />
                          </Stack>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Button type="submit" variant="contained">
                            Salvar alterações
                          </Button>
                        </Grid>
                      </Grid>
                    </form>
                    <Divider />
                    <form action={document.isActive ? archiveDocumentAction : restoreDocumentAction}>
                      <input type="hidden" name="pathname" value="/admin/documents" />
                      <input type="hidden" name="id" value={document.id} />
                      <Button type="submit" color={document.isActive ? "warning" : "success"}>
                        {document.isActive ? "Arquivar" : "Reativar"}
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
  );
}

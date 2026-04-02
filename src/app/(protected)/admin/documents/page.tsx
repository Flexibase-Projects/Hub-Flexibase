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
import { getAdminDashboardData } from "@/modules/admin/queries";
import { getPageFeedback } from "@/shared/lib/feedback";
import { COMMON_DOCUMENT_TYPES_HINT, DOCUMENT_CATEGORIES } from "@/shared/lib/hub/constants";
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
          Cadastro simples com titulo, categoria e descricao. A listagem fica em ordem alfabetica.
        </Typography>
      </Stack>

      <PageFeedbackAlert feedback={feedback} />
      {data.loadError ? <Alert severity="warning">{data.loadError}</Alert> : null}

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h4">Novo documento</Typography>
            <form action="/api/admin/documents" method="post" encType="multipart/form-data">
              <input type="hidden" name="pathname" value="/admin/documents" />
              <input type="hidden" name="intent" value="save" />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 5 }}>
                  <TextField fullWidth label="Titulo" name="title" required />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField fullWidth select label="Categoria" name="category" defaultValue={DOCUMENT_CATEGORIES[0]} required>
                    {DOCUMENT_CATEGORIES.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth label="Descricao" name="description" multiline minRows={3} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Stack spacing={1}>
                    <Typography fontWeight={700}>Arquivo</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {COMMON_DOCUMENT_TYPES_HINT}
                    </Typography>
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
        {data.documents.map((document) => (
          <Grid key={document.id} size={{ xs: 12, xl: 6 }}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Stack spacing={0.5}>
                    <Typography variant="h5">{document.title}</Typography>
                    <Typography color="text.secondary">
                      {document.category} | {document.fileName} | {formatBytes(document.fileSize)} | {formatDate(document.createdAt)}
                    </Typography>
                  </Stack>

                  <form action="/api/admin/documents" method="post" encType="multipart/form-data">
                    <input type="hidden" name="pathname" value="/admin/documents" />
                    <input type="hidden" name="intent" value="save" />
                    <input type="hidden" name="id" value={document.id} />
                    <input type="hidden" name="existingStoragePath" value={document.storagePath} />
                    <input type="hidden" name="existingFileName" value={document.fileName} />
                    <input type="hidden" name="existingMimeType" value={document.mimeType ?? ""} />
                    <input type="hidden" name="existingFileSize" value={String(document.fileSize ?? "")} />
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 5 }}>
                        <TextField fullWidth label="Titulo" name="title" defaultValue={document.title} required />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField fullWidth select label="Categoria" name="category" defaultValue={document.category} required>
                          {DOCUMENT_CATEGORIES.map((category) => (
                            <MenuItem key={category} value={category}>
                              {category}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField fullWidth label="Descricao" name="description" defaultValue={document.description ?? ""} multiline minRows={3} />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Stack spacing={1}>
                          <Typography fontWeight={700}>Substituir arquivo</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {COMMON_DOCUMENT_TYPES_HINT}
                          </Typography>
                          <input type="file" name="file" />
                        </Stack>
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Button type="submit" variant="contained">
                          Salvar alteracoes
                        </Button>
                      </Grid>
                    </Grid>
                  </form>

                  <Divider />

                  <form action="/api/admin/documents" method="post">
                    <input type="hidden" name="pathname" value="/admin/documents" />
                    <input
                      type="hidden"
                      name="intent"
                      value={document.isActive ? "archive" : "restore"}
                    />
                    <input type="hidden" name="id" value={document.id} />
                    <Button type="submit" color={document.isActive ? "warning" : "success"}>
                      {document.isActive ? "Arquivar" : "Reativar"}
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

import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import { getViewerContext } from "@/modules/auth/server";
import { BannerCarousel } from "@/modules/hub/components/banner-carousel";
import { DocumentDownloadButton } from "@/modules/hub/components/document-download-button";
import { SystemLinkButton } from "@/modules/hub/components/system-link-button";
import { getHubHomeData } from "@/modules/hub/queries";
import { getPageFeedback } from "@/shared/lib/feedback";
import { filterVisibleDocuments, formatBytes, formatDate } from "@/shared/lib/hub/utils";
import { PageFeedbackAlert } from "@/shared/ui/components/page-feedback";

interface HubPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const corporatePanelSx = {
  borderRadius: 2,
  border: "1px solid",
  borderColor: "divider",
  background: "linear-gradient(180deg, rgba(15,76,129,0.03) 0%, rgba(15,76,129,0.01) 100%)",
};

export default async function HubPage({ searchParams }: HubPageProps) {
  const viewer = await getViewerContext();
  const feedback = await getPageFeedback(searchParams);
  const hubData = await getHubHomeData(viewer);
  const visibleDocuments = filterVisibleDocuments(
    hubData.documents,
    hubData.documentDepartmentMap,
    viewer?.departmentIds ?? [],
    viewer?.isAdmin ?? false
  );
  const registeredSystems = [...hubData.systems].sort((left, right) =>
    left.title.localeCompare(right.title, "pt-BR")
  );

  return (
    <Stack spacing={{ xs: 3, md: 4 }}>
      <PageFeedbackAlert feedback={feedback} />

      {hubData.loadError ? <Alert severity="warning">{hubData.loadError}</Alert> : null}

      <Stack spacing={1}>
        <Typography variant="h4">Hub principal</Typography>
        <Typography color="text.secondary">
          Comunicados, sistemas internos e documentos em uma unica navegacao.
        </Typography>
      </Stack>

      <BannerCarousel banners={hubData.banners} />

      <Stack spacing={2}>
        <Typography variant="h4">Sistemas internos</Typography>

        {registeredSystems.length > 0 ? (
          <Box
            sx={{
              ...corporatePanelSx,
              p: { xs: 2, md: 2.5 },
            }}
          >
            <Stack spacing={2}>
              <Stack spacing={0.5}>
                <Typography variant="h5">Sistemas cadastrados</Typography>
                <Typography color="text.secondary">
                  Itens administrados pelo painel aparecem aqui em ordem alfabetica.
                </Typography>
              </Stack>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    lg: "repeat(3, minmax(0, 1fr))",
                  },
                  gap: 1.5,
                }}
              >
                {registeredSystems.map((system) => (
                  <SystemLinkButton
                    key={system.id}
                    href={system.targetUrl}
                    title={system.title}
                    iconKey={system.iconKey}
                    targetKey={system.id}
                  />
                ))}
              </Box>
            </Stack>
          </Box>
        ) : (
          <Box
            sx={{
              ...corporatePanelSx,
              p: { xs: 2, md: 2.5 },
            }}
          >
            <Stack spacing={0.5}>
              <Typography variant="h5">Nenhum sistema cadastrado</Typography>
              <Typography color="text.secondary">
                Use o painel administrativo para cadastrar os sistemas internos exibidos aqui.
              </Typography>
            </Stack>
          </Box>
        )}
      </Stack>

      <Stack spacing={2}>
        <Typography variant="h4">Documentos</Typography>
        {visibleDocuments.length === 0 ? (
          <Box sx={{ ...corporatePanelSx, minHeight: 120 }} />
        ) : (
          <Grid container spacing={2}>
            {visibleDocuments.map((document) => (
              <Grid key={document.id} size={{ xs: 12, lg: 6 }}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        justifyContent="space-between"
                        spacing={1}
                      >
                        <Stack spacing={1}>
                          <Chip
                            size="small"
                            label={document.category}
                            color="success"
                            sx={{ borderRadius: 2, width: "fit-content" }}
                          />
                          <Typography variant="h5">{document.title}</Typography>
                        </Stack>
                        <Typography color="text.secondary">{formatDate(document.createdAt)}</Typography>
                      </Stack>
                      <Typography color="text.secondary">
                        {document.description || `Categoria: ${document.category}`}
                      </Typography>
                      <Divider />
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        justifyContent="space-between"
                        spacing={1.5}
                      >
                        <Stack spacing={0.5}>
                          <Typography variant="body2" color="text.secondary">
                            {document.fileName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatBytes(document.fileSize)}
                          </Typography>
                        </Stack>
                        <DocumentDownloadButton documentId={document.id} />
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Stack>
    </Stack>
  );
}

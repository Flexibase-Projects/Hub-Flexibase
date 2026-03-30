import AnnouncementRoundedIcon from "@mui/icons-material/AnnouncementRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import { requireViewer } from "@/modules/auth/server";
import { markNoticeReadAction } from "@/modules/hub/actions";
import { getHubHomeData } from "@/modules/hub/queries";
import { getPageFeedback } from "@/shared/lib/feedback";
import {
  filterVisibleDocuments,
  formatBytes,
  formatDate,
  groupSystemsByDepartment,
} from "@/shared/lib/hub/utils";
import { EmptyState } from "@/shared/ui/components/empty-state";
import { PageFeedbackAlert } from "@/shared/ui/components/page-feedback";

interface HubPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const noticeTone = {
  critical: "error",
  important: "warning",
  info: "info",
} as const;

export default async function HubPage({ searchParams }: HubPageProps) {
  const viewer = await requireViewer();
  const feedback = await getPageFeedback(searchParams);
  const hubData = await getHubHomeData(viewer);
  const groupedSystems = groupSystemsByDepartment(
    hubData.departments,
    hubData.systems,
    hubData.systemDepartmentMap
  );
  const visibleDocuments = filterVisibleDocuments(
    hubData.documents,
    hubData.documentDepartmentMap,
    viewer.departmentIds,
    viewer.isAdmin
  );
  const readNoticeIds = new Set(hubData.noticeReads.map((notice) => notice.noticeId));

  return (
    <Stack spacing={4}>
      <PageFeedbackAlert feedback={feedback} />

      {hubData.loadError ? <Alert severity="warning">{hubData.loadError}</Alert> : null}

      <Stack spacing={1}>
        <Typography variant="h3">Hub principal</Typography>
        <Typography color="text.secondary">
          Comunicados importantes, sistemas por departamento e documentos internos em uma única
          navegação.
        </Typography>
      </Stack>

      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <AnnouncementRoundedIcon color="warning" />
          <Typography variant="h4">Comunicados prioritários</Typography>
        </Stack>

        {hubData.notices.length === 0 ? (
          <EmptyState
            title="Nenhum comunicado ativo"
            description="Quando houver um aviso importante, ele aparecerá aqui no topo do HUB."
          />
        ) : (
          <Grid container spacing={2}>
            {hubData.notices.map((notice) => (
              <Grid key={notice.id} size={{ xs: 12, md: 6 }}>
                <Card>
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
                            color={noticeTone[notice.severity]}
                            label={
                              notice.severity === "critical"
                                ? "Crítico"
                                : notice.severity === "important"
                                  ? "Importante"
                                  : "Informativo"
                            }
                          />
                          <Typography variant="h5">{notice.title}</Typography>
                        </Stack>
                        <Typography color="text.secondary">
                          {formatDate(notice.createdAt)}
                        </Typography>
                      </Stack>
                      <Typography color="text.secondary">{notice.body}</Typography>
                      <form action={markNoticeReadAction}>
                        <input type="hidden" name="noticeId" value={notice.id} />
                        <Button
                          type="submit"
                          variant={readNoticeIds.has(notice.id) ? "outlined" : "contained"}
                        >
                          {readNoticeIds.has(notice.id)
                            ? "Leitura confirmada"
                            : "Confirmar leitura"}
                        </Button>
                      </form>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Stack>

      <Stack spacing={2}>
        <Typography variant="h4">Banners e destaques</Typography>
        {hubData.banners.length === 0 ? (
          <EmptyState
            title="Nenhum banner publicado"
            description="Os destaques institucionais aparecerão aqui quando forem adicionados."
          />
        ) : (
          <Grid container spacing={2}>
            {hubData.banners.map((banner) => (
              <Grid key={banner.id} size={{ xs: 12, md: 6 }}>
                <Card
                  sx={{
                    minHeight: 220,
                    background: banner.imageUrl
                      ? `linear-gradient(135deg, rgba(15,76,129,0.86), rgba(18,58,94,0.92)), url(${banner.imageUrl}) center/cover`
                      : "linear-gradient(135deg, #0F4C81 0%, #123A5E 100%)",
                    color: "common.white",
                  }}
                >
                  <CardContent sx={{ height: "100%" }}>
                    <Stack spacing={1.5} justifyContent="space-between" sx={{ height: "100%" }}>
                      <Stack spacing={1}>
                        <Chip
                          label={
                            banner.tone === "success"
                              ? "Destaque"
                              : banner.tone === "warning"
                                ? "Atenção"
                                : "Comunicado"
                          }
                          color="secondary"
                          sx={{ width: "fit-content" }}
                        />
                        <Typography variant="h4">{banner.title}</Typography>
                        {banner.subtitle ? (
                          <Typography sx={{ color: "rgba(255,255,255,0.86)" }}>
                            {banner.subtitle}
                          </Typography>
                        ) : null}
                      </Stack>
                      {banner.body ? (
                        <Typography sx={{ color: "rgba(255,255,255,0.82)" }}>
                          {banner.body}
                        </Typography>
                      ) : null}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Stack>

      <Stack spacing={2}>
        <Typography variant="h4">Sistemas internos</Typography>
        {groupedSystems.length === 0 ? (
          <EmptyState
            title="Nenhum sistema publicado"
            description="Quando os links internos forem cadastrados no admin, eles aparecerão aqui."
          />
        ) : (
          <Stack spacing={3}>
            {groupedSystems.map((section) => (
              <Stack key={section.department.id} spacing={1.5}>
                <Stack spacing={0.5}>
                  <Typography variant="h5">{section.department.name}</Typography>
                  {section.department.description ? (
                    <Typography color="text.secondary">
                      {section.department.description}
                    </Typography>
                  ) : null}
                </Stack>
                <Grid container spacing={2}>
                  {section.items.map((system) => (
                    <Grid key={system.id} size={{ xs: 12, sm: 6, xl: 4 }}>
                      <Card sx={{ height: "100%" }}>
                        <CardActionArea component="a" href={system.targetUrl} sx={{ height: "100%" }}>
                          <CardContent sx={{ height: "100%" }}>
                            <Stack
                              spacing={2}
                              sx={{
                                height: "100%",
                                borderTop: `6px solid ${system.accentColor ?? "#0F4C81"}`,
                              }}
                            >
                              <Stack spacing={1.5}>
                                <Typography variant="h5">{system.title}</Typography>
                                <Typography color="text.secondary">
                                  {system.description}
                                </Typography>
                              </Stack>
                              <Box sx={{ flexGrow: 1 }} />
                              <Stack direction="row" justifyContent="space-between">
                                <Chip
                                  size="small"
                                  label="Sistema interno"
                                  color="primary"
                                  variant="outlined"
                                />
                                <LaunchRoundedIcon color="primary" />
                              </Stack>
                            </Stack>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            ))}
          </Stack>
        )}
      </Stack>

      <Stack spacing={2}>
        <Typography variant="h4">Documentos</Typography>
        {visibleDocuments.length === 0 ? (
          <EmptyState
            title="Nenhum documento disponível"
            description="Os documentos internos vão aparecer aqui conforme forem cadastrados."
          />
        ) : (
          <Grid container spacing={2}>
            {visibleDocuments.map((document) => (
              <Grid key={document.id} size={{ xs: 12, md: 6 }}>
                <Card>
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
                            label={document.isRestricted ? "Restrito por área" : "Liberado"}
                            color={document.isRestricted ? "warning" : "success"}
                          />
                          <Typography variant="h5">{document.title}</Typography>
                        </Stack>
                        <Typography color="text.secondary">
                          {formatDate(document.createdAt)}
                        </Typography>
                      </Stack>
                      <Typography color="text.secondary">
                        {document.description || `Categoria: ${document.category}`}
                      </Typography>
                      <Divider />
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        justifyContent="space-between"
                        spacing={1}
                      >
                        <Stack spacing={0.5}>
                          <Typography variant="body2" color="text.secondary">
                            {document.fileName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatBytes(document.fileSize)}
                          </Typography>
                        </Stack>
                        <Button
                          href={`/api/documents/${document.id}/download`}
                          variant="contained"
                          startIcon={<DescriptionRoundedIcon />}
                        >
                          Baixar documento
                        </Button>
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

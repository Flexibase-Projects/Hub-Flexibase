"use client";

import NorthEastRoundedIcon from "@mui/icons-material/NorthEastRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import TimerRoundedIcon from "@mui/icons-material/TimerRounded";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { PieChart } from "@mui/x-charts/PieChart";

import type { AdminUsageDashboardData } from "@/shared/types/analytics";

function formatPercent(rate: number) {
  return `${(rate * 100).toFixed(1).replace(".", ",")}%`;
}

function formatDuration(value: number | null) {
  if (value === null) {
    return "Sem dados";
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(2).replace(".", ",")} s`;
  }

  return `${Math.round(value)} ms`;
}

function renderEmptyState(message: string) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography color="text.secondary">{message}</Typography>
      </CardContent>
    </Card>
  );
}

interface AdminUsageDashboardProps {
  data: AdminUsageDashboardData;
}

export function AdminUsageDashboard({ data }: AdminUsageDashboardProps) {
  const hasUsageData =
    data.trend.some((point) => point.sessions > 0) ||
    data.systemRanking.length > 0 ||
    data.performanceRows.length > 0;

  return (
    <Stack spacing={3}>
      {data.loadError ? <Alert severity="warning">{data.loadError}</Alert> : null}

      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 4,
          px: { xs: 2.5, md: 4 },
          py: { xs: 3, md: 4 },
          color: "common.white",
          background:
            "linear-gradient(135deg, #0B3559 0%, #0F4C81 50%, #D28A16 130%)",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: "auto -10% -30% auto",
            width: 280,
            height: 280,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.22), transparent 68%)",
          }}
        />

        <Grid container spacing={3} sx={{ position: "relative", zIndex: 1 }}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Stack spacing={1.5}>
              <Chip
                label={`Janela ativa: ${data.selectedPeriodDays} dias`}
                sx={{
                  width: "fit-content",
                  bgcolor: "rgba(255,255,255,0.16)",
                  color: "common.white",
                  fontWeight: 700,
                }}
              />
              <Typography variant="h3">Uso e qualidade do HUB</Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.82)", maxWidth: 760 }}>
                Painel executivo-operacional para adoção, descoberta dos sistemas mais usados,
                performance percebida e sinais de fricção no fluxo dos usuários.
              </Typography>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack
              spacing={1.25}
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: "rgba(255,255,255,0.12)",
                backdropFilter: "blur(12px)",
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <QueryStatsRoundedIcon fontSize="small" />
                <Typography variant="subtitle2">Leitura rápida</Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.82)" }}>
                Retorno de usuários: {formatPercent(data.quality.returnRate)}
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.82)" }}>
                Sessões lentas: {formatPercent(data.quality.slowSessionRate)}
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.82)" }}>
                Mediana até o primeiro clique: {formatDuration(data.quality.medianFirstClickMs)}
              </Typography>
            </Stack>
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mt: 2.5, position: "relative", zIndex: 1 }}>
          {data.kpis.map((kpi) => (
            <Grid key={kpi.id} size={{ xs: 12, sm: 6, xl: 2 }}>
              <Box
                sx={{
                  minHeight: 134,
                  p: 2,
                  borderRadius: 3,
                  bgcolor: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.16)",
                }}
              >
                <Stack spacing={1}>
                  <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.74)" }}>
                    {kpi.label}
                  </Typography>
                  <Typography variant="h4">{kpi.value}</Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.78)" }}>
                    {kpi.hint}
                  </Typography>
                </Stack>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {!hasUsageData ? (
        <Alert severity="info">
          Nenhuma telemetria disponível para os filtros atuais. A navegação protegida vai começar a
          preencher este painel conforme os usuários utilizarem o HUB.
        </Alert>
      ) : null}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, xl: 8 }}>
          <Card sx={{ borderRadius: 4, minHeight: 420 }}>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" spacing={2}>
                  <Stack spacing={0.5}>
                    <Typography variant="h5">Adoção ao longo do tempo</Typography>
                    <Typography color="text.secondary">
                      Usuários ativos, sessões e volume de cliques em sistemas.
                    </Typography>
                  </Stack>
                  <Chip
                    icon={<TrendingUpRoundedIcon />}
                    label={`Retorno ${formatPercent(data.quality.returnRate)}`}
                    color="success"
                    variant="outlined"
                  />
                </Stack>

                <LineChart
                  height={320}
                  margin={{ top: 20, bottom: 20, left: 40, right: 20 }}
                  xAxis={[
                    {
                      scaleType: "point",
                      data: data.trend.map((point) => point.label),
                    },
                  ]}
                  series={[
                    {
                      data: data.trend.map((point) => point.uniqueUsers),
                      label: "Usuarios",
                      color: "#0F4C81",
                    },
                    {
                      data: data.trend.map((point) => point.sessions),
                      label: "Sessoes",
                      color: "#D28A16",
                    },
                    {
                      data: data.trend.map((point) => point.systemClicks),
                      label: "Cliques em sistemas",
                      color: "#18794E",
                    },
                  ]}
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, xl: 4 }}>
          <Card sx={{ borderRadius: 4, minHeight: 420 }}>
            <CardContent>
              <Stack spacing={2}>
                <Stack spacing={0.5}>
                  <Typography variant="h5">Participação por departamento</Typography>
                  <Typography color="text.secondary">
                    Fatia de sessões entre as áreas que mais usam o HUB.
                  </Typography>
                </Stack>

                {data.departmentShare.length > 0 ? (
                  <PieChart
                    height={260}
                    series={[
                      {
                        data: data.departmentShare.map((row, index) => ({
                          id: index,
                          value: row.sessions,
                          label: row.label,
                        })),
                        innerRadius: 48,
                        outerRadius: 100,
                        paddingAngle: 2,
                      },
                    ]}
                  />
                ) : (
                  renderEmptyState("Sem distribuição suficiente por departamento no período.")
                )}

                <Stack spacing={1.25}>
                  {data.departmentShare.slice(0, 4).map((row) => (
                    <Stack key={row.departmentId} direction="row" justifyContent="space-between">
                      <Box>
                        <Typography fontWeight={700}>{row.label}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {row.uniqueUsers} usuários únicos
                        </Typography>
                      </Box>
                      <Typography fontWeight={700}>{row.sessions}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, xl: 7 }}>
          <Card sx={{ borderRadius: 4, minHeight: 420 }}>
            <CardContent>
              <Stack spacing={2.5}>
                <Stack direction="row" justifyContent="space-between" spacing={2}>
                  <Stack spacing={0.5}>
                    <Typography variant="h5">Sistemas mais clicados</Typography>
                    <Typography color="text.secondary">
                      Descoberta real do catálogo e densidade de uso por usuário.
                    </Typography>
                  </Stack>
                  <Chip
                    icon={<NorthEastRoundedIcon />}
                    label={`${data.systemRanking.length} sistemas com uso`}
                    color="primary"
                    variant="outlined"
                  />
                </Stack>

                {data.systemRanking.length > 0 ? (
                  <BarChart
                    height={300}
                    margin={{ top: 20, bottom: 60, left: 50, right: 20 }}
                    xAxis={[
                      {
                        scaleType: "band",
                        data: data.systemRanking.map((row) => row.label),
                      },
                    ]}
                    series={[
                      {
                        data: data.systemRanking.map((row) => row.clicks),
                        label: "Cliques",
                        color: "#0F4C81",
                      },
                      {
                        data: data.systemRanking.map((row) => row.uniqueUsers),
                        label: "Usuarios",
                        color: "#D28A16",
                      },
                    ]}
                  />
                ) : (
                  renderEmptyState("Nenhum clique em sistemas registrado no período.")
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, xl: 5 }}>
          <Card sx={{ borderRadius: 4, minHeight: 420 }}>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" spacing={2}>
                  <Stack spacing={0.5}>
                    <Typography variant="h5">Lacunas de catálogo</Typography>
                    <Typography color="text.secondary">
                      Sistemas ativos sem clique dentro da janela atual.
                    </Typography>
                  </Stack>
                  <Chip
                    icon={<TrendingDownRoundedIcon />}
                    label={`${data.dormantSystems.length} sem uso`}
                    color="warning"
                    variant="outlined"
                  />
                </Stack>

                {data.dormantSystems.length > 0 ? (
                  <Stack spacing={1.25}>
                    {data.dormantSystems.map((row) => (
                      <Box
                        key={row.systemId}
                        sx={{
                          p: 1.5,
                          borderRadius: 2.5,
                          border: "1px solid",
                          borderColor: "divider",
                          bgcolor: "rgba(15,76,129,0.03)",
                        }}
                      >
                        <Typography fontWeight={700}>{row.label}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Reavaliar destaque, nomenclatura ou necessidade operacional.
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  renderEmptyState("Todos os sistemas ativos tiveram ao menos um clique no período.")
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, xl: 6 }}>
          <Card sx={{ borderRadius: 4, minHeight: 420 }}>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" spacing={2}>
                  <Stack spacing={0.5}>
                    <Typography variant="h5">Qualidade de carregamento</Typography>
                    <Typography color="text.secondary">
                      Rotas com pior percepção de tempo e maior concentração de lentidão.
                    </Typography>
                  </Stack>
                  <Chip
                    icon={<TimerRoundedIcon />}
                    label={`Sessões lentas ${formatPercent(data.quality.slowSessionRate)}`}
                    color="warning"
                    variant="outlined"
                  />
                </Stack>

                {data.performanceRows.length > 0 ? (
                  <Stack spacing={1.25}>
                    {data.performanceRows.map((row) => (
                      <Box
                        key={row.path}
                        sx={{
                          p: 1.5,
                          borderRadius: 2.5,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          justifyContent="space-between"
                          spacing={1}
                        >
                          <Box>
                            <Typography fontWeight={700}>{row.path}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {row.samples} amostras • {formatPercent(row.slowSampleRate)} lentas
                            </Typography>
                          </Box>
                          <Stack alignItems={{ xs: "flex-start", sm: "flex-end" }}>
                            <Typography fontWeight={700}>{formatDuration(row.avgLoadMs)}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              p95 {formatDuration(row.p95LoadMs)}
                            </Typography>
                          </Stack>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  renderEmptyState("Nenhuma amostra de carregamento disponível ainda.")
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, xl: 6 }}>
          <Card sx={{ borderRadius: 4, minHeight: 420 }}>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" spacing={2}>
                  <Stack spacing={0.5}>
                    <Typography variant="h5">Páginas com atrito</Typography>
                    <Typography color="text.secondary">
                      Volume alto de visualização sem ação posterior dentro da mesma sessão.
                    </Typography>
                  </Stack>
                  <Chip
                    icon={<WarningAmberRoundedIcon />}
                    label={`Sem ação ${formatPercent(data.quality.noActionRate)}`}
                    color="error"
                    variant="outlined"
                  />
                </Stack>

                {data.lowActionPages.length > 0 ? (
                  <Stack spacing={1.25}>
                    {data.lowActionPages.map((row) => (
                      <Box
                        key={row.path}
                        sx={{
                          p: 1.5,
                          borderRadius: 2.5,
                          border: "1px solid",
                          borderColor: "divider",
                          bgcolor: "rgba(180,35,24,0.03)",
                        }}
                      >
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          justifyContent="space-between"
                          spacing={1}
                        >
                          <Box>
                            <Typography fontWeight={700}>{row.path}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {row.views} visualizações no período
                            </Typography>
                          </Box>
                          <Typography fontWeight={700}>
                            {formatPercent(row.followUpActionRate)} com ação
                          </Typography>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  renderEmptyState("Nenhuma página com volume suficiente para análise de atrito.")
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card sx={{ borderRadius: 4 }}>
            <CardContent>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Stack spacing={1.25}>
                    <Typography variant="h5">Conteúdo e engajamento</Typography>
                    <Typography color="text.secondary">
                      Sinais de utilidade do HUB além da navegação por sistemas.
                    </Typography>
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, md: 8 }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          bgcolor: "rgba(15,76,129,0.04)",
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Typography variant="overline" color="text.secondary">
                          Downloads
                        </Typography>
                        <Typography variant="h4">{data.content.documentDownloads}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Documentos realmente abertos pelos usuários.
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          bgcolor: "rgba(15,76,129,0.04)",
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Typography variant="overline" color="text.secondary">
                          Leituras de aviso
                        </Typography>
                        <Typography variant="h4">{data.content.noticeReads}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Usa `hub_notice_reads` como sinal de engajamento.
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          bgcolor: "rgba(15,76,129,0.04)",
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Typography variant="overline" color="text.secondary">
                          Taxa de leitura
                        </Typography>
                        <Typography variant="h4">
                          {formatPercent(data.content.noticeReadRate)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Cobertura estimada das leituras sobre os avisos ativos.
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="body2" color="text.secondary">
                Adoção baixa em sistemas sem clique costuma indicar problema de nome, prioridade
                visual ou irrelevância real. Se a lentidão e a taxa de sessões sem ação subirem ao
                mesmo tempo, o gargalo tende a estar na descoberta do próximo passo.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Telemetria capturada apenas dentro do HUB nesta v1. Para expandir ao ecossistema
                inteiro, cada sistema externo precisará publicar os mesmos eventos.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1.5 }}>
                <Link href="/admin" underline="hover">
                  Voltar ao painel administrativo
                </Link>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}

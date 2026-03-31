"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import ViewKanbanRoundedIcon from "@mui/icons-material/ViewKanbanRounded";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Divider,
  IconButton,
  Stack,
  Typography,
  alpha,
  useMediaQuery,
} from "@mui/material";
import Image from "next/image";
import { useState } from "react";

import { LoginForm } from "@/modules/auth/components/login-form";
import type { PageFeedback } from "@/shared/lib/feedback";
import { PageFeedbackAlert } from "@/shared/ui/components/page-feedback";
import { SetupState } from "@/shared/ui/components/setup-state";

const LOGIN_LEFT_BACKGROUND = "/images/login-left-background.webp";

const overviewBlocks = [
  {
    title: "Acesso centralizado",
    body: "Reune os atalhos mais importantes da operacao em um unico ponto, reduzindo o tempo para encontrar sistemas e recursos internos.",
  },
  {
    title: "Navegacao mais simples",
    body: "Organiza a entrada para os ambientes da Flexibase com uma experiencia mais direta, clara e consistente para o time.",
  },
  {
    title: "Visibilidade institucional",
    body: "Apresenta o ecossistema interno de forma estruturada, ajudando cada pessoa a entender rapidamente onde acessar o que precisa.",
  },
  {
    title: "Base para expansao",
    body: "Cria uma porta de entrada unica para evoluir integracoes, comunicacao interna e novos acessos conforme o HUB crescer.",
  },
];

const faqItems = [
  {
    title: "Projetos",
    body: "Concentra atalhos e referencias para os sistemas ligados ao acompanhamento das frentes e iniciativas internas.",
  },
  {
    title: "Atividades",
    body: "Facilita a navegacao para ambientes usados na rotina operacional e no acompanhamento das entregas.",
  },
  {
    title: "Kanban e TO-DOs",
    body: "Pode reunir acessos para ferramentas visuais de acompanhamento, listas de execucao e organizacao do trabalho.",
  },
  {
    title: "Indicadores",
    body: "Serve como ponto de entrada para paineis, leituras gerenciais e consultas rapidas de desempenho.",
  },
  {
    title: "Conquistas e Niveis",
    body: "Tambem pode acomodar acessos a iniciativas de reconhecimento, trilhas internas e evolucao do time.",
  },
  {
    title: "Colaboracao",
    body: "Ajuda a aproximar pessoas, areas e ferramentas em um mesmo ponto de consulta e navegacao.",
  },
  {
    title: "Organograma e Mapa",
    body: "Pode conectar estruturas internas, mapas de area e referencias institucionais de forma mais acessivel.",
  },
  {
    title: "Custos",
    body: "Abre espaco para centralizar sistemas financeiros e operacionais relevantes para a leitura do negocio.",
  },
];

interface LoginScreenProps {
  feedback: PageFeedback | null;
  isConfigured: boolean;
}

export function LoginScreen({ feedback, isConfigured }: LoginScreenProps) {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const [showAbout, setShowAbout] = useState(false);
  const [isDark, setIsDark] = useState(prefersDarkMode);

  const leftPanelGradient = isDark
    ? "linear-gradient(145deg, #0F172A 0%, #1E293B 60%, #0F172A 100%)"
    : "linear-gradient(145deg, #1E40AF 0%, #2563EB 50%, #3B82F6 100%)";

  const rightPanelBackground = isDark
    ? "linear-gradient(180deg, #020617 0%, #0F172A 100%)"
    : "linear-gradient(180deg, #F8FAFC 0%, #EFF6FF 100%)";
  const rightPanelPaper = isDark ? "rgba(15,23,42,0.76)" : "rgba(255,255,255,0.84)";
  const rightPanelBorder = isDark ? "rgba(148,163,184,0.18)" : "rgba(37,99,235,0.12)";
  const secondaryText = isDark ? "rgba(226,232,240,0.72)" : "text.secondary";

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        overflow: "hidden",
        backgroundColor: isDark ? "#020617" : "#F8FAFC",
      }}
    >
      <Box
        component="section"
        sx={{
          position: "relative",
          width: { xs: "100%", md: "50%" },
          minHeight: { xs: 220, md: "100vh" },
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          px: { xs: 3, sm: 4, md: 6 },
          py: { xs: 3.5, md: 5 },
          color: "common.white",
          backgroundImage: `${leftPanelGradient}, url(${LOGIN_LEFT_BACKGROUND})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 22% 18%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 38%)",
          }}
        />

        <Stack
          spacing={{ xs: 2, md: 3 }}
          sx={{
            position: "relative",
            zIndex: 1,
            maxWidth: 560,
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 52,
                height: 52,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 3,
                border: "1px solid rgba(255,255,255,0.24)",
                backgroundColor: "rgba(255,255,255,0.12)",
                backdropFilter: "blur(10px)",
              }}
            >
              <Image
                src="/flexibase-logo.png"
                alt="Flexibase"
                width={32}
                height={32}
                style={{ objectFit: "contain" }}
                priority
              />
            </Box>

            <Typography
              sx={{
                fontFamily:
                  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                textTransform: "uppercase",
              }}
            >
              HUB
            </Typography>
          </Stack>

          <Stack spacing={1.5}>
            <Typography
              variant="h2"
              sx={{
                fontFamily:
                  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                fontWeight: 700,
                letterSpacing: "-0.045em",
                maxWidth: 520,
              }}
            >
              HUB Flexibase
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.82)", maxWidth: 500 }}>
              HUB interno da Flexibase, mais facilidade para navegar nos nossos sistemas
            </Typography>
          </Stack>
        </Stack>
      </Box>

      <Box
        component="section"
        sx={{
          position: "relative",
          width: { xs: "100%", md: "50%" },
          minWidth: 0,
          flex: 1,
          overflow: "hidden",
          background: rightPanelBackground,
          color: isDark ? "rgba(248,250,252,0.96)" : "text.primary",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: isDark
              ? "radial-gradient(circle at top right, rgba(59,130,246,0.18), transparent 28%)"
              : "radial-gradient(circle at top right, rgba(59,130,246,0.16), transparent 30%)",
          }}
        />

        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            minHeight: 0,
            p: { xs: 2, sm: 3, md: 4 },
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "flex-end", pb: 2 }}>
            <IconButton
              aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
              onClick={() => setIsDark((current) => !current)}
              sx={{
                width: 44,
                height: 44,
                border: "1px solid",
                borderColor: rightPanelBorder,
                backgroundColor: alpha(isDark ? "#0F172A" : "#FFFFFF", isDark ? 0.82 : 0.72),
                backdropFilter: "blur(12px)",
              }}
            >
              {isDark ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
            </IconButton>
          </Box>

          {showAbout ? (
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                overflow: "auto",
                pr: { xs: 0.5, sm: 1 },
              }}
            >
              <Stack spacing={3}>
                <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
                  <Button
                    variant="text"
                    color="inherit"
                    startIcon={<ArrowBackRoundedIcon />}
                    onClick={() => setShowAbout(false)}
                    sx={{ px: 0 }}
                  >
                    Voltar ao login
                  </Button>
                </Box>

                <Box
                  sx={{
                    borderRadius: 6,
                    border: "1px solid",
                    borderColor: rightPanelBorder,
                    backgroundColor: rightPanelPaper,
                    backdropFilter: "blur(16px)",
                    p: { xs: 2.5, md: 3 },
                  }}
                >
                  <Stack spacing={3}>
                    <Stack spacing={1.5}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <AutoAwesomeRoundedIcon color="primary" />
                        <Typography variant="h4">O que e este sistema</Typography>
                      </Stack>
                      <Typography color={secondaryText}>
                        O HUB Flexibase e a porta de entrada para navegar com mais facilidade
                        pelos sistemas internos da empresa, concentrando acessos e referencias em
                        um unico lugar.
                      </Typography>
                    </Stack>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                        gap: 2,
                      }}
                    >
                      {overviewBlocks.map((block, index) => (
                        <Box
                          key={block.title}
                          sx={{
                            borderRadius: 4,
                            p: 2.25,
                            border: "1px solid",
                            borderColor: alpha(isDark ? "#94A3B8" : "#2563EB", 0.18),
                            backgroundColor: alpha(isDark ? "#0F172A" : "#FFFFFF", 0.52),
                          }}
                        >
                          <Stack spacing={1}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              {index % 3 === 0 ? (
                                <HubRoundedIcon color="primary" fontSize="small" />
                              ) : index % 3 === 1 ? (
                                <ViewKanbanRoundedIcon color="primary" fontSize="small" />
                              ) : (
                                <InsightsRoundedIcon color="primary" fontSize="small" />
                              )}
                              <Typography variant="h6">{block.title}</Typography>
                            </Stack>
                            <Typography color={secondaryText}>{block.body}</Typography>
                          </Stack>
                        </Box>
                      ))}
                    </Box>

                    <Divider />

                    <Stack spacing={1}>
                      <Typography variant="h5">FAQ</Typography>
                      <Typography color={secondaryText}>
                        Resumo rapido das areas cobertas pela Central de Tarefas.
                      </Typography>
                    </Stack>

                    <Stack spacing={1.25}>
                      {faqItems.map((item) => (
                        <Accordion
                          key={item.title}
                          disableGutters
                          sx={{
                            overflow: "hidden",
                            borderRadius: 4,
                            border: "1px solid",
                            borderColor: rightPanelBorder,
                            backgroundColor: alpha(isDark ? "#0F172A" : "#FFFFFF", 0.58),
                            "&:before": {
                              display: "none",
                            },
                          }}
                        >
                          <AccordionSummary
                            expandIcon={<ExpandMoreRoundedIcon />}
                            sx={{
                              minHeight: 60,
                              px: 2,
                              "& .MuiAccordionSummary-content": {
                                my: 1.5,
                              },
                            }}
                          >
                            <Typography sx={{ fontWeight: 600 }}>{item.title}</Typography>
                          </AccordionSummary>
                          <AccordionDetails sx={{ px: 2, pt: 0, pb: 2 }}>
                            <Typography color={secondaryText}>{item.body}</Typography>
                          </AccordionDetails>
                        </Accordion>
                      ))}
                    </Stack>
                  </Stack>
                </Box>
              </Stack>
            </Box>
          ) : (
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  maxWidth: 520,
                  borderRadius: 6,
                  border: "1px solid",
                  borderColor: rightPanelBorder,
                  backgroundColor: rightPanelPaper,
                  backdropFilter: "blur(16px)",
                  p: { xs: 2.5, sm: 3.5, md: 4 },
                  boxShadow: isDark
                    ? "0 24px 60px rgba(2,6,23,0.48)"
                    : "0 24px 60px rgba(37,99,235,0.12)",
                }}
              >
                <Stack spacing={3}>
                  <PageFeedbackAlert feedback={feedback} />
                  {isConfigured ? (
                    <LoginForm onShowAbout={() => setShowAbout(true)} />
                  ) : (
                    <SetupState />
                  )}
                </Stack>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

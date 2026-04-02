"use client";

import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Image from "next/image";
import Link from "next/link";

import { ViewerMenu } from "@/modules/auth/components/viewer-menu";
import { NoticeBell } from "@/modules/hub/components/notice-bell";
import type { HubNotice, HubNoticeRead, ViewerContext } from "@/shared/types/hub";

interface ProtectedShellProps {
  viewer?: ViewerContext | null;
  notices?: HubNotice[];
  noticeReads?: HubNoticeRead[];
  children: React.ReactNode;
}

export function ProtectedShell({
  viewer,
  notices = [],
  noticeReads = [],
  children,
}: ProtectedShellProps) {
  return (
    <Box sx={{ minHeight: "100vh", pb: 6 }}>
      <Box
        sx={{
          background:
            "radial-gradient(circle at top left, rgba(15,76,129,0.22), transparent 36%), linear-gradient(135deg, #0F4C81 0%, #123A5E 54%, #1E293B 100%)",
          color: "common.white",
          boxShadow: "0 18px 48px rgba(15,76,129,0.18)",
        }}
      >
        <Container maxWidth="xl" sx={{ py: 1.5 }}>
          <Stack spacing={1.5}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr auto", md: "1fr auto 1fr" },
                alignItems: "center",
                columnGap: 2,
                rowGap: 1.5,
              }}
            >
              <Stack direction="row" alignItems="center" sx={{ minHeight: 40 }}>
                <Typography
                  component={Link}
                  href="/hub"
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: 0.4,
                    textTransform: "uppercase",
                    color: "inherit",
                    textDecoration: "none",
                  }}
                >
                  Hub
                </Typography>
              </Stack>

              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Box
                  component={Link}
                  href="/hub"
                  sx={{
                    width: { xs: 112, sm: 136 },
                    aspectRatio: "1086 / 495",
                    py: "5px",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                  }}
                >
                  <Image
                    src="/flexibase-logo.png"
                    alt="Flexibase"
                    width={1086}
                    height={495}
                    sizes="136px"
                    style={{
                      width: "100%",
                      height: "auto",
                      filter:
                        "brightness(0) invert(1) drop-shadow(0 0 12px rgba(255,255,255,0.22))",
                    }}
                    priority
                  />
                </Box>
              </Box>

              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                justifyContent="flex-end"
                sx={{ gridColumn: { xs: "2 / 3", md: "3 / 4" } }}
              >
                {viewer?.isAdmin ? (
                  <Button
                    component={Link}
                    href="/admin"
                    variant="outlined"
                    color="inherit"
                    startIcon={<AdminPanelSettingsRoundedIcon />}
                    sx={{
                      borderColor: "rgba(255,255,255,0.28)",
                      color: "common.white",
                      minWidth: "fit-content",
                    }}
                  >
                    Admin
                  </Button>
                ) : null}
                {viewer ? (
                  <>
                    <NoticeBell notices={notices} noticeReads={noticeReads} />
                    <ViewerMenu viewer={viewer} />
                  </>
                ) : (
                  <Button
                    component={Link}
                    href="/login"
                    variant="outlined"
                    color="inherit"
                    startIcon={<AccountCircleRoundedIcon />}
                    sx={{
                      borderColor: "rgba(255,255,255,0.28)",
                      color: "common.white",
                      minWidth: "fit-content",
                    }}
                  >
                    Usuario
                  </Button>
                )}
              </Stack>
            </Box>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ mt: 2.5 }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: "10px",
            p: { xs: 2.5, md: 4 },
            backgroundColor: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(18px)",
          }}
        >
          {children}
        </Paper>
      </Container>
    </Box>
  );
}

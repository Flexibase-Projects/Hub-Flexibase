"use client";

import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/modules/auth/components/logout-button";
import type { ViewerContext } from "@/shared/types/hub";

function ShellNav() {
  const pathname = usePathname();

  const items = [
    {
      href: "/hub",
      label: "Hub",
      icon: <HubRoundedIcon fontSize="small" />,
    },
    {
      href: "/admin",
      label: "Admin",
      icon: <SettingsRoundedIcon fontSize="small" />,
    },
  ];

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap">
      {items.map((item) => {
        const isActive = pathname.startsWith(item.href);

        return (
          <Button
            key={item.href}
            component={Link}
            href={item.href}
            variant={isActive ? "contained" : "text"}
            startIcon={item.icon}
            color="inherit"
          >
            {item.label}
          </Button>
        );
      })}
    </Stack>
  );
}

interface ProtectedShellProps {
  viewer?: ViewerContext | null;
  children: React.ReactNode;
}

export function ProtectedShell({ viewer, children }: ProtectedShellProps) {
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
                gridTemplateColumns: "1fr auto 1fr",
                alignItems: "center",
                columnGap: 2,
              }}
            >
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase" }}
                >
                  Hub
                </Typography>
              </Stack>

              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Box
                  sx={{
                    position: "relative",
                    width: { xs: 112, sm: 136 },
                    height: { xs: 34, sm: 40 },
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Image
                    src="/flexibase-logo.png"
                    alt="Flexibase"
                    fill
                    sizes="136px"
                    style={{ objectFit: "contain" }}
                    priority
                  />
                </Box>
              </Box>

              <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
                {viewer ? (
                  <>
                    <Chip
                      label={viewer.isAdmin ? "Administrador" : "Colaborador"}
                      color={viewer.isAdmin ? "secondary" : "default"}
                      size="small"
                    />
                    <Button
                      variant="outlined"
                      color="inherit"
                      startIcon={<AccountCircleRoundedIcon />}
                      sx={{
                        borderColor: "rgba(255,255,255,0.28)",
                        color: "common.white",
                        minWidth: "fit-content",
                      }}
                    >
                      {viewer.displayName}
                    </Button>
                    <LogoutButton />
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
                    }}
                  >
                    Conectar
                  </Button>
                )}
              </Stack>
            </Box>

            {viewer ? (
              <>
                <Divider sx={{ borderColor: "rgba(255,255,255,0.14)" }} />
                <ShellNav />
              </>
            ) : null}
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ mt: 2.5 }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 6,
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

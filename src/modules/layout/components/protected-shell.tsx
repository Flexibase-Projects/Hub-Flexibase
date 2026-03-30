"use client";

import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import {
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
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
          >
            {item.label}
          </Button>
        );
      })}
    </Stack>
  );
}

interface ProtectedShellProps {
  viewer: ViewerContext;
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
          pb: 7,
        }}
      >
        <Container maxWidth="xl" sx={{ pt: 4 }}>
          <Stack spacing={3}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
              spacing={2}
            >
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <DashboardRoundedIcon />
                  <Typography variant="overline">Flexibase HUB</Typography>
                </Stack>
                <Typography variant="h2">Tudo que a operação precisa, em um lugar.</Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.76)", maxWidth: 780 }}>
                  Uma experiência interna mais rápida, organizada e agradável para acessar
                  sistemas, documentos e comunicados.
                </Typography>
              </Stack>
              <Stack spacing={1.5} alignItems={{ xs: "flex-start", md: "flex-end" }}>
                <Chip
                  label={viewer.isAdmin ? "Administrador" : "Colaborador"}
                  color={viewer.isAdmin ? "secondary" : "default"}
                />
                <Typography>{viewer.displayName}</Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.76)" }}>
                  {viewer.email}
                </Typography>
                <LogoutButton />
              </Stack>
            </Stack>
            <ShellNav />
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ mt: -4 }}>
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

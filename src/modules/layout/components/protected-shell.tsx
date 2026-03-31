"use client";

import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import {
  Box,
  Button,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ViewerMenu } from "@/modules/auth/components/viewer-menu";
import type { ViewerContext } from "@/shared/types/hub";

function ShellNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  const items = isAdmin
    ? [
        {
          href: "/admin",
          label: "Admin",
        },
      ]
    : [];

  return (
    items.length === 0 ? null :
    <Stack direction="row" spacing={1} flexWrap="wrap">
      {items.map((item) => {
        const isActive = pathname.startsWith(item.href);

        return (
          <Button
            key={item.href}
            component={Link}
            href={item.href}
            variant={isActive ? "contained" : "text"}
            color="inherit"
            sx={{
              borderRadius: 2,
            }}
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
                gridTemplateColumns: { xs: "1fr auto", md: "1fr auto 1fr" },
                alignItems: "center",
                columnGap: 2,
                rowGap: 1.5,
              }}
            >
              <Stack direction="row" alignItems="center" sx={{ minHeight: 40 }}>
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

              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                justifyContent="flex-end"
                sx={{ gridColumn: { xs: "2 / 3", md: "3 / 4" } }}
              >
                {viewer ? (
                  <ViewerMenu viewer={viewer} />
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
                <ShellNav isAdmin={viewer.isAdmin} />
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

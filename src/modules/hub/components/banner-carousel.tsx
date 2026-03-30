"use client";

import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { Box, Chip, IconButton, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";

import type { HubBanner } from "@/shared/types/hub";

interface BannerCarouselProps {
  banners: HubBanner[];
}

function getBannerLabel(tone: HubBanner["tone"]) {
  if (tone === "success") {
    return "Destaque";
  }

  if (tone === "warning") {
    return "Atencao";
  }

  return "Comunicado";
}

export function BannerCarousel({ banners }: BannerCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % banners.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [banners.length]);

  if (banners.length === 0) {
    return null;
  }

  const activeBanner = banners[activeIndex] ?? banners[0];

  return (
    <Box
      sx={{
        minHeight: { xs: 240, md: 300 },
        borderRadius: 6,
        overflow: "hidden",
        p: { xs: 3, md: 4 },
        background: activeBanner.imageUrl
          ? `linear-gradient(135deg, rgba(8,31,52,0.64), rgba(15,76,129,0.72)), url(${activeBanner.imageUrl}) center/cover`
          : "linear-gradient(135deg, #0F4C81 0%, #123A5E 56%, #1E293B 100%)",
        color: "common.white",
        boxShadow: "0 24px 60px rgba(15,76,129,0.22)",
      }}
    >
      <Stack justifyContent="space-between" sx={{ minHeight: { xs: 192, md: 220 } }}>
        <Stack spacing={1.25} sx={{ maxWidth: 720 }}>
          <Chip
            label={getBannerLabel(activeBanner.tone)}
            color="secondary"
            sx={{ width: "fit-content" }}
          />
          <Typography variant="h3">{activeBanner.title}</Typography>
          {activeBanner.subtitle ? (
            <Typography sx={{ color: "rgba(255,255,255,0.88)" }}>
              {activeBanner.subtitle}
            </Typography>
          ) : null}
          {activeBanner.body ? (
            <Typography sx={{ color: "rgba(255,255,255,0.82)", maxWidth: 640 }}>
              {activeBanner.body}
            </Typography>
          ) : null}
        </Stack>

        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Stack direction="row" spacing={1}>
            <IconButton
              aria-label="Banner anterior"
              onClick={() =>
                setActiveIndex((current) => (current === 0 ? banners.length - 1 : current - 1))
              }
              sx={{
                color: "common.white",
                border: "1px solid rgba(255,255,255,0.24)",
                backgroundColor: "rgba(255,255,255,0.08)",
              }}
            >
              <ChevronLeftRoundedIcon />
            </IconButton>
            <IconButton
              aria-label="Proximo banner"
              onClick={() => setActiveIndex((current) => (current + 1) % banners.length)}
              sx={{
                color: "common.white",
                border: "1px solid rgba(255,255,255,0.24)",
                backgroundColor: "rgba(255,255,255,0.08)",
              }}
            >
              <ChevronRightRoundedIcon />
            </IconButton>
          </Stack>

          <Stack direction="row" spacing={1}>
            {banners.map((banner, index) => (
              <Box
                key={banner.id}
                component="button"
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Ir para banner ${index + 1}`}
                sx={{
                  width: index === activeIndex ? 28 : 10,
                  height: 10,
                  border: 0,
                  p: 0,
                  borderRadius: 999,
                  cursor: "pointer",
                  backgroundColor:
                    index === activeIndex ? "common.white" : "rgba(255,255,255,0.34)",
                }}
              />
            ))}
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}

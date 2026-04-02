"use client";

import { Button } from "@mui/material";

import { trackSystemClick } from "@/shared/lib/analytics/client";
import type { SystemIconKey } from "@/shared/lib/hub/system-icons";
import { resolveSystemIcon } from "@/shared/lib/hub/system-icons";

interface SystemLinkButtonProps {
  href: string;
  title: string;
  iconKey: SystemIconKey;
  targetKey: string;
  targetType?: "registered_system" | "legacy_system";
}

export function SystemLinkButton({
  href,
  title,
  iconKey,
  targetKey,
  targetType = "registered_system",
}: SystemLinkButtonProps) {
  const Icon = resolveSystemIcon(iconKey);

  return (
    <Button
      component="a"
      href={href}
      target="_blank"
      rel="noreferrer"
      variant="outlined"
      startIcon={<Icon />}
      onClick={() => {
        if (typeof window === "undefined") {
          return;
        }

        trackSystemClick({
          path: `${window.location.pathname}${window.location.search}`,
          targetKey,
          targetLabel: title,
          targetType,
        });
      }}
      sx={{
        minHeight: 60,
        borderRadius: 2,
        justifyContent: "flex-start",
        px: 1.75,
        py: 1.4,
        color: "text.primary",
        borderColor: "divider",
        backgroundColor: "background.paper",
        textTransform: "none",
        fontWeight: 600,
        textAlign: "left",
      }}
    >
      {title}
    </Button>
  );
}

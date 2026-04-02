"use client";

import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import { Button } from "@mui/material";

import { getAnalyticsSessionId } from "@/shared/lib/analytics/client";

interface DocumentDownloadButtonProps {
  documentId: string;
}

export function DocumentDownloadButton({ documentId }: DocumentDownloadButtonProps) {
  return (
    <Button
      type="button"
      variant="contained"
      startIcon={<DescriptionRoundedIcon />}
      sx={{ borderRadius: 2, alignSelf: { xs: "stretch", sm: "center" } }}
      onClick={() => {
        const currentPath =
          typeof window === "undefined"
            ? "/hub"
            : `${window.location.pathname}${window.location.search}`;
        const sessionId = getAnalyticsSessionId(currentPath);

        window.location.assign(`/api/documents/${documentId}/download?sid=${sessionId}`);
      }}
    >
      Baixar documento
    </Button>
  );
}

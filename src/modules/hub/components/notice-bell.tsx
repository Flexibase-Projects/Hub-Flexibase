"use client";

import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Popover,
  Stack,
  Typography,
} from "@mui/material";
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { markNoticesReadAction } from "@/modules/hub/actions";
import { getAnalyticsSessionId } from "@/shared/lib/analytics/client";
import { formatDate } from "@/shared/lib/hub/utils";
import type { HubNotice, HubNoticeRead } from "@/shared/types/hub";

interface NoticeBellProps {
  notices: HubNotice[];
  noticeReads: HubNoticeRead[];
}

function getSeverityLabel(severity: HubNotice["severity"]) {
  if (severity === "critical") {
    return "Critica";
  }

  if (severity === "important") {
    return "Importante";
  }

  return "Informativa";
}

function getSeverityColor(severity: HubNotice["severity"]) {
  if (severity === "critical") {
    return "error" as const;
  }

  if (severity === "important") {
    return "warning" as const;
  }

  return "info" as const;
}

export function NoticeBell({ notices, noticeReads }: NoticeBellProps) {
  const pathname = usePathname() || "/hub";
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [readNoticeIds, setReadNoticeIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setReadNoticeIds(
      [...new Set(noticeReads.map((noticeRead) => noticeRead.noticeId).filter(Boolean))]
    );
  }, [noticeReads]);

  const readNoticeIdSet = new Set(readNoticeIds);
  const unreadNotices = notices.filter((notice) => !readNoticeIdSet.has(notice.id));
  const orderedNotices = [
    ...unreadNotices,
    ...notices.filter((notice) => readNoticeIdSet.has(notice.id)),
  ];
  const hasUnread = unreadNotices.length > 0;

  function handleOpen(event: React.MouseEvent<HTMLElement>) {
    setAnchorEl(event.currentTarget);

    if (!hasUnread || isPending) {
      return;
    }

    const unreadIds = unreadNotices.map((notice) => notice.id);
    const previousReadIds = readNoticeIds;
    setReadNoticeIds((current) => [...new Set([...current, ...unreadIds])]);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("pathname", pathname);
      formData.set("noticeIds", JSON.stringify(unreadIds));
      formData.set("sessionId", getAnalyticsSessionId(pathname));

      try {
        await markNoticesReadAction(formData);
      } catch {
        setReadNoticeIds(previousReadIds);
      }
    });
  }

  function handleClose() {
    setAnchorEl(null);
  }

  return (
    <>
      <Box sx={{ position: "relative" }}>
        <IconButton
          aria-label="Abrir comunicados"
          onClick={handleOpen}
          sx={{
            border: "1px solid rgba(255,255,255,0.28)",
            color: "common.white",
            backgroundColor: anchorEl ? "rgba(255,255,255,0.12)" : "transparent",
            "&:hover": {
              backgroundColor: "rgba(255,255,255,0.1)",
            },
          }}
        >
          <NotificationsRoundedIcon />
        </IconButton>

        {hasUnread ? (
          <Box
            sx={{
              position: "absolute",
              top: 7,
              right: 7,
              width: 10,
              height: 10,
              borderRadius: "999px",
              backgroundColor: "#FF4D4F",
              boxShadow: "0 0 0 2px rgba(15,76,129,0.95)",
            }}
          />
        ) : null}
      </Box>

      <Popover
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1.25,
              width: {
                xs: "min(92vw, 360px)",
                sm: 420,
              },
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "0 22px 48px rgba(15,76,129,0.16)",
              overflow: "hidden",
            },
          },
        }}
      >
        <Stack spacing={2} sx={{ p: 2.25 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
            <Stack spacing={0.5}>
              <Typography variant="h6">Comunicados</Typography>
              <Typography variant="body2" color="text.secondary">
                {hasUnread
                  ? `${unreadNotices.length} comunicado(s) novo(s)`
                  : "Nenhum comunicado novo no momento"}
              </Typography>
            </Stack>
            {isPending ? <CircularProgress size={18} /> : null}
          </Stack>

          {orderedNotices.length === 0 ? (
            <Box
              sx={{
                borderRadius: 2.5,
                border: "1px dashed",
                borderColor: "divider",
                px: 2,
                py: 2.5,
                backgroundColor: "rgba(15,76,129,0.03)",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Nenhum comunicado ativo foi publicado ainda.
              </Typography>
            </Box>
          ) : (
            <Stack
              spacing={1.5}
              sx={{
                maxHeight: 420,
                overflowY: "auto",
                pr: 0.5,
              }}
            >
              {orderedNotices.map((notice, index) => (
                <Box
                  key={notice.id}
                  sx={{
                    borderRadius: 2.5,
                    border: "1px solid",
                    borderColor: readNoticeIdSet.has(notice.id)
                      ? "rgba(15,76,129,0.12)"
                      : "rgba(229,57,53,0.18)",
                    backgroundColor: readNoticeIdSet.has(notice.id)
                      ? "rgba(15,76,129,0.03)"
                      : "rgba(255,77,79,0.05)",
                    px: 1.75,
                    py: 1.5,
                  }}
                >
                  <Stack spacing={1.25}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      spacing={1}
                    >
                      <Stack spacing={1}>
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                          <Chip
                            size="small"
                            color={getSeverityColor(notice.severity)}
                            label={getSeverityLabel(notice.severity)}
                          />
                          {!readNoticeIdSet.has(notice.id) ? (
                            <Chip
                              size="small"
                              label="Novo"
                              sx={{
                                backgroundColor: "#FF4D4F",
                                color: "common.white",
                              }}
                            />
                          ) : null}
                        </Stack>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {notice.title}
                        </Typography>
                      </Stack>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ whiteSpace: "nowrap", pt: 0.25 }}
                      >
                        {formatDate(notice.createdAt)}
                      </Typography>
                    </Stack>

                    <Typography variant="body2" color="text.secondary">
                      {notice.body}
                    </Typography>
                  </Stack>

                  {index < orderedNotices.length - 1 ? <Divider sx={{ mt: 1.5 }} /> : null}
                </Box>
              ))}
            </Stack>
          )}
        </Stack>
      </Popover>
    </>
  );
}

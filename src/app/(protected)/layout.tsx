import { Stack } from "@mui/material";

import { getViewerContext } from "@/modules/auth/server";
import { getHubHeaderNoticeData } from "@/modules/hub/queries";
import { HubAnalyticsTracker } from "@/modules/layout/components/hub-analytics-tracker";
import { ProtectedShell } from "@/modules/layout/components/protected-shell";
import { getSupabaseEnv } from "@/shared/lib/supabase/env";
import { SetupState } from "@/shared/ui/components/setup-state";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const env = getSupabaseEnv();

  if (!env.isConfigured) {
    return (
      <Stack sx={{ minHeight: "100vh", justifyContent: "center", p: 4 }}>
        <SetupState />
      </Stack>
    );
  }

  const viewer = await getViewerContext();
  const noticeData = viewer
    ? await getHubHeaderNoticeData(viewer)
    : {
        notices: [],
        noticeReads: [],
      };

  return (
    <ProtectedShell
      viewer={viewer}
      notices={noticeData.notices}
      noticeReads={noticeData.noticeReads}
    >
      {viewer ? <HubAnalyticsTracker /> : null}
      {children}
    </ProtectedShell>
  );
}

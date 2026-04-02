import { Alert, Stack, Typography } from "@mui/material";

import { requireAdminViewer } from "@/modules/auth/server";
import {
  deleteSystemAction,
  restoreSystemAction,
  upsertSystemAction,
} from "@/modules/admin/actions";
import { SystemsAdminManager } from "@/modules/admin/components/systems-admin-manager";
import { getAdminDashboardData } from "@/modules/admin/queries";
import { getPageFeedback } from "@/shared/lib/feedback";
import { PageFeedbackAlert } from "@/shared/ui/components/page-feedback";

interface SystemsAdminPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SystemsAdminPage({
  searchParams,
}: SystemsAdminPageProps) {
  await requireAdminViewer();
  const data = await getAdminDashboardData();
  const feedback = await getPageFeedback(searchParams);

  return (
    <Stack spacing={4}>
      <Stack spacing={1}>
        <Typography variant="h3">Sistemas internos</Typography>
        <Typography color="text.secondary">
          Gestao real dos links exibidos no HUB: cadastro, edicao, icone, exclusao com
          confirmacao dupla e reativacao.
        </Typography>
      </Stack>

      <PageFeedbackAlert feedback={feedback} />
      {data.loadError ? <Alert severity="warning">{data.loadError}</Alert> : null}

      <SystemsAdminManager
        systems={data.systems}
        saveAction={upsertSystemAction}
        deleteAction={deleteSystemAction}
        restoreAction={restoreSystemAction}
      />
    </Stack>
  );
}

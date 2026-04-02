import {
  Alert,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { requireAdminViewer } from "@/modules/auth/server";
import { AdminUsageDashboard } from "@/modules/admin/components/admin-usage-dashboard";
import { getAdminUsageDashboardData } from "@/modules/admin/usage-queries";
import { parseAnalyticsPeriodDays } from "@/modules/admin/usage";

interface AdminUsageDashboardPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminUsageDashboardPage({
  searchParams,
}: AdminUsageDashboardPageProps) {
  await requireAdminViewer();
  const params = await searchParams;
  const periodDays = parseAnalyticsPeriodDays(params.period);
  const departmentId = typeof params.department === "string" ? params.department : null;
  const data = await getAdminUsageDashboardData({
    periodDays,
    departmentId,
  });

  return (
    <Stack spacing={4}>
      <Stack spacing={1}>
        <Typography variant="h3">Dashboard de uso</Typography>
        <Typography color="text.secondary">
          Uso interno, descoberta de sistemas, qualidade percebida e sinais de atrito do HUB.
        </Typography>
      </Stack>

      <form method="get">
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            select
            label="Período"
            name="period"
            defaultValue={String(periodDays)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="7">Últimos 7 dias</MenuItem>
            <MenuItem value="30">Últimos 30 dias</MenuItem>
            <MenuItem value="90">Últimos 90 dias</MenuItem>
          </TextField>

          <TextField
            select
            label="Departamento"
            name="department"
            defaultValue={data.selectedDepartmentId ?? ""}
            sx={{ minWidth: 260 }}
          >
            <MenuItem value="">Todos os departamentos</MenuItem>
            {data.availableDepartments.map((department) => (
              <MenuItem key={department.id} value={department.id}>
                {department.name}
              </MenuItem>
            ))}
          </TextField>

          <Button type="submit" variant="contained" sx={{ alignSelf: { xs: "stretch", md: "center" } }}>
            Aplicar filtros
          </Button>
        </Stack>
      </form>

      {data.loadError && data.kpis.every((kpi) => kpi.value === "0") ? (
        <Alert severity="warning">{data.loadError}</Alert>
      ) : null}

      <AdminUsageDashboard data={data} />
    </Stack>
  );
}

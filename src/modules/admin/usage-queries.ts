import { createAdminSupabaseClient } from "@/shared/lib/supabase/admin";
import { getSupabaseEnv } from "@/shared/lib/supabase/env";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";
import type { AnalyticsPeriodDays, AdminUsageDashboardData } from "@/shared/types/analytics";
import { buildAdminUsageDashboardData } from "@/modules/admin/usage";

function parseNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parseBoolean(value: unknown) {
  return value === true || value === "true";
}

function parseStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }

  if (typeof value === "string" && value.startsWith("{") && value.endsWith("}")) {
    return value
      .slice(1, -1)
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
}

function createEmptyUsageData(periodDays: AnalyticsPeriodDays): AdminUsageDashboardData {
  return buildAdminUsageDashboardData({
    now: new Date(),
    periodDays,
    selectedDepartmentId: null,
    departments: [],
    systems: [],
    sessionRows: [],
    systemClickRows: [],
    pageLoadRows: [],
    pageViewRows: [],
    contentRows: [],
    noticeReadRows: [],
    noticeDepartmentByUserId: new Map(),
    activeNoticeCount: 0,
    loadError: "Supabase ainda nao esta configurado para o dashboard analitico.",
  });
}

export async function getAdminUsageDashboardData(input: {
  periodDays: AnalyticsPeriodDays;
  departmentId?: string | null;
}): Promise<AdminUsageDashboardData> {
  const supabase = await createServerSupabaseClient();
  const adminSupabase = createAdminSupabaseClient();

  if (!supabase && !adminSupabase) {
    return createEmptyUsageData(input.periodDays);
  }

  const hubClient = adminSupabase ?? supabase;

  if (!hubClient) {
    return createEmptyUsageData(input.periodDays);
  }

  const hub = hubClient.schema(getSupabaseEnv().schema);
  const startAt = new Date();
  startAt.setDate(startAt.getDate() - (input.periodDays - 1));
  startAt.setHours(0, 0, 0, 0);
  const startIso = startAt.toISOString();

  const [
    departmentsResult,
    systemsResult,
    sessionSummaryResult,
    systemClickResult,
    pageLoadResult,
    pageViewResult,
    contentEventsResult,
    noticeReadsResult,
    userDepartmentsResult,
    noticesResult,
  ] = await Promise.all([
    hub.from("hub_departments").select("id, name").eq("is_active", true).is("deleted_at", null),
    hub
      .from("hub_system_links")
      .select("id, title, is_active")
      .eq("is_active", true)
      .is("deleted_at", null),
    hub.from("hub_admin_session_summary").select("*").gte("started_at", startIso),
    hub.from("hub_admin_system_click_events").select("*").gte("created_at", startIso),
    hub.from("hub_admin_page_load_samples").select("*").gte("created_at", startIso),
    hub.from("hub_admin_page_view_events").select("*").gte("created_at", startIso),
    hub.from("hub_admin_content_events").select("*").gte("created_at", startIso),
    hub.from("hub_notice_reads").select("user_id, notice_id, read_at").gte("read_at", startIso),
    hub.from("hub_user_departments").select("user_id, department_id").is("deleted_at", null),
    hub.from("hub_notices").select("id").eq("is_active", true).is("deleted_at", null),
  ]);

  const possibleErrors = [
    departmentsResult.error,
    systemsResult.error,
    sessionSummaryResult.error,
    systemClickResult.error,
    pageLoadResult.error,
    pageViewResult.error,
    contentEventsResult.error,
    noticeReadsResult.error,
    userDepartmentsResult.error,
    noticesResult.error,
  ].filter(Boolean);

  const departments = (departmentsResult.data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name),
  }));
  const departmentIds = new Set(departments.map((department) => department.id));
  const selectedDepartmentId =
    input.departmentId && departmentIds.has(input.departmentId) ? input.departmentId : null;

  const noticeDepartmentByUserId = new Map<string, string[]>();

  (userDepartmentsResult.data ?? []).forEach((row) => {
    const userId = String(row.user_id);
    const list = noticeDepartmentByUserId.get(userId) ?? [];
    list.push(String(row.department_id));
    noticeDepartmentByUserId.set(userId, list);
  });

  return buildAdminUsageDashboardData({
    now: new Date(),
    periodDays: input.periodDays,
    selectedDepartmentId,
    departments,
    systems: (systemsResult.data ?? []).map((row) => ({
      id: String(row.id),
      title: String(row.title),
      isActive: Boolean(row.is_active),
    })),
    sessionRows: (sessionSummaryResult.data ?? []).map((row) => ({
      sessionId: String(row.session_id),
      userId: String(row.user_id),
      departmentIds: parseStringArray(row.department_ids),
      startedAt: String(row.started_at),
      activityDay: String(row.activity_day),
      systemClickCount: parseNumber(row.system_click_count) ?? 0,
      documentDownloadCount: parseNumber(row.document_download_count) ?? 0,
      noticeReadCount: parseNumber(row.notice_read_count) ?? 0,
      avgPageLoadMs: parseNumber(row.avg_page_load_ms),
      pageViewCount: parseNumber(row.page_view_count) ?? 0,
      hadAction: parseBoolean(row.had_action),
      isReturningUser: parseBoolean(row.is_returning_user),
      isSlowSession: parseBoolean(row.is_slow_session),
      firstSystemClickAfterMs: parseNumber(row.first_system_click_after_ms),
    })),
    systemClickRows: (systemClickResult.data ?? []).map((row) => ({
      sessionId: String(row.session_id),
      userId: String(row.user_id),
      departmentIds: parseStringArray(row.department_ids),
      targetKey: String(row.target_key),
      targetLabel: String(row.target_label ?? row.target_key),
      createdAt: String(row.created_at),
    })),
    pageLoadRows: (pageLoadResult.data ?? []).map((row) => ({
      sessionId: String(row.session_id),
      departmentIds: parseStringArray(row.department_ids),
      path: String(row.path),
      createdAt: String(row.created_at),
      pageLoadMs: parseNumber(row.page_load_ms),
    })),
    pageViewRows: (pageViewResult.data ?? []).map((row) => ({
      sessionId: String(row.session_id),
      departmentIds: parseStringArray(row.department_ids),
      path: String(row.path),
      createdAt: String(row.created_at),
      hadFollowUpAction: parseBoolean(row.had_follow_up_action),
    })),
    contentRows: (contentEventsResult.data ?? []).map((row) => ({
      userId: String(row.user_id),
      departmentIds: parseStringArray(row.department_ids),
      eventName:
        String(row.event_name) === "notice_read" ? "notice_read" : "document_download",
      createdAt: String(row.created_at),
    })),
    noticeReadRows: (noticeReadsResult.data ?? []).map((row) => ({
      userId: String(row.user_id),
      noticeId: String(row.notice_id),
      readAt: String(row.read_at),
    })),
    noticeDepartmentByUserId,
    activeNoticeCount: (noticesResult.data ?? []).length,
    loadError:
      possibleErrors.length > 0
        ? "Parte da telemetria nao pode ser carregada. Verifique acesso ao schema e views de analytics."
        : null,
  });
}

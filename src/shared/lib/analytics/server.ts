import { createAdminSupabaseClient } from "@/shared/lib/supabase/admin";
import { getSupabaseEnv } from "@/shared/lib/supabase/env";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";
import type { AnalyticsDeviceType, AnalyticsTrackedEventName } from "@/shared/types/analytics";
import { inferDeviceType, normalizeAnalyticsPath } from "@/shared/lib/analytics/shared";
import type { ViewerContext } from "@/shared/types/hub";

type HubClient = {
  from: (table: string) => any;
};

async function createAnalyticsHubClient(): Promise<HubClient | null> {
  const adminSupabase = createAdminSupabaseClient();

  if (adminSupabase) {
    return adminSupabase.schema(getSupabaseEnv().schema);
  }

  const supabase = await createServerSupabaseClient();
  return supabase?.schema(getSupabaseEnv().schema) ?? null;
}

function sanitizeDepartmentIds(departmentIds: string[]) {
  return departmentIds.filter(Boolean);
}

export async function touchAnalyticsSession(input: {
  sessionId: string;
  viewer: ViewerContext;
  path: string;
  entryPath?: string | null;
  deviceType?: AnalyticsDeviceType | null;
  userAgent?: string | null;
}) {
  const hub = await createAnalyticsHubClient();

  if (!hub) {
    return;
  }

  const sessionId = input.sessionId.trim();

  if (!sessionId) {
    return;
  }

  const normalizedPath = normalizeAnalyticsPath(input.path);
  const existing = await hub
    .from("hub_analytics_sessions")
    .select("session_id")
    .eq("session_id", sessionId)
    .maybeSingle();

  const payload = {
    user_id: input.viewer.userId,
    department_ids: sanitizeDepartmentIds(input.viewer.departmentIds),
    device_type:
      input.deviceType ??
      inferDeviceType(input.userAgent?.trim() ?? ""),
    user_agent: input.userAgent?.trim() || null,
    last_seen_at: new Date().toISOString(),
  };

  if (existing.data) {
    await hub
      .from("hub_analytics_sessions")
      .update(payload)
      .eq("session_id", sessionId);
    return;
  }

  await hub.from("hub_analytics_sessions").insert({
    session_id: sessionId,
    entry_path: normalizeAnalyticsPath(input.entryPath ?? normalizedPath),
    ...payload,
  });
}

export async function recordAnalyticsEvent(input: {
  sessionId?: string | null;
  viewer: ViewerContext;
  eventName: AnalyticsTrackedEventName;
  path: string;
  entryPath?: string | null;
  targetType?: string | null;
  targetKey?: string | null;
  targetLabel?: string | null;
  metadata?: Record<string, unknown>;
  deviceType?: AnalyticsDeviceType | null;
  userAgent?: string | null;
}) {
  const sessionId = input.sessionId?.trim();

  if (!sessionId) {
    return;
  }

  const hub = await createAnalyticsHubClient();

  if (!hub) {
    return;
  }

  await touchAnalyticsSession({
    sessionId,
    viewer: input.viewer,
    path: input.path,
    entryPath: input.entryPath,
    deviceType: input.deviceType,
    userAgent: input.userAgent,
  });

  await hub.from("hub_analytics_events").insert({
    session_id: sessionId,
    user_id: input.viewer.userId,
    event_name: input.eventName,
    path: normalizeAnalyticsPath(input.path),
    target_type: input.targetType?.trim() || null,
    target_key: input.targetKey?.trim() || null,
    target_label: input.targetLabel?.trim() || null,
    metadata: input.metadata ?? {},
  });
}

export async function recordAnalyticsPerformanceSample(input: {
  sessionId: string;
  viewer: ViewerContext;
  path: string;
  pageLoadMs?: number | null;
  ttfbMs?: number | null;
  fcpMs?: number | null;
  lcpMs?: number | null;
  inpMs?: number | null;
  cls?: number | null;
  deviceType?: AnalyticsDeviceType | null;
  userAgent?: string | null;
}) {
  const sessionId = input.sessionId.trim();

  if (!sessionId) {
    return;
  }

  const hub = await createAnalyticsHubClient();

  if (!hub) {
    return;
  }

  await touchAnalyticsSession({
    sessionId,
    viewer: input.viewer,
    path: input.path,
    deviceType: input.deviceType,
    userAgent: input.userAgent,
  });

  await hub.from("hub_analytics_page_loads").insert({
    session_id: sessionId,
    user_id: input.viewer.userId,
    path: normalizeAnalyticsPath(input.path),
    page_load_ms: input.pageLoadMs ?? null,
    ttfb_ms: input.ttfbMs ?? null,
    fcp_ms: input.fcpMs ?? null,
    lcp_ms: input.lcpMs ?? null,
    inp_ms: input.inpMs ?? null,
    cls: input.cls ?? null,
  });
}

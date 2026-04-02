"use client";

import type {
  AnalyticsDeviceType,
  AnalyticsIngestPayload,
} from "@/shared/types/analytics";
import {
  ANALYTICS_PERFORMANCE_STORAGE_KEY,
  ANALYTICS_SESSION_STORAGE_KEY,
  ANALYTICS_SESSION_TIMEOUT_MS,
  inferDeviceType,
  normalizeAnalyticsPath,
} from "@/shared/lib/analytics/shared";

export interface StoredAnalyticsSession {
  sessionId: string;
  startedAt: string;
  lastSeenAt: string;
  entryPath: string;
  deviceType: AnalyticsDeviceType;
}

export function resolveAnalyticsSessionState(
  current: StoredAnalyticsSession | null,
  nowMs: number,
  path: string,
  deviceType: AnalyticsDeviceType
) {
  if (current) {
    const lastSeenMs = Date.parse(current.lastSeenAt);

    if (Number.isFinite(lastSeenMs) && nowMs - lastSeenMs < ANALYTICS_SESSION_TIMEOUT_MS) {
      return {
        session: {
          ...current,
          lastSeenAt: new Date(nowMs).toISOString(),
          deviceType,
        },
        isNew: false,
      };
    }
  }

  const now = new Date(nowMs).toISOString();

  return {
    session: {
      sessionId: crypto.randomUUID(),
      startedAt: now,
      lastSeenAt: now,
      entryPath: normalizeAnalyticsPath(path),
      deviceType,
    },
    isNew: true,
  };
}

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function readStoredSession() {
  if (!isBrowser()) {
    return null;
  }

  return safeJsonParse<StoredAnalyticsSession>(
    localStorage.getItem(ANALYTICS_SESSION_STORAGE_KEY)
  );
}

function persistSession(session: StoredAnalyticsSession) {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(ANALYTICS_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function getAnalyticsDeviceType() {
  if (typeof navigator === "undefined") {
    return "unknown" as AnalyticsDeviceType;
  }

  return inferDeviceType(navigator.userAgent);
}

export function getOrCreateAnalyticsSession(path: string) {
  const next = resolveAnalyticsSessionState(
    readStoredSession(),
    Date.now(),
    path,
    getAnalyticsDeviceType()
  );

  persistSession(next.session);
  return next;
}

export function getAnalyticsSessionId(path = "/hub") {
  return getOrCreateAnalyticsSession(path).session.sessionId;
}

function sendPayload(payload: AnalyticsIngestPayload) {
  const body = JSON.stringify(payload);

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" });

    if (navigator.sendBeacon("/api/analytics/ingest", blob)) {
      return;
    }
  }

  void fetch("/api/analytics/ingest", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body,
    credentials: "same-origin",
    keepalive: true,
  });
}

export function trackPageView(path: string) {
  const normalizedPath = normalizeAnalyticsPath(path);
  const { session, isNew } = getOrCreateAnalyticsSession(normalizedPath);

  sendPayload({
    type: "page_view",
    sessionId: session.sessionId,
    path: normalizedPath,
    entryPath: isNew ? session.entryPath : null,
    deviceType: session.deviceType,
    userAgent: typeof navigator === "undefined" ? null : navigator.userAgent,
  });

  return session;
}

export function trackSystemClick(input: {
  path: string;
  targetKey: string;
  targetLabel: string;
  targetType: "registered_system" | "legacy_system";
}) {
  const normalizedPath = normalizeAnalyticsPath(input.path);
  const { session } = getOrCreateAnalyticsSession(normalizedPath);

  sendPayload({
    type: "system_click",
    sessionId: session.sessionId,
    path: normalizedPath,
    targetKey: input.targetKey,
    targetLabel: input.targetLabel,
    targetType: input.targetType,
    deviceType: session.deviceType,
    userAgent: typeof navigator === "undefined" ? null : navigator.userAgent,
  });

  return session.sessionId;
}

function markPerformanceSent(path: string) {
  if (!isBrowser()) {
    return;
  }

  sessionStorage.setItem(`${ANALYTICS_PERFORMANCE_STORAGE_KEY}:${path}`, "sent");
}

function hasSentPerformance(path: string) {
  if (!isBrowser()) {
    return false;
  }

  return (
    sessionStorage.getItem(`${ANALYTICS_PERFORMANCE_STORAGE_KEY}:${path}`) === "sent"
  );
}

export function trackPerformanceSample(path: string) {
  if (typeof window === "undefined" || hasSentPerformance(path)) {
    return;
  }

  const normalizedPath = normalizeAnalyticsPath(path);
  const { session } = getOrCreateAnalyticsSession(normalizedPath);
  const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;

  if (!navigation) {
    return;
  }

  const paintEntries = performance.getEntriesByType("paint");
  const fcpEntry = paintEntries.find((entry) => entry.name === "first-contentful-paint");
  let lcpMs: number | null = null;
  let cls = 0;
  let inpMs: number | null = null;

  try {
    const lcpEntries = performance.getEntriesByType("largest-contentful-paint");
    const latestLcp = lcpEntries[lcpEntries.length - 1];
    lcpMs = latestLcp ? Math.round(latestLcp.startTime) : null;
  } catch {
    lcpMs = null;
  }

  try {
    const layoutShiftEntries = performance.getEntriesByType("layout-shift") as Array<
      PerformanceEntry & { value?: number; hadRecentInput?: boolean }
    >;
    cls = Number(
      layoutShiftEntries
        .filter((entry) => entry.hadRecentInput !== true)
        .reduce((total, entry) => total + Number(entry.value ?? 0), 0)
        .toFixed(4)
    );
  } catch {
    cls = 0;
  }

  try {
    const eventEntries = performance.getEntriesByType("event") as Array<
      PerformanceEntry & { duration?: number; interactionId?: number }
    >;
    const candidates = eventEntries
      .map((entry) => Math.round(Number(entry.duration ?? 0)))
      .filter((value) => value > 0);
    inpMs = candidates.length > 0 ? Math.max(...candidates) : null;
  } catch {
    inpMs = null;
  }

  sendPayload({
    type: "performance_sample",
    sessionId: session.sessionId,
    path: normalizedPath,
    pageLoadMs: Math.round(navigation.duration),
    ttfbMs: Math.round(navigation.responseStart - navigation.requestStart),
    fcpMs: fcpEntry ? Math.round(fcpEntry.startTime) : null,
    lcpMs,
    inpMs,
    cls,
    deviceType: session.deviceType,
    userAgent: typeof navigator === "undefined" ? null : navigator.userAgent,
  });

  markPerformanceSent(normalizedPath);
}


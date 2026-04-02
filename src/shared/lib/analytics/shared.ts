import type {
  AnalyticsDeviceType,
  AnalyticsTrackedEventName,
} from "@/shared/types/analytics";

export const ANALYTICS_SESSION_STORAGE_KEY = "hub-flexibase.analytics.session";
export const ANALYTICS_PERFORMANCE_STORAGE_KEY = "hub-flexibase.analytics.performance";
export const ANALYTICS_SESSION_TIMEOUT_MS = 30 * 60 * 1000;

export const ANALYTICS_EVENT_NAMES = [
  "page_view",
  "system_click",
  "document_download",
  "notice_read",
] as const satisfies readonly AnalyticsTrackedEventName[];

export function normalizeAnalyticsPath(path: string) {
  const trimmed = path.trim();

  if (!trimmed) {
    return "/hub";
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  return `/${trimmed}`;
}

export function inferDeviceType(userAgent: string) {
  const normalized = userAgent.toLowerCase();

  if (!normalized) {
    return "unknown" as AnalyticsDeviceType;
  }

  if (normalized.includes("bot") || normalized.includes("crawler") || normalized.includes("spider")) {
    return "bot" as AnalyticsDeviceType;
  }

  if (normalized.includes("ipad") || normalized.includes("tablet")) {
    return "tablet" as AnalyticsDeviceType;
  }

  if (
    normalized.includes("iphone") ||
    normalized.includes("android") ||
    normalized.includes("mobile")
  ) {
    return "mobile" as AnalyticsDeviceType;
  }

  return "desktop" as AnalyticsDeviceType;
}


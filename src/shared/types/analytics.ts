export const ANALYTICS_PERIOD_OPTIONS = [7, 30, 90] as const;

export type AnalyticsPeriodDays = (typeof ANALYTICS_PERIOD_OPTIONS)[number];

export const ANALYTICS_DEVICE_TYPES = [
  "desktop",
  "mobile",
  "tablet",
  "bot",
  "unknown",
] as const;

export type AnalyticsDeviceType = (typeof ANALYTICS_DEVICE_TYPES)[number];

export type AnalyticsTrackedEventName =
  | "page_view"
  | "system_click"
  | "document_download"
  | "notice_read";

export type AnalyticsIngestPayload =
  | {
      type: "page_view";
      sessionId: string;
      path: string;
      entryPath?: string | null;
      deviceType: AnalyticsDeviceType;
      userAgent?: string | null;
    }
  | {
      type: "system_click";
      sessionId: string;
      path: string;
      targetType: "registered_system" | "legacy_system";
      targetKey: string;
      targetLabel: string;
      deviceType: AnalyticsDeviceType;
      userAgent?: string | null;
    }
  | {
      type: "performance_sample";
      sessionId: string;
      path: string;
      pageLoadMs?: number | null;
      ttfbMs?: number | null;
      fcpMs?: number | null;
      lcpMs?: number | null;
      inpMs?: number | null;
      cls?: number | null;
      deviceType: AnalyticsDeviceType;
      userAgent?: string | null;
    };

export interface AdminUsageKpi {
  id:
    | "unique-users"
    | "sessions"
    | "system-clicks"
    | "avg-load"
    | "p95-load"
    | "no-action-rate";
  label: string;
  value: string;
  hint: string;
}

export interface AdminUsageTrendPoint {
  day: string;
  label: string;
  uniqueUsers: number;
  sessions: number;
  systemClicks: number;
  avgLoadMs: number | null;
}

export interface AdminDepartmentShareRow {
  departmentId: string;
  label: string;
  sessions: number;
  uniqueUsers: number;
}

export interface AdminSystemRankingRow {
  targetKey: string;
  label: string;
  clicks: number;
  uniqueUsers: number;
  avgClicksPerUser: number;
}

export interface AdminDormantSystemRow {
  systemId: string;
  label: string;
}

export interface AdminPerformanceRow {
  path: string;
  avgLoadMs: number | null;
  p95LoadMs: number | null;
  samples: number;
  slowSampleRate: number;
}

export interface AdminPageActionRow {
  path: string;
  views: number;
  followUpActionRate: number;
}

export interface AdminUsageDashboardData {
  selectedPeriodDays: AnalyticsPeriodDays;
  selectedDepartmentId: string | null;
  availableDepartments: Array<{
    id: string;
    name: string;
  }>;
  generatedAt: string;
  kpis: AdminUsageKpi[];
  trend: AdminUsageTrendPoint[];
  departmentShare: AdminDepartmentShareRow[];
  systemRanking: AdminSystemRankingRow[];
  dormantSystems: AdminDormantSystemRow[];
  performanceRows: AdminPerformanceRow[];
  lowActionPages: AdminPageActionRow[];
  content: {
    documentDownloads: number;
    noticeReads: number;
    noticeReadRate: number;
  };
  quality: {
    returnRate: number;
    slowSessionRate: number;
    medianFirstClickMs: number | null;
    noActionRate: number;
  };
  loadError: string | null;
}


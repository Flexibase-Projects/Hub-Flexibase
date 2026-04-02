import {
  ANALYTICS_PERIOD_OPTIONS,
  type AdminDepartmentShareRow,
  type AdminDormantSystemRow,
  type AdminPageActionRow,
  type AdminPerformanceRow,
  type AdminSystemRankingRow,
  type AdminUsageDashboardData,
  type AdminUsageKpi,
  type AdminUsageTrendPoint,
  type AnalyticsPeriodDays,
} from "@/shared/types/analytics";
import type { HubDepartment, HubSystemLink } from "@/shared/types/hub";

export interface AdminSessionSummaryRow {
  sessionId: string;
  userId: string;
  departmentIds: string[];
  startedAt: string;
  activityDay: string;
  systemClickCount: number;
  documentDownloadCount: number;
  noticeReadCount: number;
  avgPageLoadMs: number | null;
  pageViewCount: number;
  hadAction: boolean;
  isReturningUser: boolean;
  isSlowSession: boolean;
  firstSystemClickAfterMs: number | null;
}

export interface AdminSystemClickRow {
  sessionId: string;
  userId: string;
  departmentIds: string[];
  targetKey: string;
  targetLabel: string;
  createdAt: string;
}

export interface AdminPageLoadSampleRow {
  sessionId: string;
  departmentIds: string[];
  path: string;
  createdAt: string;
  pageLoadMs: number | null;
}

export interface AdminPageViewRow {
  sessionId: string;
  departmentIds: string[];
  path: string;
  createdAt: string;
  hadFollowUpAction: boolean;
}

export interface AdminContentEventRow {
  userId: string;
  departmentIds: string[];
  eventName: "document_download" | "notice_read";
  createdAt: string;
}

export interface AdminNoticeReadRow {
  userId: string;
  noticeId: string;
  readAt: string;
}

export interface BuildAdminUsageDashboardInput {
  now: Date;
  periodDays: AnalyticsPeriodDays;
  selectedDepartmentId: string | null;
  departments: Pick<HubDepartment, "id" | "name">[];
  systems: Pick<HubSystemLink, "id" | "title" | "isActive">[];
  sessionRows: AdminSessionSummaryRow[];
  systemClickRows: AdminSystemClickRow[];
  pageLoadRows: AdminPageLoadSampleRow[];
  pageViewRows: AdminPageViewRow[];
  contentRows: AdminContentEventRow[];
  noticeReadRows: AdminNoticeReadRow[];
  noticeDepartmentByUserId: Map<string, string[]>;
  activeNoticeCount: number;
  loadError?: string | null;
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function formatCount(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatPercent(value: number) {
  return `${round(value * 100, 1).toLocaleString("pt-BR")} %`;
}

function formatDuration(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "Sem dados";
  }

  if (value >= 1000) {
    return `${round(value / 1000, 2).toLocaleString("pt-BR")} s`;
  }

  return `${Math.round(value).toLocaleString("pt-BR")} ms`;
}

function toSaoPauloDateKey(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function toTrendLabel(day: string) {
  const [year, month, date] = day.split("-");

  return `${date}/${month}`;
}

function buildPeriodKeys(periodDays: AnalyticsPeriodDays, now: Date) {
  const keys: string[] = [];

  for (let offset = periodDays - 1; offset >= 0; offset -= 1) {
    const current = new Date(now);
    current.setDate(current.getDate() - offset);
    keys.push(toSaoPauloDateKey(current));
  }

  return keys;
}

function clampRate(value: number) {
  return Math.max(0, Math.min(1, value));
}

function percentile(values: number[], ratio: number) {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * ratio) - 1));
  return sorted[index] ?? null;
}

function median(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return round(((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2, 0);
  }

  return sorted[middle] ?? null;
}

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return round(values.reduce((total, value) => total + value, 0) / values.length, 2);
}

function includesDepartment(departmentIds: string[], selectedDepartmentId: string | null) {
  if (!selectedDepartmentId) {
    return true;
  }

  return departmentIds.includes(selectedDepartmentId);
}

function countUniqueUsers<T extends { userId: string }>(rows: T[]) {
  return new Set(rows.map((row) => row.userId)).size;
}

function buildTrend(
  periodDays: AnalyticsPeriodDays,
  now: Date,
  sessionRows: AdminSessionSummaryRow[]
) {
  const days = buildPeriodKeys(periodDays, now);
  const byDay = new Map<
    string,
    {
      uniqueUsers: Set<string>;
      sessions: number;
      systemClicks: number;
      loadValues: number[];
    }
  >();

  days.forEach((day) => {
    byDay.set(day, {
      uniqueUsers: new Set<string>(),
      sessions: 0,
      systemClicks: 0,
      loadValues: [],
    });
  });

  sessionRows.forEach((row) => {
    const bucket = byDay.get(row.activityDay);

    if (!bucket) {
      return;
    }

    bucket.uniqueUsers.add(row.userId);
    bucket.sessions += 1;
    bucket.systemClicks += row.systemClickCount;

    if (row.avgPageLoadMs !== null) {
      bucket.loadValues.push(row.avgPageLoadMs);
    }
  });

  return days.map<AdminUsageTrendPoint>((day) => {
    const bucket = byDay.get(day);

    return {
      day,
      label: toTrendLabel(day),
      uniqueUsers: bucket?.uniqueUsers.size ?? 0,
      sessions: bucket?.sessions ?? 0,
      systemClicks: bucket?.systemClicks ?? 0,
      avgLoadMs: average(bucket?.loadValues ?? []),
    };
  });
}

function buildDepartmentShare(
  departments: Pick<HubDepartment, "id" | "name">[],
  sessionRows: AdminSessionSummaryRow[]
) {
  const byDepartment = new Map<
    string,
    {
      label: string;
      sessions: number;
      users: Set<string>;
    }
  >();

  departments.forEach((department) => {
    byDepartment.set(department.id, {
      label: department.name,
      sessions: 0,
      users: new Set<string>(),
    });
  });

  sessionRows.forEach((row) => {
    row.departmentIds.forEach((departmentId) => {
      const bucket = byDepartment.get(departmentId);

      if (!bucket) {
        return;
      }

      bucket.sessions += 1;
      bucket.users.add(row.userId);
    });
  });

  return [...byDepartment.entries()]
    .map<AdminDepartmentShareRow>(([departmentId, bucket]) => ({
      departmentId,
      label: bucket.label,
      sessions: bucket.sessions,
      uniqueUsers: bucket.users.size,
    }))
    .filter((row) => row.sessions > 0)
    .sort((left, right) => right.sessions - left.sessions)
    .slice(0, 6);
}

function buildSystemRanking(systemClickRows: AdminSystemClickRow[]) {
  const bySystem = new Map<
    string,
    {
      label: string;
      clicks: number;
      users: Set<string>;
    }
  >();

  systemClickRows.forEach((row) => {
    const current = bySystem.get(row.targetKey) ?? {
      label: row.targetLabel,
      clicks: 0,
      users: new Set<string>(),
    };

    current.clicks += 1;
    current.users.add(row.userId);
    bySystem.set(row.targetKey, current);
  });

  return [...bySystem.entries()]
    .map<AdminSystemRankingRow>(([targetKey, bucket]) => ({
      targetKey,
      label: bucket.label,
      clicks: bucket.clicks,
      uniqueUsers: bucket.users.size,
      avgClicksPerUser:
        bucket.users.size > 0 ? round(bucket.clicks / bucket.users.size, 2) : 0,
    }))
    .sort((left, right) => right.clicks - left.clicks)
    .slice(0, 8);
}

function buildDormantSystems(
  systems: Pick<HubSystemLink, "id" | "title" | "isActive">[],
  systemRanking: AdminSystemRankingRow[]
) {
  const clickedKeys = new Set(systemRanking.map((row) => row.targetKey));

  return systems
    .filter((system) => system.isActive)
    .filter((system) => !clickedKeys.has(system.id))
    .map<AdminDormantSystemRow>((system) => ({
      systemId: system.id,
      label: system.title,
    }))
    .slice(0, 6);
}

function buildPerformanceRows(pageLoadRows: AdminPageLoadSampleRow[]) {
  const byPath = new Map<
    string,
    {
      values: number[];
      slowCount: number;
    }
  >();

  pageLoadRows.forEach((row) => {
    if (row.pageLoadMs === null) {
      return;
    }

    const current = byPath.get(row.path) ?? {
      values: [],
      slowCount: 0,
    };

    current.values.push(row.pageLoadMs);

    if (row.pageLoadMs >= 4000) {
      current.slowCount += 1;
    }

    byPath.set(row.path, current);
  });

  return [...byPath.entries()]
    .map<AdminPerformanceRow>(([path, bucket]) => ({
      path,
      avgLoadMs: average(bucket.values),
      p95LoadMs: percentile(bucket.values, 0.95),
      samples: bucket.values.length,
      slowSampleRate:
        bucket.values.length > 0 ? round(bucket.slowCount / bucket.values.length, 4) : 0,
    }))
    .sort((left, right) => {
      const rightScore = right.p95LoadMs ?? right.avgLoadMs ?? 0;
      const leftScore = left.p95LoadMs ?? left.avgLoadMs ?? 0;
      return rightScore - leftScore;
    })
    .slice(0, 6);
}

function buildLowActionPages(pageViewRows: AdminPageViewRow[]) {
  const byPath = new Map<
    string,
    {
      views: number;
      followUps: number;
    }
  >();

  pageViewRows.forEach((row) => {
    const current = byPath.get(row.path) ?? {
      views: 0,
      followUps: 0,
    };

    current.views += 1;

    if (row.hadFollowUpAction) {
      current.followUps += 1;
    }

    byPath.set(row.path, current);
  });

  return [...byPath.entries()]
    .map<AdminPageActionRow>(([path, bucket]) => ({
      path,
      views: bucket.views,
      followUpActionRate:
        bucket.views > 0 ? round(bucket.followUps / bucket.views, 4) : 0,
    }))
    .filter((row) => row.views >= 2)
    .sort((left, right) => {
      if (left.followUpActionRate === right.followUpActionRate) {
        return right.views - left.views;
      }

      return left.followUpActionRate - right.followUpActionRate;
    })
    .slice(0, 6);
}

function buildKpis(input: {
  sessionRows: AdminSessionSummaryRow[];
  pageLoadRows: AdminPageLoadSampleRow[];
  quality: {
    noActionRate: number;
  };
}) {
  const uniqueUsers = countUniqueUsers(input.sessionRows);
  const sessions = input.sessionRows.length;
  const systemClicks = input.sessionRows.reduce(
    (total, row) => total + row.systemClickCount,
    0
  );
  const loadValues = input.pageLoadRows
    .map((row) => row.pageLoadMs)
    .filter((value): value is number => value !== null);
  const avgLoad = average(loadValues);
  const p95Load = percentile(loadValues, 0.95);

  return [
    {
      id: "unique-users",
      label: "Usuarios unicos",
      value: formatCount(uniqueUsers),
      hint: "Pessoas distintas que navegaram no periodo.",
    },
    {
      id: "sessions",
      label: "Sessoes",
      value: formatCount(sessions),
      hint: "Sessao nova apos 30 minutos sem atividade.",
    },
    {
      id: "system-clicks",
      label: "Cliques em sistemas",
      value: formatCount(systemClicks),
      hint: "Saidas do HUB para sistemas externos.",
    },
    {
      id: "avg-load",
      label: "Carga media",
      value: formatDuration(avgLoad),
      hint: "Media das amostras de carregamento registradas.",
    },
    {
      id: "p95-load",
      label: "Carga p95",
      value: formatDuration(p95Load),
      hint: "Faixa critica percebida por 5% das sessoes mais lentas.",
    },
    {
      id: "no-action-rate",
      label: "Sessoes sem acao",
      value: formatPercent(input.quality.noActionRate),
      hint: "Sessao com page views mas sem clique, download ou leitura.",
    },
  ] satisfies AdminUsageKpi[];
}

export function parseAnalyticsPeriodDays(value: string | string[] | undefined) {
  if (typeof value !== "string") {
    return 30 as AnalyticsPeriodDays;
  }

  const parsed = Number(value);

  if (ANALYTICS_PERIOD_OPTIONS.includes(parsed as AnalyticsPeriodDays)) {
    return parsed as AnalyticsPeriodDays;
  }

  return 30 as AnalyticsPeriodDays;
}

export function buildAdminUsageDashboardData(
  input: BuildAdminUsageDashboardInput
): AdminUsageDashboardData {
  const filteredSessionRows = input.sessionRows.filter((row) =>
    includesDepartment(row.departmentIds, input.selectedDepartmentId)
  );
  const filteredSystemClickRows = input.systemClickRows.filter((row) =>
    includesDepartment(row.departmentIds, input.selectedDepartmentId)
  );
  const filteredPageLoadRows = input.pageLoadRows.filter((row) =>
    includesDepartment(row.departmentIds, input.selectedDepartmentId)
  );
  const filteredPageViewRows = input.pageViewRows.filter((row) =>
    includesDepartment(row.departmentIds, input.selectedDepartmentId)
  );
  const filteredContentRows = input.contentRows.filter((row) =>
    includesDepartment(row.departmentIds, input.selectedDepartmentId)
  );

  const filteredNoticeReadRows = input.noticeReadRows.filter((row) => {
    if (!input.selectedDepartmentId) {
      return true;
    }

    return (
      input.noticeDepartmentByUserId.get(row.userId)?.includes(input.selectedDepartmentId) ??
      false
    );
  });

  const returnRate =
    filteredSessionRows.length > 0
      ? clampRate(
          filteredSessionRows.filter((row) => row.isReturningUser).length /
            filteredSessionRows.length
        )
      : 0;
  const slowSessionRate =
    filteredSessionRows.length > 0
      ? clampRate(
          filteredSessionRows.filter((row) => row.isSlowSession).length /
            filteredSessionRows.length
        )
      : 0;
  const noActionRate =
    filteredSessionRows.length > 0
      ? clampRate(
          filteredSessionRows.filter((row) => !row.hadAction).length /
            filteredSessionRows.length
        )
      : 0;
  const medianFirstClickMs = median(
    filteredSessionRows
      .map((row) => row.firstSystemClickAfterMs)
      .filter((value): value is number => value !== null)
  );

  const uniqueNoticeReaders = countUniqueUsers(
    filteredNoticeReadRows.map((row) => ({ userId: row.userId }))
  );
  const noticeReadRate =
    input.activeNoticeCount > 0 && uniqueNoticeReaders > 0
      ? clampRate(filteredNoticeReadRows.length / (input.activeNoticeCount * uniqueNoticeReaders))
      : 0;

  const systemRanking = buildSystemRanking(filteredSystemClickRows);

  const quality = {
    returnRate,
    slowSessionRate,
    medianFirstClickMs,
    noActionRate,
  };

  return {
    selectedPeriodDays: input.periodDays,
    selectedDepartmentId: input.selectedDepartmentId,
    availableDepartments: input.departments.map((department) => ({
      id: department.id,
      name: department.name,
    })),
    generatedAt: input.now.toISOString(),
    kpis: buildKpis({
      sessionRows: filteredSessionRows,
      pageLoadRows: filteredPageLoadRows,
      quality,
    }),
    trend: buildTrend(input.periodDays, input.now, filteredSessionRows),
    departmentShare: buildDepartmentShare(input.departments, filteredSessionRows),
    systemRanking,
    dormantSystems: buildDormantSystems(input.systems, systemRanking),
    performanceRows: buildPerformanceRows(filteredPageLoadRows),
    lowActionPages: buildLowActionPages(filteredPageViewRows),
    content: {
      documentDownloads: filteredContentRows.filter(
        (row) => row.eventName === "document_download"
      ).length,
      noticeReads: filteredNoticeReadRows.length,
      noticeReadRate,
    },
    quality,
    loadError: input.loadError ?? null,
  };
}

import { describe, expect, it } from "vitest";

import { buildAdminUsageDashboardData } from "@/modules/admin/usage";

describe("buildAdminUsageDashboardData", () => {
  it("builds KPIs and quality metrics from usage rows", () => {
    const data = buildAdminUsageDashboardData({
      now: new Date("2026-04-02T12:00:00.000Z"),
      periodDays: 7,
      selectedDepartmentId: null,
      departments: [
        { id: "dep-a", name: "Comercial" },
        { id: "dep-b", name: "Operacoes" },
      ],
      systems: [
        { id: "sys-a", title: "CRM", isActive: true },
        { id: "sys-b", title: "Projetos", isActive: true },
      ],
      sessionRows: [
        {
          sessionId: "session-1",
          userId: "user-1",
          departmentIds: ["dep-a"],
          startedAt: "2026-03-30T11:00:00.000Z",
          activityDay: "2026-03-30",
          systemClickCount: 1,
          documentDownloadCount: 1,
          noticeReadCount: 0,
          avgPageLoadMs: 2000,
          pageViewCount: 2,
          hadAction: true,
          isReturningUser: false,
          isSlowSession: false,
          firstSystemClickAfterMs: 1200,
        },
        {
          sessionId: "session-2",
          userId: "user-1",
          departmentIds: ["dep-a"],
          startedAt: "2026-04-01T11:00:00.000Z",
          activityDay: "2026-04-01",
          systemClickCount: 0,
          documentDownloadCount: 0,
          noticeReadCount: 0,
          avgPageLoadMs: 6000,
          pageViewCount: 1,
          hadAction: false,
          isReturningUser: true,
          isSlowSession: true,
          firstSystemClickAfterMs: null,
        },
        {
          sessionId: "session-3",
          userId: "user-2",
          departmentIds: ["dep-b"],
          startedAt: "2026-04-02T11:00:00.000Z",
          activityDay: "2026-04-02",
          systemClickCount: 2,
          documentDownloadCount: 0,
          noticeReadCount: 1,
          avgPageLoadMs: 3000,
          pageViewCount: 3,
          hadAction: true,
          isReturningUser: false,
          isSlowSession: false,
          firstSystemClickAfterMs: 800,
        },
      ],
      systemClickRows: [
        {
          sessionId: "session-1",
          userId: "user-1",
          departmentIds: ["dep-a"],
          targetKey: "sys-a",
          targetLabel: "CRM",
          createdAt: "2026-03-30T11:00:10.000Z",
        },
        {
          sessionId: "session-3",
          userId: "user-2",
          departmentIds: ["dep-b"],
          targetKey: "sys-b",
          targetLabel: "Projetos",
          createdAt: "2026-04-02T11:00:10.000Z",
        },
        {
          sessionId: "session-3",
          userId: "user-2",
          departmentIds: ["dep-b"],
          targetKey: "sys-b",
          targetLabel: "Projetos",
          createdAt: "2026-04-02T11:01:10.000Z",
        },
      ],
      pageLoadRows: [
        {
          sessionId: "session-1",
          departmentIds: ["dep-a"],
          path: "/hub",
          createdAt: "2026-03-30T11:00:00.000Z",
          pageLoadMs: 2000,
        },
        {
          sessionId: "session-2",
          departmentIds: ["dep-a"],
          path: "/hub",
          createdAt: "2026-04-01T11:00:00.000Z",
          pageLoadMs: 6000,
        },
        {
          sessionId: "session-3",
          departmentIds: ["dep-b"],
          path: "/admin/dashboard",
          createdAt: "2026-04-02T11:00:00.000Z",
          pageLoadMs: 3000,
        },
      ],
      pageViewRows: [
        {
          sessionId: "session-1",
          departmentIds: ["dep-a"],
          path: "/hub",
          createdAt: "2026-03-30T11:00:00.000Z",
          hadFollowUpAction: true,
        },
        {
          sessionId: "session-2",
          departmentIds: ["dep-a"],
          path: "/hub",
          createdAt: "2026-04-01T11:00:00.000Z",
          hadFollowUpAction: false,
        },
        {
          sessionId: "session-3",
          departmentIds: ["dep-b"],
          path: "/admin/dashboard",
          createdAt: "2026-04-02T11:00:00.000Z",
          hadFollowUpAction: false,
        },
        {
          sessionId: "session-3",
          departmentIds: ["dep-b"],
          path: "/admin/dashboard",
          createdAt: "2026-04-02T11:02:00.000Z",
          hadFollowUpAction: false,
        },
      ],
      contentRows: [
        {
          userId: "user-1",
          departmentIds: ["dep-a"],
          eventName: "document_download",
          createdAt: "2026-03-30T11:00:20.000Z",
        },
        {
          userId: "user-2",
          departmentIds: ["dep-b"],
          eventName: "notice_read",
          createdAt: "2026-04-02T11:00:40.000Z",
        },
      ],
      noticeReadRows: [
        {
          userId: "user-2",
          noticeId: "notice-1",
          readAt: "2026-04-02T11:00:40.000Z",
        },
      ],
      noticeDepartmentByUserId: new Map([
        ["user-1", ["dep-a"]],
        ["user-2", ["dep-b"]],
      ]),
      activeNoticeCount: 2,
      loadError: null,
    });

    expect(data.kpis[0]?.value).toBe("2");
    expect(data.kpis[1]?.value).toBe("3");
    expect(data.kpis[2]?.value).toBe("3");
    expect(data.quality.returnRate).toBeCloseTo(1 / 3);
    expect(data.quality.slowSessionRate).toBeCloseTo(1 / 3);
    expect(data.quality.noActionRate).toBeCloseTo(1 / 3);
    expect(data.quality.medianFirstClickMs).toBe(1000);
    expect(data.systemRanking[0]).toMatchObject({
      targetKey: "sys-b",
      clicks: 2,
      uniqueUsers: 1,
    });
    expect(data.performanceRows[0]?.path).toBe("/hub");
    expect(data.lowActionPages[0]).toMatchObject({
      path: "/admin/dashboard",
      views: 2,
    });
    expect(data.content.documentDownloads).toBe(1);
    expect(data.content.noticeReads).toBe(1);
    expect(data.content.noticeReadRate).toBeCloseTo(0.5);
  });

  it("filters the dashboard by department", () => {
    const data = buildAdminUsageDashboardData({
      now: new Date("2026-04-02T12:00:00.000Z"),
      periodDays: 7,
      selectedDepartmentId: "dep-a",
      departments: [
        { id: "dep-a", name: "Comercial" },
        { id: "dep-b", name: "Operacoes" },
      ],
      systems: [
        { id: "sys-a", title: "CRM", isActive: true },
        { id: "sys-b", title: "Projetos", isActive: true },
      ],
      sessionRows: [
        {
          sessionId: "session-1",
          userId: "user-1",
          departmentIds: ["dep-a"],
          startedAt: "2026-03-30T11:00:00.000Z",
          activityDay: "2026-03-30",
          systemClickCount: 1,
          documentDownloadCount: 0,
          noticeReadCount: 0,
          avgPageLoadMs: 2000,
          pageViewCount: 2,
          hadAction: true,
          isReturningUser: false,
          isSlowSession: false,
          firstSystemClickAfterMs: 1200,
        },
        {
          sessionId: "session-2",
          userId: "user-2",
          departmentIds: ["dep-b"],
          startedAt: "2026-04-01T11:00:00.000Z",
          activityDay: "2026-04-01",
          systemClickCount: 2,
          documentDownloadCount: 0,
          noticeReadCount: 1,
          avgPageLoadMs: 3000,
          pageViewCount: 3,
          hadAction: true,
          isReturningUser: false,
          isSlowSession: false,
          firstSystemClickAfterMs: 900,
        },
      ],
      systemClickRows: [
        {
          sessionId: "session-1",
          userId: "user-1",
          departmentIds: ["dep-a"],
          targetKey: "sys-a",
          targetLabel: "CRM",
          createdAt: "2026-03-30T11:00:10.000Z",
        },
        {
          sessionId: "session-2",
          userId: "user-2",
          departmentIds: ["dep-b"],
          targetKey: "sys-b",
          targetLabel: "Projetos",
          createdAt: "2026-04-01T11:00:10.000Z",
        },
      ],
      pageLoadRows: [
        {
          sessionId: "session-1",
          departmentIds: ["dep-a"],
          path: "/hub",
          createdAt: "2026-03-30T11:00:00.000Z",
          pageLoadMs: 2000,
        },
        {
          sessionId: "session-2",
          departmentIds: ["dep-b"],
          path: "/hub",
          createdAt: "2026-04-01T11:00:00.000Z",
          pageLoadMs: 3000,
        },
      ],
      pageViewRows: [
        {
          sessionId: "session-1",
          departmentIds: ["dep-a"],
          path: "/hub",
          createdAt: "2026-03-30T11:00:00.000Z",
          hadFollowUpAction: true,
        },
      ],
      contentRows: [],
      noticeReadRows: [],
      noticeDepartmentByUserId: new Map([["user-1", ["dep-a"]]]),
      activeNoticeCount: 1,
      loadError: null,
    });

    expect(data.kpis[0]?.value).toBe("1");
    expect(data.kpis[1]?.value).toBe("1");
    expect(data.systemRanking).toHaveLength(1);
    expect(data.systemRanking[0]?.targetKey).toBe("sys-a");
    expect(data.dormantSystems.map((row) => row.systemId)).toContain("sys-b");
  });
});

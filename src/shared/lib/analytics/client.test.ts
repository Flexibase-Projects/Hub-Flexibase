import { describe, expect, it, vi } from "vitest";

import {
  resolveAnalyticsSessionState,
  type StoredAnalyticsSession,
} from "@/shared/lib/analytics/client";
import { ANALYTICS_SESSION_TIMEOUT_MS } from "@/shared/lib/analytics/shared";

describe("analytics session rotation", () => {
  it("reuses the same session before inactivity timeout", () => {
    const current: StoredAnalyticsSession = {
      sessionId: "11111111-1111-1111-1111-111111111111",
      startedAt: "2026-04-01T12:00:00.000Z",
      lastSeenAt: "2026-04-01T12:20:00.000Z",
      entryPath: "/hub",
      deviceType: "desktop",
    };

    const { session, isNew } = resolveAnalyticsSessionState(
      current,
      Date.parse("2026-04-01T12:40:00.000Z"),
      "/hub",
      "mobile"
    );

    expect(isNew).toBe(false);
    expect(session.sessionId).toBe(current.sessionId);
    expect(session.deviceType).toBe("mobile");
    expect(session.entryPath).toBe("/hub");
  });

  it("rotates the session after 30 minutes without activity", () => {
    const spy = vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(
      "22222222-2222-2222-2222-222222222222"
    );

    const current: StoredAnalyticsSession = {
      sessionId: "11111111-1111-1111-1111-111111111111",
      startedAt: "2026-04-01T12:00:00.000Z",
      lastSeenAt: "2026-04-01T12:00:00.000Z",
      entryPath: "/hub",
      deviceType: "desktop",
    };

    const { session, isNew } = resolveAnalyticsSessionState(
      current,
      Date.parse("2026-04-01T12:00:00.000Z") + ANALYTICS_SESSION_TIMEOUT_MS + 1,
      "/admin/dashboard",
      "desktop"
    );

    expect(isNew).toBe(true);
    expect(session.sessionId).toBe("22222222-2222-2222-2222-222222222222");
    expect(session.entryPath).toBe("/admin/dashboard");

    spy.mockRestore();
  });
});

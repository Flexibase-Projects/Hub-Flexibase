import { NextResponse } from "next/server";

import { getViewerContext } from "@/modules/auth/server";
import {
  recordAnalyticsEvent,
  recordAnalyticsPerformanceSample,
} from "@/shared/lib/analytics/server";
import { analyticsIngestSchema } from "@/shared/schemas/analytics";

const INVALID_PAYLOAD_MESSAGE = "Payload de analytics invalido.";

export async function POST(request: Request) {
  const viewer = await getViewerContext();

  if (!viewer) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  let payload: unknown;

  try {
    const raw = await request.text();
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    return NextResponse.json({ error: INVALID_PAYLOAD_MESSAGE }, { status: 400 });
  }

  const parsed = analyticsIngestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: INVALID_PAYLOAD_MESSAGE }, { status: 400 });
  }

  const userAgent = parsed.data.userAgent ?? request.headers.get("user-agent");

  if (parsed.data.type === "performance_sample") {
    await recordAnalyticsPerformanceSample({
      sessionId: parsed.data.sessionId,
      viewer,
      path: parsed.data.path,
      pageLoadMs: parsed.data.pageLoadMs ?? null,
      ttfbMs: parsed.data.ttfbMs ?? null,
      fcpMs: parsed.data.fcpMs ?? null,
      lcpMs: parsed.data.lcpMs ?? null,
      inpMs: parsed.data.inpMs ?? null,
      cls: parsed.data.cls ?? null,
      deviceType: parsed.data.deviceType,
      userAgent,
    });

    return new NextResponse(null, { status: 204 });
  }

  if (parsed.data.type === "page_view") {
    await recordAnalyticsEvent({
      sessionId: parsed.data.sessionId,
      viewer,
      eventName: "page_view",
      path: parsed.data.path,
      entryPath: parsed.data.entryPath ?? null,
      metadata: parsed.data.entryPath ? { entryPath: parsed.data.entryPath } : {},
      deviceType: parsed.data.deviceType,
      userAgent,
    });

    return new NextResponse(null, { status: 204 });
  }

  await recordAnalyticsEvent({
    sessionId: parsed.data.sessionId,
    viewer,
    eventName: "system_click",
    path: parsed.data.path,
    targetType: parsed.data.targetType,
    targetKey: parsed.data.targetKey,
    targetLabel: parsed.data.targetLabel,
    deviceType: parsed.data.deviceType,
    userAgent,
  });

  return new NextResponse(null, { status: 204 });
}

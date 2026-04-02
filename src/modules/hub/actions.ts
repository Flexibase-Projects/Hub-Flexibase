"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { requireViewer } from "@/modules/auth/server";
import { recordAnalyticsEvent } from "@/shared/lib/analytics/server";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";
import { getSupabaseEnv } from "@/shared/lib/supabase/env";

function getNormalizedPath(pathname: FormDataEntryValue | null) {
  return typeof pathname === "string" && pathname.trim() ? pathname : "/hub";
}

function resolveNoticeIds(formData: FormData) {
  const singleIds = formData
    .getAll("noticeId")
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
  const rawIds = formData.get("noticeIds");

  if (typeof rawIds === "string" && rawIds.trim()) {
    try {
      const parsed = JSON.parse(rawIds) as unknown;

      if (Array.isArray(parsed)) {
        parsed.forEach((value) => {
          if (typeof value === "string" && value.trim()) {
            singleIds.push(value.trim());
          }
        });
      }
    } catch {
      rawIds
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
        .forEach((value) => singleIds.push(value));
    }
  }

  return [...new Set(singleIds)];
}

async function markNoticeReads(input: {
  formData: FormData;
  noticeIds: string[];
}) {
  const viewer = await requireViewer();
  const { formData, noticeIds } = input;

  if (noticeIds.length === 0) {
    return;
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return;
  }

  const hub = supabase.schema(getSupabaseEnv().schema);
  const pathname = getNormalizedPath(formData.get("pathname"));
  const sessionId = formData.get("sessionId");

  const { error } = await hub.from("hub_notice_reads").upsert(
    noticeIds.map((noticeId) => ({
      notice_id: noticeId,
      user_id: viewer.userId,
    })),
    {
      onConflict: "notice_id,user_id",
    }
  );

  if (error) {
    return;
  }

  if (typeof sessionId === "string" && sessionId.trim()) {
    await Promise.all(
      noticeIds.map((noticeId) =>
        recordAnalyticsEvent({
          sessionId,
          viewer,
          eventName: "notice_read",
          path: pathname,
          targetType: "notice",
          targetKey: noticeId,
          targetLabel: noticeId,
        })
      )
    );
  }

  revalidatePath("/hub");
  if (pathname !== "/hub") {
    revalidatePath(pathname);
  }
  revalidateTag("hub-content", "max");
}

export async function markNoticeReadAction(formData: FormData) {
  const noticeId = formData.get("noticeId");

  if (typeof noticeId !== "string" || !noticeId.trim()) {
    return;
  }

  await markNoticeReads({
    formData,
    noticeIds: [noticeId.trim()],
  });
}

export async function markNoticesReadAction(formData: FormData) {
  await markNoticeReads({
    formData,
    noticeIds: resolveNoticeIds(formData),
  });
}

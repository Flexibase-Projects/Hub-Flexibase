"use server";

import { revalidatePath } from "next/cache";

import { requireViewer } from "@/modules/auth/server";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";
import { getSupabaseEnv } from "@/shared/lib/supabase/env";

export async function markNoticeReadAction(formData: FormData) {
  const viewer = await requireViewer();
  const noticeId = formData.get("noticeId");

  if (typeof noticeId !== "string") {
    return;
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return;
  }

  const hub = supabase.schema(getSupabaseEnv().schema);

  await hub.from("hub_notice_reads").upsert(
    {
      notice_id: noticeId,
      user_id: viewer.userId,
    },
    {
      onConflict: "notice_id,user_id",
    }
  );

  revalidatePath("/hub");
}

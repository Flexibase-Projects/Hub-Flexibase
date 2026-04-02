import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getViewerContext } from "@/modules/auth/server";
import { buildFeedbackUrl } from "@/shared/lib/feedback";
import { buildSoftDeleteWindow } from "@/shared/lib/hub/utils";
import { createAdminSupabaseClient } from "@/shared/lib/supabase/admin";
import { getSupabaseEnv } from "@/shared/lib/supabase/env";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";
import { noticeSchema } from "@/shared/schemas/hub";

function redirectWithFeedback(
  request: Request,
  pathname: string,
  kind: "success" | "error",
  message: string
) {
  return NextResponse.redirect(new URL(buildFeedbackUrl(pathname, kind, message), request.url), {
    status: 303,
  });
}

function normalizeOptional(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function clearSoftDeleteColumns() {
  return {
    deleted_at: null,
    purge_after_at: null,
  };
}

function revalidateAdminContent() {
  revalidatePath("/admin");
  revalidatePath("/admin/notices");
  revalidatePath("/hub");
  revalidateTag("hub-content", "max");
}

export async function POST(request: Request) {
  const viewer = await getViewerContext();

  if (!viewer?.isAdmin) {
    return NextResponse.redirect(
      new URL("/hub?kind=error&message=Acesso%20administrativo%20necessario.", request.url),
      { status: 303 }
    );
  }

  const pathname = "/admin/notices";
  const formData = await request.formData();
  const intent = typeof formData.get("intent") === "string" ? String(formData.get("intent")) : "save";
  const supabase = await createServerSupabaseClient();
  const adminSupabase = createAdminSupabaseClient();

  if (!supabase && !adminSupabase) {
    return redirectWithFeedback(
      request,
      pathname,
      "error",
      "Supabase nao esta configurado para salvar comunicados."
    );
  }

  const hubClient = adminSupabase ?? supabase;

  if (!hubClient) {
    return redirectWithFeedback(
      request,
      pathname,
      "error",
      "Supabase nao esta configurado para salvar comunicados."
    );
  }

  const hub = hubClient.schema(getSupabaseEnv().schema);

  if (intent === "archive" || intent === "restore") {
    const noticeId = normalizeOptional(formData.get("id"));

    if (!noticeId) {
      return redirectWithFeedback(request, pathname, "error", "Comunicado invalido.");
    }

    const softDelete = buildSoftDeleteWindow();
    const { error } = await hub
      .from("hub_notices")
      .update(
        intent === "archive"
          ? {
              is_active: false,
              deleted_at: softDelete.deletedAt,
              purge_after_at: softDelete.purgeAfterAt,
            }
          : {
              is_active: true,
              ...clearSoftDeleteColumns(),
            }
      )
      .eq("id", noticeId);

    if (error) {
      console.error("[admin/notices] toggle failed", error);
      return redirectWithFeedback(
        request,
        pathname,
        "error",
        intent === "archive"
          ? "Nao foi possivel arquivar o comunicado."
          : "Nao foi possivel reativar o comunicado."
      );
    }

    revalidateAdminContent();

    return redirectWithFeedback(
      request,
      pathname,
      "success",
      intent === "archive" ? "Comunicado arquivado." : "Comunicado reativado."
    );
  }

  const parsed = noticeSchema.safeParse({
    id: normalizeOptional(formData.get("id")) ?? undefined,
    title: formData.get("title"),
    body: formData.get("body"),
    severity: formData.get("severity"),
    sortOrder: formData.get("sortOrder") || 0,
  });

  if (!parsed.success) {
    return redirectWithFeedback(
      request,
      pathname,
      "error",
      parsed.error.issues[0]?.message ?? "Comunicado invalido."
    );
  }

  const recordId = parsed.data.id ?? crypto.randomUUID();
  const { error } = await hub.from("hub_notices").upsert(
    {
      id: recordId,
      title: parsed.data.title,
      body: parsed.data.body,
      severity: parsed.data.severity,
      sort_order: parsed.data.sortOrder,
      is_active: true,
      ...clearSoftDeleteColumns(),
    },
    { onConflict: "id" }
  );

  if (error) {
    console.error("[admin/notices] save failed", error);
    return redirectWithFeedback(request, pathname, "error", "Nao foi possivel salvar o comunicado.");
  }

  revalidateAdminContent();

  return redirectWithFeedback(request, pathname, "success", "Comunicado salvo com sucesso.");
}

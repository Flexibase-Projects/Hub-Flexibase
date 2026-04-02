import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getViewerContext } from "@/modules/auth/server";
import { buildFeedbackUrl } from "@/shared/lib/feedback";
import {
  BANNER_MAX_ITEMS,
  BANNER_MAX_FILE_SIZE_BYTES,
  BANNER_MAX_FILE_SIZE_MB,
  DEFAULT_BANNER_TITLE,
} from "@/shared/lib/hub/constants";
import { buildSoftDeleteWindow } from "@/shared/lib/hub/utils";
import { createAdminSupabaseClient } from "@/shared/lib/supabase/admin";
import { ASSET_BUCKET, getSupabaseEnv } from "@/shared/lib/supabase/env";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";

function redirectWithFeedback(request: Request, pathname: string, kind: "success" | "error", message: string) {
  return NextResponse.redirect(new URL(buildFeedbackUrl(pathname, kind, message), request.url), {
    status: 303,
  });
}

export async function POST(request: Request) {
  const viewer = await getViewerContext();

  if (!viewer?.isAdmin) {
    return NextResponse.redirect(
      new URL("/hub?kind=error&message=Acesso%20administrativo%20necessario.", request.url),
      { status: 303 }
    );
  }

  const pathname = "/admin/banners";
  const formData = await request.formData();
  const intent = typeof formData.get("intent") === "string" ? String(formData.get("intent")) : "save";
  const file = formData.get("file");
  const idValue = formData.get("id");
  const existingBannerId = typeof idValue === "string" && idValue.trim() ? idValue.trim() : null;
  const recordId = existingBannerId ?? crypto.randomUUID();
  const supabase = await createServerSupabaseClient();
  const adminSupabase = createAdminSupabaseClient();

  if (!supabase) {
    return redirectWithFeedback(
      request,
      pathname,
      "error",
      "Supabase nao esta configurado para administrar banners."
    );
  }

  const hub = (adminSupabase ?? supabase).schema(getSupabaseEnv().schema);

  if (intent === "remove") {
    if (!idValue || typeof idValue !== "string" || !idValue.trim()) {
      return redirectWithFeedback(request, pathname, "error", "Banner invalido para remocao.");
    }

    const softDelete = buildSoftDeleteWindow();
    const { error } = await hub
      .from("hub_banners")
      .update({
        is_active: false,
        deleted_at: softDelete.deletedAt,
        purge_after_at: softDelete.purgeAfterAt,
      })
      .eq("id", idValue.trim());

    if (error) {
      return redirectWithFeedback(request, pathname, "error", "Nao foi possivel remover o banner.");
    }

    revalidatePath("/admin");
    revalidatePath("/admin/banners");
    revalidatePath("/hub");
    revalidateTag("hub-content", "max");

    return redirectWithFeedback(request, pathname, "success", "Banner removido.");
  }

  if (!(file instanceof File) || file.size <= 0) {
    return redirectWithFeedback(request, pathname, "error", "Selecione uma imagem para salvar o banner.");
  }

  if (!existingBannerId) {
    const { count, error: countError } = await hub
      .from("hub_banners")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .is("deleted_at", null);

    if (countError) {
      console.error("[admin/banners] count failed", countError);
      return redirectWithFeedback(request, pathname, "error", "Nao foi possivel validar o limite de banners.");
    }

    if ((count ?? 0) >= BANNER_MAX_ITEMS) {
      return redirectWithFeedback(
        request,
        pathname,
        "error",
        `O carrossel permite no maximo ${BANNER_MAX_ITEMS} imagens ativas.`
      );
    }
  }

  if (!adminSupabase) {
    return redirectWithFeedback(
      request,
      pathname,
      "error",
      "Supabase nao esta completamente configurado para upload de banner."
    );
  }

  if (!file.type.startsWith("image/")) {
    return redirectWithFeedback(
      request,
      pathname,
      "error",
      "Envie uma imagem valida para o banner."
    );
  }

  if (file.size > BANNER_MAX_FILE_SIZE_BYTES) {
    return redirectWithFeedback(
      request,
      pathname,
      "error",
      `O banner deve ter no maximo ${BANNER_MAX_FILE_SIZE_MB} MB.`
    );
  }

  const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "-");
  const storagePath = `banners/${recordId}/${Date.now()}-${safeFileName}`;
  const uploadBuffer = Buffer.from(await file.arrayBuffer());

  const uploadResult = await adminSupabase.storage.from(ASSET_BUCKET).upload(storagePath, uploadBuffer, {
    contentType: file.type || "application/octet-stream",
    upsert: true,
  });

  if (uploadResult.error) {
    console.error("[admin/banners] upload failed", uploadResult.error);
    return redirectWithFeedback(request, pathname, "error", "Nao foi possivel enviar a imagem do banner.");
  }

  const { error } = await hub.from("hub_banners").upsert(
    {
      id: recordId,
      title: DEFAULT_BANNER_TITLE,
      subtitle: null,
      body: null,
      image_url: `storage:${storagePath}`,
      tone: "info",
      sort_order: 0,
      is_active: true,
      deleted_at: null,
      purge_after_at: null,
    },
    { onConflict: "id" }
  );

  if (error) {
    console.error("[admin/banners] save failed", error);
    return redirectWithFeedback(request, pathname, "error", "Nao foi possivel salvar o banner.");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/banners");
  revalidatePath("/hub");
  revalidateTag("hub-content", "max");

  return redirectWithFeedback(
    request,
    pathname,
    "success",
    existingBannerId ? "Banner atualizado com sucesso." : "Banner adicionado ao carrossel."
  );
}

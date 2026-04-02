import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getViewerContext } from "@/modules/auth/server";
import { buildFeedbackUrl } from "@/shared/lib/feedback";
import { DEFAULT_BANNER_TITLE } from "@/shared/lib/hub/constants";
import { buildSoftDeleteWindow } from "@/shared/lib/hub/utils";
import { createAdminSupabaseClient } from "@/shared/lib/supabase/admin";
import { ASSET_BUCKET, getSupabaseEnv } from "@/shared/lib/supabase/env";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";

function redirectWithFeedback(request: Request, pathname: string, kind: "success" | "error", message: string) {
  return NextResponse.redirect(new URL(buildFeedbackUrl(pathname, kind, message), request.url));
}

export async function POST(request: Request) {
  const viewer = await getViewerContext();

  if (!viewer?.isAdmin) {
    return NextResponse.redirect(new URL("/hub?kind=error&message=Acesso%20administrativo%20necessario.", request.url));
  }

  const pathname = "/admin/banners";
  const formData = await request.formData();
  const file = formData.get("file");
  const idValue = formData.get("id");
  const recordId =
    typeof idValue === "string" && idValue.trim() ? idValue.trim() : crypto.randomUUID();

  if (!(file instanceof File) || file.size <= 0) {
    return redirectWithFeedback(request, pathname, "error", "Selecione uma imagem para salvar o banner.");
  }

  const supabase = await createServerSupabaseClient();
  const adminSupabase = createAdminSupabaseClient();

  if (!supabase || !adminSupabase) {
    return redirectWithFeedback(
      request,
      pathname,
      "error",
      "Supabase nao esta completamente configurado para upload de banner."
    );
  }

  const hub = supabase.schema(getSupabaseEnv().schema);
  const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "-");
  const storagePath = `banners/${recordId}/${Date.now()}-${safeFileName}`;
  const uploadBuffer = Buffer.from(await file.arrayBuffer());

  const uploadResult = await adminSupabase.storage.from(ASSET_BUCKET).upload(storagePath, uploadBuffer, {
    contentType: file.type || "application/octet-stream",
    upsert: true,
  });

  if (uploadResult.error) {
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
    return redirectWithFeedback(request, pathname, "error", "Nao foi possivel salvar o banner.");
  }

  const softDelete = buildSoftDeleteWindow();
  await hub
    .from("hub_banners")
    .update({
      is_active: false,
      deleted_at: softDelete.deletedAt,
      purge_after_at: softDelete.purgeAfterAt,
    })
    .neq("id", recordId)
    .is("deleted_at", null);

  revalidatePath("/admin");
  revalidatePath("/admin/banners");
  revalidatePath("/hub");
  revalidateTag("hub-content", "max");

  return redirectWithFeedback(request, pathname, "success", "Banner atualizado com sucesso.");
}

import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getViewerContext } from "@/modules/auth/server";
import { buildFeedbackUrl } from "@/shared/lib/feedback";
import { DOCUMENT_CATEGORIES } from "@/shared/lib/hub/constants";
import { buildSoftDeleteWindow } from "@/shared/lib/hub/utils";
import { createAdminSupabaseClient } from "@/shared/lib/supabase/admin";
import { DOCUMENT_BUCKET, getSupabaseEnv } from "@/shared/lib/supabase/env";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";
import { documentSchema } from "@/shared/schemas/hub";

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
  revalidatePath("/admin/documents");
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

  const pathname = "/admin/documents";
  const formData = await request.formData();
  const intent = typeof formData.get("intent") === "string" ? String(formData.get("intent")) : "save";
  const supabase = await createServerSupabaseClient();
  const adminSupabase = createAdminSupabaseClient();

  if (!supabase && !adminSupabase) {
    return redirectWithFeedback(
      request,
      pathname,
      "error",
      "Supabase nao esta configurado para salvar documentos."
    );
  }

  const hubClient = adminSupabase ?? supabase;

  if (!hubClient) {
    return redirectWithFeedback(
      request,
      pathname,
      "error",
      "Supabase nao esta configurado para salvar documentos."
    );
  }

  const hub = hubClient.schema(getSupabaseEnv().schema);

  if (intent === "archive" || intent === "restore") {
    const documentId = normalizeOptional(formData.get("id"));

    if (!documentId) {
      return redirectWithFeedback(request, pathname, "error", "Documento invalido.");
    }

    const softDelete = buildSoftDeleteWindow();
    const { error } = await hub
      .from("hub_documents")
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
      .eq("id", documentId);

    if (error) {
      console.error("[admin/documents] toggle failed", error);
      return redirectWithFeedback(
        request,
        pathname,
        "error",
        intent === "archive"
          ? "Nao foi possivel arquivar o documento."
          : "Nao foi possivel reativar o documento."
      );
    }

    revalidateAdminContent();

    return redirectWithFeedback(
      request,
      pathname,
      "success",
      intent === "archive" ? "Documento arquivado." : "Documento reativado."
    );
  }

  const parsed = documentSchema.safeParse({
    id: normalizeOptional(formData.get("id")) ?? undefined,
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
  });

  if (!parsed.success) {
    return redirectWithFeedback(
      request,
      pathname,
      "error",
      parsed.error.issues[0]?.message ?? "Documento invalido."
    );
  }

  if (!DOCUMENT_CATEGORIES.includes(parsed.data.category)) {
    return redirectWithFeedback(request, pathname, "error", "Selecione uma categoria valida.");
  }

  const recordId = parsed.data.id ?? crypto.randomUUID();
  const file = formData.get("file");
  let storagePath = normalizeOptional(formData.get("existingStoragePath"));
  let fileName = normalizeOptional(formData.get("existingFileName")) ?? "arquivo";
  let mimeType = normalizeOptional(formData.get("existingMimeType"));
  let fileSize = normalizeOptional(formData.get("existingFileSize"));

  if (file instanceof File && file.size > 0) {
    if (!adminSupabase) {
      return redirectWithFeedback(
        request,
        pathname,
        "error",
        "Para upload de documentos, defina SUPABASE_SERVICE_ROLE_KEY no ambiente."
      );
    }

    const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "-");
    storagePath = `${recordId}/${Date.now()}-${safeFileName}`;
    fileName = file.name;
    mimeType = file.type || "application/octet-stream";
    fileSize = String(file.size);

    const uploadBuffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await adminSupabase.storage
      .from(DOCUMENT_BUCKET)
      .upload(storagePath, uploadBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadResult.error) {
      console.error("[admin/documents] upload failed", uploadResult.error);
      return redirectWithFeedback(request, pathname, "error", "Nao foi possivel enviar o documento.");
    }
  }

  if (!storagePath) {
    return redirectWithFeedback(
      request,
      pathname,
      "error",
      "Envie um arquivo para concluir o cadastro do documento."
    );
  }

  const { error } = await hub.from("hub_documents").upsert(
    {
      id: recordId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      category: parsed.data.category,
      file_name: fileName,
      mime_type: mimeType,
      storage_bucket: DOCUMENT_BUCKET,
      storage_path: storagePath,
      file_size: fileSize ? Number(fileSize) : null,
      is_restricted: false,
      sort_order: 0,
      is_active: true,
      ...clearSoftDeleteColumns(),
    },
    { onConflict: "id" }
  );

  if (error) {
    console.error("[admin/documents] save failed", error);
    return redirectWithFeedback(request, pathname, "error", "Nao foi possivel salvar o documento.");
  }

  const softDelete = buildSoftDeleteWindow();
  await hub
    .from("hub_document_departments")
    .update({
      deleted_at: softDelete.deletedAt,
      purge_after_at: softDelete.purgeAfterAt,
    })
    .eq("document_id", recordId)
    .is("deleted_at", null);

  revalidateAdminContent();

  return redirectWithFeedback(request, pathname, "success", "Documento salvo com sucesso.");
}

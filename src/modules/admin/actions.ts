"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminViewer } from "@/modules/auth/server";
import { DOCUMENT_CATEGORIES } from "@/shared/lib/hub/constants";
import { buildFeedbackUrl } from "@/shared/lib/feedback";
import { buildSoftDeleteWindow, slugify } from "@/shared/lib/hub/utils";
import { createAdminSupabaseClient } from "@/shared/lib/supabase/admin";
import { ASSET_BUCKET, DOCUMENT_BUCKET, getSupabaseEnv } from "@/shared/lib/supabase/env";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";
import {
  bannerSchema,
  departmentSchema,
  documentSchema,
  noticeSchema,
  systemLinkSchema,
  userAccessSchema,
} from "@/shared/schemas/hub";

async function getAdminHub() {
  await requireAdminViewer();
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase nao configurado.");
  }

  return supabase.schema(getSupabaseEnv().schema);
}

function normalizeOptional(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeBannerStoragePath(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value.startsWith("storage:") ? value.slice("storage:".length) : value;
}

function clearSoftDeleteColumns() {
  return {
    deleted_at: null,
    purge_after_at: null,
  };
}

function softDeleteColumns() {
  const softDeleteWindow = buildSoftDeleteWindow();

  return {
    deleted_at: softDeleteWindow.deletedAt,
    purge_after_at: softDeleteWindow.purgeAfterAt,
  };
}

function revalidateAdminAndHub(pathname: string) {
  revalidatePath(pathname);
  revalidatePath("/admin");
  revalidatePath("/hub");
  revalidateTag("hub-content", "max");
}

function handleActionFailure(pathname: string, message: string): never {
  redirect(buildFeedbackUrl(pathname, "error", message) as never);
}

function redirectWithSuccess(pathname: string, message: string): never {
  redirect(buildFeedbackUrl(pathname, "success", message) as never);
}

async function clearDepartmentMapping(
  tableName: "hub_system_link_departments" | "hub_document_departments",
  foreignKey: "system_link_id" | "document_id",
  entityId: string
) {
  const hub = await getAdminHub();

  await hub
    .from(tableName)
    .update(softDeleteColumns())
    .eq(foreignKey, entityId)
    .is("deleted_at", null);
}

async function ensureProfile(userId: string) {
  const adminSupabase = createAdminSupabaseClient();
  const hub = await getAdminHub();

  if (!adminSupabase) {
    return;
  }

  const userResult = await adminSupabase.auth.admin.getUserById(userId);

  if (userResult.error || !userResult.data.user) {
    return;
  }

  const user = userResult.data.user;
  const fullName =
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()) ||
    user.email?.split("@")[0] ||
    "Colaborador";

  await hub.from("hub_user_profiles").upsert(
    {
      id: user.id,
      email: user.email ?? "",
      full_name: fullName,
      is_active: true,
      ...clearSoftDeleteColumns(),
    },
    {
      onConflict: "id",
    }
  );
}

async function setAdminAccess(userId: string, isAdmin: boolean) {
  const hub = await getAdminHub();
  const { data: adminRole } = await hub
    .from("hub_roles")
    .select("id")
    .eq("key", "admin")
    .is("deleted_at", null)
    .maybeSingle();

  if (!adminRole) {
    throw new Error("Papel admin nao encontrado no banco.");
  }

  if (isAdmin) {
    await ensureProfile(userId);
    await hub.from("hub_user_roles").upsert(
      {
        user_id: userId,
        role_id: adminRole.id,
        ...clearSoftDeleteColumns(),
      },
      {
        onConflict: "user_id,role_id",
      }
    );
    return;
  }

  await hub
    .from("hub_user_roles")
    .update(softDeleteColumns())
    .eq("user_id", userId)
    .eq("role_id", adminRole.id)
    .is("deleted_at", null);
}

export async function upsertDepartmentAction(formData: FormData) {
  const pathname = String(formData.get("pathname") || "/admin/users");
  const parsed = departmentSchema.safeParse({
    id: normalizeOptional(formData.get("id")) ?? undefined,
    name: formData.get("name"),
    description: formData.get("description"),
    sortOrder: formData.get("sortOrder"),
  });

  if (!parsed.success) {
    handleActionFailure(pathname, parsed.error.issues[0]?.message ?? "Departamento invalido.");
  }

  const hub = await getAdminHub();
  const recordId = parsed.data.id ?? crypto.randomUUID();
  const { error } = await hub.from("hub_departments").upsert(
    {
      id: recordId,
      name: parsed.data.name,
      slug: slugify(parsed.data.name),
      description: parsed.data.description || null,
      sort_order: parsed.data.sortOrder,
      is_active: true,
      ...clearSoftDeleteColumns(),
    },
    { onConflict: "id" }
  );

  if (error) {
    handleActionFailure(pathname, "Nao foi possivel salvar o departamento.");
  }

  revalidateAdminAndHub(pathname);
  redirectWithSuccess(pathname, "Departamento salvo com sucesso.");
}

export async function archiveDepartmentAction(formData: FormData) {
  const pathname = String(formData.get("pathname") || "/admin/users");
  const departmentId = String(formData.get("id") || "");
  const hub = await getAdminHub();

  await hub
    .from("hub_departments")
    .update({
      is_active: false,
      ...softDeleteColumns(),
    })
    .eq("id", departmentId);

  revalidateAdminAndHub(pathname);
  redirectWithSuccess(pathname, "Departamento arquivado.");
}

export async function restoreDepartmentAction(formData: FormData) {
  const pathname = String(formData.get("pathname") || "/admin/users");
  const departmentId = String(formData.get("id") || "");
  const hub = await getAdminHub();

  await hub
    .from("hub_departments")
    .update({
      is_active: true,
      ...clearSoftDeleteColumns(),
    })
    .eq("id", departmentId);

  revalidateAdminAndHub(pathname);
  redirectWithSuccess(pathname, "Departamento reativado.");
}

export async function upsertSystemAction(formData: FormData) {
  const pathname = String(formData.get("pathname") || "/admin/systems");
  const parsed = systemLinkSchema.safeParse({
    id: normalizeOptional(formData.get("id")) ?? undefined,
    title: formData.get("title"),
    description: formData.get("description"),
    targetUrl: formData.get("targetUrl"),
  });

  if (!parsed.success) {
    handleActionFailure(pathname, parsed.error.issues[0]?.message ?? "Sistema invalido.");
  }

  const hub = await getAdminHub();
  const recordId = parsed.data.id ?? crypto.randomUUID();
  const { error } = await hub.from("hub_system_links").upsert(
    {
      id: recordId,
      title: parsed.data.title,
      description: parsed.data.description,
      target_url: parsed.data.targetUrl,
      image_url: null,
      accent_color: null,
      sort_order: 0,
      is_active: true,
      ...clearSoftDeleteColumns(),
    },
    { onConflict: "id" }
  );

  if (error) {
    handleActionFailure(pathname, "Nao foi possivel salvar o sistema.");
  }

  await clearDepartmentMapping("hub_system_link_departments", "system_link_id", recordId);
  revalidateAdminAndHub(pathname);
  redirectWithSuccess(pathname, "Sistema salvo com sucesso.");
}

export async function archiveSystemAction(formData: FormData) {
  const pathname = String(formData.get("pathname") || "/admin/systems");
  const systemId = String(formData.get("id") || "");
  const hub = await getAdminHub();

  await hub
    .from("hub_system_links")
    .update({
      is_active: false,
      ...softDeleteColumns(),
    })
    .eq("id", systemId);

  revalidateAdminAndHub(pathname);
  redirectWithSuccess(pathname, "Sistema removido.");
}

export async function restoreSystemAction(formData: FormData) {
  const pathname = String(formData.get("pathname") || "/admin/systems");
  const systemId = String(formData.get("id") || "");
  const hub = await getAdminHub();

  await hub
    .from("hub_system_links")
    .update({
      is_active: true,
      ...clearSoftDeleteColumns(),
    })
    .eq("id", systemId);

  revalidateAdminAndHub(pathname);
  redirectWithSuccess(pathname, "Sistema reativado.");
}

export async function upsertBannerAction(formData: FormData) {
  const pathname = String(formData.get("pathname") || "/admin/banners");
  const parsed = bannerSchema.safeParse({
    id: normalizeOptional(formData.get("id")) ?? undefined,
    existingStoragePath: formData.get("existingStoragePath"),
  });

  if (!parsed.success) {
    handleActionFailure(pathname, parsed.error.issues[0]?.message ?? "Banner invalido.");
  }

  const file = formData.get("file");
  const hub = await getAdminHub();
  const adminSupabase = createAdminSupabaseClient();

  if (!adminSupabase) {
    handleActionFailure(
      pathname,
      "Para upload de banners, defina SUPABASE_SERVICE_ROLE_KEY no ambiente."
    );
  }

  const recordId = parsed.data.id ?? crypto.randomUUID();
  let storagePath = normalizeBannerStoragePath(parsed.data.existingStoragePath?.trim() || "");

  if (file instanceof File && file.size > 0) {
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "-");
    storagePath = `banners/${recordId}/${Date.now()}-${safeFileName}`;
    const arrayBuffer = await file.arrayBuffer();
    const uploadBuffer = Buffer.from(arrayBuffer);

    const uploadResult = await adminSupabase.storage.from(ASSET_BUCKET).upload(storagePath, uploadBuffer, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });

    if (uploadResult.error) {
      handleActionFailure(pathname, "Nao foi possivel enviar a imagem do banner.");
    }
  }

  if (!storagePath) {
    handleActionFailure(pathname, "Selecione uma imagem para salvar o banner.");
  }

  const { error } = await hub.from("hub_banners").upsert(
    {
      id: recordId,
      title: "Banner principal",
      subtitle: null,
      body: null,
      image_url: `storage:${storagePath}`,
      tone: "info",
      sort_order: 0,
      is_active: true,
      ...clearSoftDeleteColumns(),
    },
    { onConflict: "id" }
  );

  if (error) {
    handleActionFailure(pathname, "Nao foi possivel salvar o banner.");
  }

  await hub
    .from("hub_banners")
    .update({
      is_active: false,
      ...softDeleteColumns(),
    })
    .neq("id", recordId)
    .is("deleted_at", null);

  revalidateAdminAndHub(pathname);
  redirectWithSuccess(pathname, "Banner atualizado com sucesso.");
}

export async function archiveBannerAction(formData: FormData) {
  const pathname = String(formData.get("pathname") || "/admin/banners");
  const bannerId = String(formData.get("id") || "");
  const hub = await getAdminHub();

  await hub
    .from("hub_banners")
    .update({
      is_active: false,
      ...softDeleteColumns(),
    })
    .eq("id", bannerId);

  revalidateAdminAndHub(pathname);
  redirectWithSuccess(pathname, "Banner removido.");
}

export async function restoreBannerAction(formData: FormData) {
  const pathname = String(formData.get("pathname") || "/admin/banners");
  const bannerId = String(formData.get("id") || "");
  const hub = await getAdminHub();

  await hub
    .from("hub_banners")
    .update({
      is_active: true,
      ...clearSoftDeleteColumns(),
    })
    .eq("id", bannerId);

  await hub
    .from("hub_banners")
    .update({
      is_active: false,
      ...softDeleteColumns(),
    })
    .neq("id", bannerId)
    .is("deleted_at", null);

  revalidateAdminAndHub(pathname);
  redirectWithSuccess(pathname, "Banner reativado.");
}

export async function upsertNoticeAction(formData: FormData) {
  const pathname = String(formData.get("pathname") || "/admin/notices");
  const parsed = noticeSchema.safeParse({
    id: normalizeOptional(formData.get("id")) ?? undefined,
    title: formData.get("title"),
    body: formData.get("body"),
    severity: formData.get("severity"),
    sortOrder: formData.get("sortOrder") || 0,
  });

  if (!parsed.success) {
    handleActionFailure(pathname, parsed.error.issues[0]?.message ?? "Comunicado invalido.");
  }

  const hub = await getAdminHub();
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
    handleActionFailure(pathname, "Nao foi possivel salvar o comunicado.");
  }

  revalidateAdminAndHub(pathname);
  redirectWithSuccess(pathname, "Comunicado salvo com sucesso.");
}

export async function archiveNoticeAction(formData: FormData) {
  const pathname = String(formData.get("pathname") || "/admin/notices");
  const noticeId = String(formData.get("id") || "");
  const hub = await getAdminHub();

  await hub
    .from("hub_notices")
    .update({
      is_active: false,
      ...softDeleteColumns(),
    })
    .eq("id", noticeId);

  revalidateAdminAndHub(pathname);
  redirectWithSuccess(pathname, "Comunicado arquivado.");
}

export async function restoreNoticeAction(formData: FormData) {
  const pathname = String(formData.get("pathname") || "/admin/notices");
  const noticeId = String(formData.get("id") || "");
  const hub = await getAdminHub();

  await hub
    .from("hub_notices")
    .update({
      is_active: true,
      ...clearSoftDeleteColumns(),
    })
    .eq("id", noticeId);

  revalidateAdminAndHub(pathname);
  redirectWithSuccess(pathname, "Comunicado reativado.");
}

export async function upsertDocumentAction(formData: FormData) {
  const pathname = String(formData.get("pathname") || "/admin/documents");
  const parsed = documentSchema.safeParse({
    id: normalizeOptional(formData.get("id")) ?? undefined,
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
  });

  if (!parsed.success) {
    handleActionFailure(pathname, parsed.error.issues[0]?.message ?? "Documento invalido.");
  }

  if (!DOCUMENT_CATEGORIES.includes(parsed.data.category)) {
    handleActionFailure(pathname, "Selecione uma categoria valida.");
  }

  const hub = await getAdminHub();
  const recordId = parsed.data.id ?? crypto.randomUUID();
  const file = formData.get("file");
  let storagePath = normalizeOptional(formData.get("existingStoragePath"));
  let fileName = normalizeOptional(formData.get("existingFileName")) ?? "arquivo";
  let mimeType = normalizeOptional(formData.get("existingMimeType"));
  let fileSize = normalizeOptional(formData.get("existingFileSize"));

  if (file instanceof File && file.size > 0) {
    const adminSupabase = createAdminSupabaseClient();

    if (!adminSupabase) {
      handleActionFailure(
        pathname,
        "Para upload de documentos, defina SUPABASE_SERVICE_ROLE_KEY no ambiente."
      );
    }

    const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "-");
    storagePath = `${recordId}/${Date.now()}-${safeFileName}`;
    fileName = file.name;
    mimeType = file.type || "application/octet-stream";
    fileSize = String(file.size);

    const arrayBuffer = await file.arrayBuffer();
    const uploadBuffer = Buffer.from(arrayBuffer);
    const uploadResult = await adminSupabase.storage.from(DOCUMENT_BUCKET).upload(storagePath, uploadBuffer, {
      contentType: mimeType,
      upsert: true,
    });

    if (uploadResult.error) {
      handleActionFailure(pathname, "Nao foi possivel enviar o documento.");
    }
  }

  if (!storagePath) {
    handleActionFailure(pathname, "Envie um arquivo para concluir o cadastro do documento.");
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
    handleActionFailure(pathname, "Nao foi possivel salvar o documento.");
  }

  await clearDepartmentMapping("hub_document_departments", "document_id", recordId);
  revalidateAdminAndHub(pathname);
  redirectWithSuccess(pathname, "Documento salvo com sucesso.");
}

export async function archiveDocumentAction(formData: FormData) {
  const pathname = String(formData.get("pathname") || "/admin/documents");
  const documentId = String(formData.get("id") || "");
  const hub = await getAdminHub();

  await hub
    .from("hub_documents")
    .update({
      is_active: false,
      ...softDeleteColumns(),
    })
    .eq("id", documentId);

  revalidateAdminAndHub(pathname);
  redirectWithSuccess(pathname, "Documento arquivado.");
}

export async function restoreDocumentAction(formData: FormData) {
  const pathname = String(formData.get("pathname") || "/admin/documents");
  const documentId = String(formData.get("id") || "");
  const hub = await getAdminHub();

  await hub
    .from("hub_documents")
    .update({
      is_active: true,
      ...clearSoftDeleteColumns(),
    })
    .eq("id", documentId);

  revalidateAdminAndHub(pathname);
  redirectWithSuccess(pathname, "Documento reativado.");
}

export async function updateUserAccessAction(formData: FormData) {
  const pathname = String(formData.get("pathname") || "/admin/users");
  const parsed = userAccessSchema.safeParse({
    userId: formData.get("userId"),
    isAdmin: formData.get("isAdmin"),
  });

  if (!parsed.success) {
    handleActionFailure(pathname, parsed.error.issues[0]?.message ?? "Permissao invalida.");
  }

  await setAdminAccess(parsed.data.userId, parsed.data.isAdmin);
  revalidateAdminAndHub(pathname);
  const query = normalizeOptional(formData.get("query"));
  const nextPathname = query ? `${pathname}?q=${encodeURIComponent(query)}` : pathname;
  redirectWithSuccess(
    nextPathname,
    parsed.data.isAdmin ? "Permissao de admin ativada." : "Permissao de admin removida."
  );
}

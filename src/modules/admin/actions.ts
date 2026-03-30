"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireAdminViewer } from "@/modules/auth/server";
import { buildFeedbackUrl } from "@/shared/lib/feedback";
import {
  buildSoftDeleteWindow,
  clearSoftDeleteWindow,
  slugify,
} from "@/shared/lib/hub/utils";
import { createAdminSupabaseClient } from "@/shared/lib/supabase/admin";
import {
  DOCUMENT_BUCKET,
  getSupabaseEnv,
} from "@/shared/lib/supabase/env";
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
    throw new Error("Supabase não configurado.");
  }

  return supabase.schema(getSupabaseEnv().schema);
}

function normalizeOptional(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getStringArray(formData: FormData, key: string) {
  return formData.getAll(key).filter((value): value is string => typeof value === "string");
}

async function syncDepartmentMapping(params: {
  tableName:
    | "hub_system_link_departments"
    | "hub_document_departments"
    | "hub_user_departments";
  foreignKey: "system_link_id" | "document_id" | "user_id";
  entityId: string;
  departmentIds: string[];
}) {
  const hub = await getAdminHub();
  const { tableName, foreignKey, entityId, departmentIds } = params;

  const { data: existingRows } = await hub
    .from(tableName)
    .select("id, department_id")
    .eq(foreignKey, entityId);

  const existingByDepartment = new Map(
    (existingRows ?? []).map((row) => [row.department_id as string, row.id as string])
  );

  for (const [index, departmentId] of departmentIds.entries()) {
    const payload: Record<string, unknown> = {
      [foreignKey]: entityId,
      department_id: departmentId,
      ...clearSoftDeleteWindow(),
    };

    if (tableName === "hub_system_link_departments") {
      payload.is_primary = index === 0;
      payload.sort_order = index;
    }

    await hub.from(tableName).upsert(payload, {
      onConflict: `${foreignKey},department_id`,
    });
  }

  const removable = [...existingByDepartment.keys()].filter(
    (departmentId) => !departmentIds.includes(departmentId)
  );

  if (removable.length > 0) {
    const softDeleteWindow = buildSoftDeleteWindow();

    await hub
      .from(tableName)
      .update({
        deleted_at: softDeleteWindow.deletedAt,
        purge_after_at: softDeleteWindow.purgeAfterAt,
      })
      .eq(foreignKey, entityId)
      .in("department_id", removable);
  }
}

async function setUserRole(userId: string, roleKey: string) {
  const hub = await getAdminHub();
  const { data: role } = await hub
    .from("hub_roles")
    .select("id")
    .eq("key", roleKey)
    .is("deleted_at", null)
    .maybeSingle();

  if (!role) {
    throw new Error("Papel administrativo não encontrado no banco.");
  }

  const { data: existingRoles } = await hub
    .from("hub_user_roles")
    .select("role_id")
    .eq("user_id", userId)
    .is("deleted_at", null);

  const removableRoleIds = (existingRoles ?? [])
    .map((entry) => entry.role_id as string)
    .filter((existingRoleId) => existingRoleId !== (role.id as string));

  if (removableRoleIds.length > 0) {
    const softDeleteWindow = buildSoftDeleteWindow();

    await hub
      .from("hub_user_roles")
      .update({
        deleted_at: softDeleteWindow.deletedAt,
        purge_after_at: softDeleteWindow.purgeAfterAt,
      })
      .eq("user_id", userId)
      .in("role_id", removableRoleIds);
  }

  await hub.from("hub_user_roles").upsert(
    {
      user_id: userId,
      role_id: role.id,
      ...clearSoftDeleteWindow(),
    },
    {
      onConflict: "user_id,role_id",
    }
  );
}

function handleActionFailure(pathname: string, message: string): never {
  redirect(buildFeedbackUrl(pathname, "error", message) as never);
}

function redirectWithSuccess(pathname: string, message: string): never {
  redirect(buildFeedbackUrl(pathname, "success", message) as never);
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
    handleActionFailure(pathname, parsed.error.issues[0]?.message ?? "Departamento inválido.");
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
      ...clearSoftDeleteWindow(),
    },
    {
      onConflict: "id",
    }
  );

  if (error) {
    handleActionFailure(pathname, "Não foi possível salvar o departamento.");
  }

  revalidatePath(pathname);
  redirectWithSuccess(pathname, "Departamento salvo com sucesso.");
}

export async function archiveDepartmentAction(formData: FormData) {
  const pathname = String(formData.get("pathname") || "/admin/users");
  const departmentId = String(formData.get("id") || "");
  const hub = await getAdminHub();
  const softDeleteWindow = buildSoftDeleteWindow();

  await hub
    .from("hub_departments")
    .update({
      is_active: false,
      deleted_at: softDeleteWindow.deletedAt,
      purge_after_at: softDeleteWindow.purgeAfterAt,
    })
    .eq("id", departmentId);

  revalidatePath(pathname);
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
      ...clearSoftDeleteWindow(),
    })
    .eq("id", departmentId);

  revalidatePath(pathname);
  redirectWithSuccess(pathname, "Departamento reativado.");
}

export async function upsertSystemAction(formData: FormData) {
  const pathname = String(formData.get("pathname") || "/admin/systems");
  const parsed = systemLinkSchema.safeParse({
    id: normalizeOptional(formData.get("id")) ?? undefined,
    title: formData.get("title"),
    description: formData.get("description"),
    targetUrl: formData.get("targetUrl"),
    imageUrl: formData.get("imageUrl"),
    accentColor: formData.get("accentColor"),
    sortOrder: formData.get("sortOrder"),
    departmentIds: getStringArray(formData, "departmentIds"),
  });

  if (!parsed.success) {
    handleActionFailure(pathname, parsed.error.issues[0]?.message ?? "Sistema inválido.");
  }

  const hub = await getAdminHub();
  const recordId = parsed.data.id ?? crypto.randomUUID();

  const { error } = await hub.from("hub_system_links").upsert(
    {
      id: recordId,
      title: parsed.data.title,
      description: parsed.data.description,
      target_url: parsed.data.targetUrl,
      image_url: parsed.data.imageUrl || null,
      accent_color: parsed.data.accentColor || null,
      sort_order: parsed.data.sortOrder,
      is_active: true,
      ...clearSoftDeleteWindow(),
    },
    {
      onConflict: "id",
    }
  );

  if (error) {
    handleActionFailure(pathname, "Não foi possível salvar o sistema.");
  }

  await syncDepartmentMapping({
    tableName: "hub_system_link_departments",
    foreignKey: "system_link_id",
    entityId: recordId,
    departmentIds: parsed.data.departmentIds,
  });

  revalidatePath(pathname);
  redirectWithSuccess(pathname, "Sistema salvo com sucesso.");
}

export async function archiveSystemAction(formData: FormData) {
  const pathname = String(formData.get("pathname") || "/admin/systems");
  const systemId = String(formData.get("id") || "");
  const hub = await getAdminHub();
  const softDeleteWindow = buildSoftDeleteWindow();

  await hub
    .from("hub_system_links")
    .update({
      is_active: false,
      deleted_at: softDeleteWindow.deletedAt,
      purge_after_at: softDeleteWindow.purgeAfterAt,
    })
    .eq("id", systemId);

  revalidatePath(pathname);
  redirectWithSuccess(pathname, "Sistema arquivado.");
}

export async function restoreSystemAction(formData: FormData) {
  const pathname = String(formData.get("pathname") || "/admin/systems");
  const systemId = String(formData.get("id") || "");
  const hub = await getAdminHub();

  await hub
    .from("hub_system_links")
    .update({
      is_active: true,
      ...clearSoftDeleteWindow(),
    })
    .eq("id", systemId);

  revalidatePath(pathname);
  redirectWithSuccess(pathname, "Sistema reativado.");
}

export async function upsertBannerAction(formData: FormData) {
  const pathname = String(formData.get("pathname") || "/admin/banners");
  const parsed = bannerSchema.safeParse({
    id: normalizeOptional(formData.get("id")) ?? undefined,
    title: formData.get("title"),
    subtitle: formData.get("subtitle"),
    body: formData.get("body"),
    imageUrl: formData.get("imageUrl"),
    tone: formData.get("tone"),
    sortOrder: formData.get("sortOrder"),
  });

  if (!parsed.success) {
    handleActionFailure(pathname, parsed.error.issues[0]?.message ?? "Banner inválido.");
  }

  const hub = await getAdminHub();
  const recordId = parsed.data.id ?? crypto.randomUUID();

  const { error } = await hub.from("hub_banners").upsert(
    {
      id: recordId,
      title: parsed.data.title,
      subtitle: parsed.data.subtitle || null,
      body: parsed.data.body || null,
      image_url: parsed.data.imageUrl || null,
      tone: parsed.data.tone,
      sort_order: parsed.data.sortOrder,
      is_active: true,
      ...clearSoftDeleteWindow(),
    },
    {
      onConflict: "id",
    }
  );

  if (error) {
    handleActionFailure(pathname, "Não foi possível salvar o banner.");
  }

  revalidatePath(pathname);
  redirectWithSuccess(pathname, "Banner salvo com sucesso.");
}

export async function archiveBannerAction(formData: FormData) {
  const pathname = String(formData.get("pathname") || "/admin/banners");
  const bannerId = String(formData.get("id") || "");
  const hub = await getAdminHub();
  const softDeleteWindow = buildSoftDeleteWindow();

  await hub
    .from("hub_banners")
    .update({
      is_active: false,
      deleted_at: softDeleteWindow.deletedAt,
      purge_after_at: softDeleteWindow.purgeAfterAt,
    })
    .eq("id", bannerId);

  revalidatePath(pathname);
  redirectWithSuccess(pathname, "Banner arquivado.");
}

export async function restoreBannerAction(formData: FormData) {
  const pathname = String(formData.get("pathname") || "/admin/banners");
  const bannerId = String(formData.get("id") || "");
  const hub = await getAdminHub();

  await hub
    .from("hub_banners")
    .update({
      is_active: true,
      ...clearSoftDeleteWindow(),
    })
    .eq("id", bannerId);

  revalidatePath(pathname);
  redirectWithSuccess(pathname, "Banner reativado.");
}

export async function upsertNoticeAction(formData: FormData) {
  const pathname = String(formData.get("pathname") || "/admin/notices");
  const parsed = noticeSchema.safeParse({
    id: normalizeOptional(formData.get("id")) ?? undefined,
    title: formData.get("title"),
    body: formData.get("body"),
    severity: formData.get("severity"),
    sortOrder: formData.get("sortOrder"),
  });

  if (!parsed.success) {
    handleActionFailure(pathname, parsed.error.issues[0]?.message ?? "Comunicado inválido.");
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
      ...clearSoftDeleteWindow(),
    },
    {
      onConflict: "id",
    }
  );

  if (error) {
    handleActionFailure(pathname, "Não foi possível salvar o comunicado.");
  }

  revalidatePath(pathname);
  redirectWithSuccess(pathname, "Comunicado salvo com sucesso.");
}

export async function archiveNoticeAction(formData: FormData) {
  const pathname = String(formData.get("pathname") || "/admin/notices");
  const noticeId = String(formData.get("id") || "");
  const hub = await getAdminHub();
  const softDeleteWindow = buildSoftDeleteWindow();

  await hub
    .from("hub_notices")
    .update({
      is_active: false,
      deleted_at: softDeleteWindow.deletedAt,
      purge_after_at: softDeleteWindow.purgeAfterAt,
    })
    .eq("id", noticeId);

  revalidatePath(pathname);
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
      ...clearSoftDeleteWindow(),
    })
    .eq("id", noticeId);

  revalidatePath(pathname);
  redirectWithSuccess(pathname, "Comunicado reativado.");
}

export async function upsertDocumentAction(formData: FormData) {
  const pathname = String(formData.get("pathname") || "/admin/documents");
  const parsed = documentSchema.safeParse({
    id: normalizeOptional(formData.get("id")) ?? undefined,
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    sortOrder: formData.get("sortOrder"),
    isRestricted: formData.get("isRestricted"),
    departmentIds: getStringArray(formData, "departmentIds"),
  });

  if (!parsed.success) {
    handleActionFailure(pathname, parsed.error.issues[0]?.message ?? "Documento inválido.");
  }

  const hub = await getAdminHub();
  const recordId = parsed.data.id ?? crypto.randomUUID();
  const file = formData.get("file");
  let storagePath = normalizeOptional(formData.get("existingStoragePath"));
  let fileName = normalizeOptional(formData.get("existingFileName")) ?? "arquivo.pdf";
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
    const uploadResult = await adminSupabase.storage
      .from(DOCUMENT_BUCKET)
      .upload(storagePath, uploadBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadResult.error) {
      handleActionFailure(pathname, "Não foi possível enviar o arquivo para o Supabase Storage.");
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
      is_restricted: parsed.data.isRestricted,
      sort_order: parsed.data.sortOrder,
      is_active: true,
      ...clearSoftDeleteWindow(),
    },
    {
      onConflict: "id",
    }
  );

  if (error) {
    handleActionFailure(pathname, "Não foi possível salvar o documento.");
  }

  await syncDepartmentMapping({
    tableName: "hub_document_departments",
    foreignKey: "document_id",
    entityId: recordId,
    departmentIds: parsed.data.isRestricted ? parsed.data.departmentIds : [],
  });

  revalidatePath(pathname);
  redirectWithSuccess(pathname, "Documento salvo com sucesso.");
}

export async function archiveDocumentAction(formData: FormData) {
  const pathname = String(formData.get("pathname") || "/admin/documents");
  const documentId = String(formData.get("id") || "");
  const hub = await getAdminHub();
  const softDeleteWindow = buildSoftDeleteWindow();

  await hub
    .from("hub_documents")
    .update({
      is_active: false,
      deleted_at: softDeleteWindow.deletedAt,
      purge_after_at: softDeleteWindow.purgeAfterAt,
    })
    .eq("id", documentId);

  revalidatePath(pathname);
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
      ...clearSoftDeleteWindow(),
    })
    .eq("id", documentId);

  revalidatePath(pathname);
  redirectWithSuccess(pathname, "Documento reativado.");
}

export async function updateUserAccessAction(formData: FormData) {
  const pathname = String(formData.get("pathname") || "/admin/users");
  const parsed = userAccessSchema.safeParse({
    userId: formData.get("userId"),
    roleKey: formData.get("roleKey"),
    departmentIds: getStringArray(formData, "departmentIds"),
  });

  if (!parsed.success) {
    handleActionFailure(pathname, parsed.error.issues[0]?.message ?? "Permissões inválidas.");
  }

  await setUserRole(parsed.data.userId, parsed.data.roleKey);
  await syncDepartmentMapping({
    tableName: "hub_user_departments",
    foreignKey: "user_id",
    entityId: parsed.data.userId,
    departmentIds: parsed.data.departmentIds,
  });

  revalidatePath(pathname);
  redirectWithSuccess(pathname, "Permissões do usuário atualizadas.");
}

import type { HubHomeData, ViewerContext } from "@/shared/types/hub";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";
import { getSupabaseEnv } from "@/shared/lib/supabase/env";

function createEmptyHubData(loadError: string | null = null): HubHomeData {
  return {
    notices: [],
    noticeReads: [],
    banners: [],
    departments: [],
    systems: [],
    systemDepartmentMap: [],
    documents: [],
    documentDepartmentMap: [],
    loadError,
  };
}

export async function getHubHomeData(viewer?: ViewerContext | null): Promise<HubHomeData> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return createEmptyHubData(
      "Supabase ainda não está configurado para carregar o conteúdo do HUB."
    );
  }

  const hub = supabase.schema(getSupabaseEnv().schema);

  const [
    noticesResult,
    noticeReadsResult,
    bannersResult,
    departmentsResult,
    systemsResult,
    systemDepartmentMapResult,
    documentsResult,
    documentDepartmentMapResult,
  ] = await Promise.all([
    hub
      .from("hub_notices")
      .select("*")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
    viewer
      ? hub.from("hub_notice_reads").select("*").eq("user_id", viewer.userId)
      : Promise.resolve({ data: [], error: null }),
    hub
      .from("hub_banners")
      .select("*")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
    hub
      .from("hub_departments")
      .select("*")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
    hub
      .from("hub_system_links")
      .select("*")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
    hub
      .from("hub_system_link_departments")
      .select("*")
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
    hub
      .from("hub_documents")
      .select("*")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
    hub
      .from("hub_document_departments")
      .select("*")
      .is("deleted_at", null),
  ]);

  const possibleErrors = [
    noticesResult.error,
    noticeReadsResult.error,
    bannersResult.error,
    departmentsResult.error,
    systemsResult.error,
    systemDepartmentMapResult.error,
    documentsResult.error,
    documentDepartmentMapResult.error,
  ].filter(Boolean);

  if (possibleErrors.length > 0) {
    return createEmptyHubData(
      "As tabelas do HUB ainda não estão disponíveis ou o schema não foi aplicado no Supabase."
    );
  }

  return {
    notices: (noticesResult.data ?? []).map((row) => ({
      id: row.id as string,
      title: row.title as string,
      body: row.body as string,
      severity: row.severity as "critical" | "important" | "info",
      sortOrder: row.sort_order as number,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at as string,
    })),
    noticeReads: (noticeReadsResult.data ?? []).map((row) => ({
      id: row.id as string,
      noticeId: row.notice_id as string,
      userId: row.user_id as string,
      readAt: row.read_at as string,
    })),
    banners: (bannersResult.data ?? []).map((row) => ({
      id: row.id as string,
      title: row.title as string,
      subtitle: (row.subtitle as string | null) ?? null,
      body: (row.body as string | null) ?? null,
      imageUrl: (row.image_url as string | null) ?? null,
      tone: row.tone as "info" | "success" | "warning",
      sortOrder: row.sort_order as number,
      isActive: Boolean(row.is_active),
    })),
    departments: (departmentsResult.data ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      slug: row.slug as string,
      description: (row.description as string | null) ?? null,
      sortOrder: row.sort_order as number,
      isActive: Boolean(row.is_active),
    })),
    systems: (systemsResult.data ?? []).map((row) => ({
      id: row.id as string,
      title: row.title as string,
      description: row.description as string,
      targetUrl: row.target_url as string,
      imageUrl: (row.image_url as string | null) ?? null,
      accentColor: (row.accent_color as string | null) ?? null,
      sortOrder: row.sort_order as number,
      isActive: Boolean(row.is_active),
    })),
    systemDepartmentMap: (systemDepartmentMapResult.data ?? []).map((row) => ({
      systemLinkId: row.system_link_id as string,
      departmentId: row.department_id as string,
      isPrimary: Boolean(row.is_primary),
      sortOrder: row.sort_order as number,
    })),
    documents: (documentsResult.data ?? []).map((row) => ({
      id: row.id as string,
      title: row.title as string,
      description: (row.description as string | null) ?? null,
      category: row.category as string,
      fileName: row.file_name as string,
      mimeType: (row.mime_type as string | null) ?? null,
      storageBucket: row.storage_bucket as string,
      storagePath: row.storage_path as string,
      fileSize: (row.file_size as number | null) ?? null,
      isRestricted: Boolean(row.is_restricted),
      sortOrder: row.sort_order as number,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at as string,
    })),
    documentDepartmentMap: (documentDepartmentMapResult.data ?? []).map((row) => ({
      documentId: row.document_id as string,
      departmentId: row.department_id as string,
    })),
    loadError: null,
  };
}

import { unstable_cache } from "next/cache";

import type { HubHomeData, ViewerContext } from "@/shared/types/hub";
import { createAdminSupabaseClient } from "@/shared/lib/supabase/admin";
import { getSupabaseEnv } from "@/shared/lib/supabase/env";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";

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

function mapBaseHubData(payload: {
  notices: Array<Record<string, unknown>>;
  banners: Array<Record<string, unknown>>;
  departments: Array<Record<string, unknown>>;
  systems: Array<Record<string, unknown>>;
  systemDepartmentMap: Array<Record<string, unknown>>;
  documents: Array<Record<string, unknown>>;
  documentDepartmentMap: Array<Record<string, unknown>>;
}): HubHomeData {
  return {
    notices: payload.notices.map((row) => ({
      id: row.id as string,
      title: row.title as string,
      body: row.body as string,
      severity: row.severity as "critical" | "important" | "info",
      sortOrder: row.sort_order as number,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at as string,
    })),
    noticeReads: [],
    banners: payload.banners.map((row) => ({
      id: row.id as string,
      title: row.title as string,
      subtitle: (row.subtitle as string | null) ?? null,
      body: (row.body as string | null) ?? null,
      imageUrl: (row.image_url as string | null) ?? null,
      tone: row.tone as "info" | "success" | "warning",
      sortOrder: row.sort_order as number,
      isActive: Boolean(row.is_active),
    })),
    departments: payload.departments.map((row) => ({
      id: row.id as string,
      name: row.name as string,
      slug: row.slug as string,
      description: (row.description as string | null) ?? null,
      sortOrder: row.sort_order as number,
      isActive: Boolean(row.is_active),
    })),
    systems: payload.systems.map((row) => ({
      id: row.id as string,
      title: row.title as string,
      description: row.description as string,
      targetUrl: row.target_url as string,
      imageUrl: (row.image_url as string | null) ?? null,
      accentColor: (row.accent_color as string | null) ?? null,
      sortOrder: row.sort_order as number,
      isActive: Boolean(row.is_active),
    })),
    systemDepartmentMap: payload.systemDepartmentMap.map((row) => ({
      systemLinkId: row.system_link_id as string,
      departmentId: row.department_id as string,
      isPrimary: Boolean(row.is_primary),
      sortOrder: row.sort_order as number,
    })),
    documents: payload.documents.map((row) => ({
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
    documentDepartmentMap: payload.documentDepartmentMap.map((row) => ({
      documentId: row.document_id as string,
      departmentId: row.department_id as string,
    })),
    loadError: null,
  };
}

async function fetchBaseHubDataFromClient(
  client: {
    schema: (schema: string) => any;
  }
) {
  const hub = client.schema(getSupabaseEnv().schema);
  const [
    noticesResult,
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
    bannersResult.error,
    departmentsResult.error,
    systemsResult.error,
    systemDepartmentMapResult.error,
    documentsResult.error,
    documentDepartmentMapResult.error,
  ].filter(Boolean);

  if (possibleErrors.length > 0) {
    return createEmptyHubData(
      "As tabelas do HUB ainda nao estao disponiveis ou o schema nao foi aplicado no Supabase."
    );
  }

  return mapBaseHubData({
    notices: (noticesResult.data ?? []) as Array<Record<string, unknown>>,
    banners: (bannersResult.data ?? []) as Array<Record<string, unknown>>,
    departments: (departmentsResult.data ?? []) as Array<Record<string, unknown>>,
    systems: (systemsResult.data ?? []) as Array<Record<string, unknown>>,
    systemDepartmentMap: (systemDepartmentMapResult.data ?? []) as Array<Record<string, unknown>>,
    documents: (documentsResult.data ?? []) as Array<Record<string, unknown>>,
    documentDepartmentMap: (documentDepartmentMapResult.data ?? []) as Array<Record<string, unknown>>,
  });
}

const getCachedHubContent = unstable_cache(
  async () => {
    const adminSupabase = createAdminSupabaseClient();

    if (!adminSupabase) {
      return null;
    }

    return fetchBaseHubDataFromClient(adminSupabase);
  },
  ["hub-content"],
  {
    revalidate: 300,
    tags: ["hub-content"],
  }
);

export async function getHubHomeData(viewer?: ViewerContext | null): Promise<HubHomeData> {
  const cachedContent = await getCachedHubContent();

  if (cachedContent) {
    if (!viewer) {
      return cachedContent;
    }

    const supabase = await createServerSupabaseClient();

    if (!supabase) {
      return cachedContent;
    }

    const hub = supabase.schema(getSupabaseEnv().schema);
    const { data: noticeReads, error: noticeReadsError } = await hub
      .from("hub_notice_reads")
      .select("*")
      .eq("user_id", viewer.userId);

    if (noticeReadsError) {
      return cachedContent;
    }

    return {
      ...cachedContent,
      noticeReads: (noticeReads ?? []).map((row) => ({
        id: row.id as string,
        noticeId: row.notice_id as string,
        userId: row.user_id as string,
        readAt: row.read_at as string,
      })),
    };
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return createEmptyHubData(
      "Supabase ainda nao esta configurado para carregar o conteudo do HUB."
    );
  }

  const baseData = await fetchBaseHubDataFromClient(supabase);

  if (!viewer || baseData.loadError) {
    return baseData;
  }

  const hub = supabase.schema(getSupabaseEnv().schema);
  const { data: noticeReads, error: noticeReadsError } = await hub
    .from("hub_notice_reads")
    .select("*")
    .eq("user_id", viewer.userId);

  if (noticeReadsError) {
    return baseData;
  }

  return {
    ...baseData,
    noticeReads: (noticeReads ?? []).map((row) => ({
      id: row.id as string,
      noticeId: row.notice_id as string,
      userId: row.user_id as string,
      readAt: row.read_at as string,
    })),
  };
}

import { unstable_cache } from "next/cache";
import { cache } from "react";

import { normalizeSystemIconKey } from "@/shared/lib/hub/system-icons";
import { createAdminSupabaseClient } from "@/shared/lib/supabase/admin";
import { getSupabaseEnv } from "@/shared/lib/supabase/env";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";
import type { HubHomeData, HubNotice, HubNoticeRead, ViewerContext } from "@/shared/types/hub";

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

function sortByLabel<T>(items: T[], getLabel: (item: T) => string) {
  return [...items].sort((left, right) =>
    getLabel(left).localeCompare(getLabel(right), "pt-BR", { sensitivity: "base" })
  );
}

function resolveBannerUrl(id: string, imageUrl: string | null) {
  if (!imageUrl) {
    return null;
  }

  if (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith("/")) {
    return imageUrl;
  }

  return `/api/banners/${id}/image`;
}

function mapNotice(row: Record<string, unknown>): HubNotice {
  return {
    id: row.id as string,
    title: row.title as string,
    body: row.body as string,
    severity: row.severity as "critical" | "important" | "info",
    sortOrder: row.sort_order as number,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at as string,
  };
}

function mapNoticeRead(row: Record<string, unknown>): HubNoticeRead {
  return {
    id: row.id as string,
    noticeId: row.notice_id as string,
    userId: row.user_id as string,
    readAt: row.read_at as string,
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
  const resolvedBanners = payload.banners.map((row) => ({
      id: row.id as string,
      title: row.title as string,
      subtitle: (row.subtitle as string | null) ?? null,
      body: (row.body as string | null) ?? null,
      imageUrl: resolveBannerUrl(row.id as string, (row.image_url as string | null) ?? null),
      tone: row.tone as "info" | "success" | "warning",
      sortOrder: row.sort_order as number,
      isActive: Boolean(row.is_active),
    }));

  return {
    notices: payload.notices.map(mapNotice),
    noticeReads: [],
    banners: resolvedBanners,
    departments: payload.departments.map((row) => ({
      id: row.id as string,
      name: row.name as string,
      slug: row.slug as string,
      description: (row.description as string | null) ?? null,
      sortOrder: row.sort_order as number,
      isActive: Boolean(row.is_active),
    })),
    systems: sortByLabel(
      payload.systems.map((row) => ({
        id: row.id as string,
        title: row.title as string,
        description: row.description as string,
        targetUrl: row.target_url as string,
        iconKey: normalizeSystemIconKey(row.icon_key as string | null | undefined),
        imageUrl: (row.image_url as string | null) ?? null,
        accentColor: (row.accent_color as string | null) ?? null,
        sortOrder: row.sort_order as number,
        isActive: Boolean(row.is_active),
      })),
      (system) => system.title
    ),
    systemDepartmentMap: payload.systemDepartmentMap.map((row) => ({
      systemLinkId: row.system_link_id as string,
      departmentId: row.department_id as string,
      isPrimary: Boolean(row.is_primary),
      sortOrder: row.sort_order as number,
    })),
    documents: sortByLabel(
      payload.documents.map((row) => ({
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
      (document) => document.title
    ),
    documentDepartmentMap: payload.documentDepartmentMap.map((row) => ({
      documentId: row.document_id as string,
      departmentId: row.department_id as string,
    })),
    loadError: null,
  };
}

async function fetchBaseHubDataFromClient(client: { schema: (schema: string) => any }) {
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
    hub.from("hub_notices").select("*").eq("is_active", true).is("deleted_at", null).order("sort_order", { ascending: true }),
    hub.from("hub_banners").select("*").eq("is_active", true).is("deleted_at", null).order("created_at", { ascending: false }),
    hub.from("hub_departments").select("*").eq("is_active", true).is("deleted_at", null).order("name", { ascending: true }),
    hub.from("hub_system_links").select("*").eq("is_active", true).is("deleted_at", null),
    hub.from("hub_system_link_departments").select("*").is("deleted_at", null).order("sort_order", { ascending: true }),
    hub.from("hub_documents").select("*").eq("is_active", true).is("deleted_at", null),
    hub.from("hub_document_departments").select("*").is("deleted_at", null),
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

const getViewerNoticeReads = cache(async (userId: string): Promise<HubNoticeRead[] | null> => {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return null;
  }

  const hub = supabase.schema(getSupabaseEnv().schema);
  const { data, error } = await hub.from("hub_notice_reads").select("*").eq("user_id", userId);

  if (error) {
    return null;
  }

  return (data ?? []).map((row) => mapNoticeRead(row as Record<string, unknown>));
});

export async function getHubHeaderNoticeData(viewer?: ViewerContext | null) {
  const cachedContent = await getCachedHubContent();

  if (cachedContent) {
    if (!viewer) {
      return {
        notices: cachedContent.notices,
        noticeReads: [],
      };
    }

    const noticeReads = await getViewerNoticeReads(viewer.userId);

    return {
      notices: cachedContent.notices,
      noticeReads: noticeReads ?? [],
    };
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return {
      notices: [],
      noticeReads: [],
    };
  }

  const baseData = await fetchBaseHubDataFromClient(supabase);

  if (!viewer || baseData.loadError) {
    return {
      notices: baseData.notices,
      noticeReads: [],
    };
  }

  const noticeReads = await getViewerNoticeReads(viewer.userId);

  return {
    notices: baseData.notices,
    noticeReads: noticeReads ?? [],
  };
}

export async function getHubHomeData(viewer?: ViewerContext | null): Promise<HubHomeData> {
  const cachedContent = await getCachedHubContent();

  if (cachedContent) {
    if (!viewer) {
      return cachedContent;
    }

    const noticeReads = await getViewerNoticeReads(viewer.userId);

    if (!noticeReads) {
      return cachedContent;
    }

    return {
      ...cachedContent,
      noticeReads,
    };
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return createEmptyHubData("Supabase ainda nao esta configurado para carregar o conteudo do HUB.");
  }

  const baseData = await fetchBaseHubDataFromClient(supabase);

  if (!viewer || baseData.loadError) {
    return baseData;
  }

  const noticeReads = await getViewerNoticeReads(viewer.userId);

  if (!noticeReads) {
    return baseData;
  }

  return {
    ...baseData,
    noticeReads,
  };
}

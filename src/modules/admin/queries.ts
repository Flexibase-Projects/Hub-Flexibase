import { createServerSupabaseClient } from "@/shared/lib/supabase/server";
import { getSupabaseEnv } from "@/shared/lib/supabase/env";
import type {
  HubBanner,
  HubDepartment,
  HubDocument,
  HubNotice,
  HubRoleKey,
  HubSystemLink,
  HubUserProfile,
} from "@/shared/types/hub";

export interface AdminDashboardData {
  departments: HubDepartment[];
  systems: HubSystemLink[];
  systemDepartmentMap: Array<{
    systemLinkId: string;
    departmentId: string;
    isPrimary: boolean;
    sortOrder: number;
    deletedAt: string | null;
  }>;
  banners: HubBanner[];
  notices: HubNotice[];
  documents: HubDocument[];
  documentDepartmentMap: Array<{
    documentId: string;
    departmentId: string;
    deletedAt: string | null;
  }>;
  profiles: HubUserProfile[];
  roles: Array<{
    id: string;
    key: HubRoleKey;
    label: string;
  }>;
  userRoles: Array<{
    userId: string;
    roleId: string;
    deletedAt: string | null;
  }>;
  userDepartments: Array<{
    userId: string;
    departmentId: string;
    deletedAt: string | null;
  }>;
  loadError: string | null;
}

function createEmptyAdminDashboardData(loadError: string | null = null): AdminDashboardData {
  return {
    departments: [],
    systems: [],
    systemDepartmentMap: [],
    banners: [],
    notices: [],
    documents: [],
    documentDepartmentMap: [],
    profiles: [],
    roles: [],
    userRoles: [],
    userDepartments: [],
    loadError,
  };
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return createEmptyAdminDashboardData(
      "Supabase ainda não está configurado para o painel administrativo."
    );
  }

  const hub = supabase.schema(getSupabaseEnv().schema);

  const [
    departmentsResult,
    systemsResult,
    systemDepartmentMapResult,
    bannersResult,
    noticesResult,
    documentsResult,
    documentDepartmentMapResult,
    profilesResult,
    rolesResult,
    userRolesResult,
    userDepartmentsResult,
  ] = await Promise.all([
    hub.from("hub_departments").select("*").order("sort_order", { ascending: true }),
    hub.from("hub_system_links").select("*").order("sort_order", { ascending: true }),
    hub
      .from("hub_system_link_departments")
      .select("*")
      .order("sort_order", { ascending: true }),
    hub.from("hub_banners").select("*").order("sort_order", { ascending: true }),
    hub.from("hub_notices").select("*").order("sort_order", { ascending: true }),
    hub.from("hub_documents").select("*").order("sort_order", { ascending: true }),
    hub.from("hub_document_departments").select("*"),
    hub.from("hub_user_profiles").select("*").order("full_name", { ascending: true }),
    hub.from("hub_roles").select("*").order("label", { ascending: true }),
    hub.from("hub_user_roles").select("*"),
    hub.from("hub_user_departments").select("*"),
  ]);

  const possibleErrors = [
    departmentsResult.error,
    systemsResult.error,
    systemDepartmentMapResult.error,
    bannersResult.error,
    noticesResult.error,
    documentsResult.error,
    documentDepartmentMapResult.error,
    profilesResult.error,
    rolesResult.error,
    userRolesResult.error,
    userDepartmentsResult.error,
  ].filter(Boolean);

  if (possibleErrors.length > 0) {
    return createEmptyAdminDashboardData(
      "O schema do HUB ainda não foi aplicado ou o usuário não possui acesso aos dados administrativos."
    );
  }

  return {
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
      deletedAt: (row.deleted_at as string | null) ?? null,
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
    notices: (noticesResult.data ?? []).map((row) => ({
      id: row.id as string,
      title: row.title as string,
      body: row.body as string,
      severity: row.severity as "critical" | "important" | "info",
      sortOrder: row.sort_order as number,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at as string,
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
      deletedAt: (row.deleted_at as string | null) ?? null,
    })),
    profiles: (profilesResult.data ?? []).map((row) => ({
      id: row.id as string,
      email: row.email as string,
      fullName: row.full_name as string,
      jobTitle: (row.job_title as string | null) ?? null,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    })),
    roles: (rolesResult.data ?? []).map((row) => ({
      id: row.id as string,
      key: row.key as HubRoleKey,
      label: row.label as string,
    })),
    userRoles: (userRolesResult.data ?? []).map((row) => ({
      userId: row.user_id as string,
      roleId: row.role_id as string,
      deletedAt: (row.deleted_at as string | null) ?? null,
    })),
    userDepartments: (userDepartmentsResult.data ?? []).map((row) => ({
      userId: row.user_id as string,
      departmentId: row.department_id as string,
      deletedAt: (row.deleted_at as string | null) ?? null,
    })),
    loadError: null,
  };
}

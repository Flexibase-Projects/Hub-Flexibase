import type { User } from "@supabase/supabase-js";

import { normalizeSystemIconKey } from "@/shared/lib/hub/system-icons";
import { createAdminSupabaseClient } from "@/shared/lib/supabase/admin";
import { getSupabaseEnv } from "@/shared/lib/supabase/env";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";
import type {
  HubBanner,
  HubDepartment,
  HubDocument,
  HubNotice,
  HubRoleKey,
  HubSystemLink,
  HubUserProfile,
} from "@/shared/types/hub";

export interface AdminAuthUser {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  lastSignInAt: string | null;
  isAdmin: boolean;
}

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
  adminUsers: AdminAuthUser[];
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
  authUsersError: string | null;
}

interface AuthUsersResult {
  users: User[] | null;
  errorMessage: string | null;
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
    adminUsers: [],
    roles: [],
    userRoles: [],
    userDepartments: [],
    loadError,
    authUsersError: null,
  };
}

function sortByLabel<T>(items: T[], getLabel: (item: T) => string) {
  return [...items].sort((left, right) =>
    getLabel(left).localeCompare(getLabel(right), "pt-BR", { sensitivity: "base" })
  );
}

function resolveBannerImageUrl(id: string, imageUrl: string | null) {
  if (!imageUrl) {
    return null;
  }

  if (imageUrl.startsWith("storage:")) {
    return `/api/banners/${id}/image`;
  }

  return imageUrl;
}

async function listAllAuthUsers(): Promise<AuthUsersResult> {
  const adminSupabase = createAdminSupabaseClient();

  if (!adminSupabase) {
    return {
      users: null,
      errorMessage:
        "Defina SUPABASE_SERVICE_ROLE_KEY para listar todos os usuarios do Supabase Auth.",
    };
  }

  const users: User[] = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await adminSupabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      return {
        users: null,
        errorMessage: `Falha ao consultar o Supabase Auth: ${error.message}`,
      };
    }

    const batch = data.users ?? [];
    users.push(...batch);

    if (batch.length < perPage) {
      break;
    }

    page += 1;
  }

  return {
    users,
    errorMessage: null,
  };
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = await createServerSupabaseClient();
  const adminSupabase = createAdminSupabaseClient();

  if (!supabase && !adminSupabase) {
    return createEmptyAdminDashboardData(
      "Supabase ainda nao esta configurado para o painel administrativo."
    );
  }

  const hubClient = adminSupabase ?? supabase;

  if (!hubClient) {
    return createEmptyAdminDashboardData(
      "Supabase ainda nao esta configurado para o painel administrativo."
    );
  }

  const hub = hubClient.schema(getSupabaseEnv().schema);

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
    authUsersResult,
  ] = await Promise.all([
    hub.from("hub_departments").select("*").order("name", { ascending: true }),
    hub.from("hub_system_links").select("*"),
    hub.from("hub_system_link_departments").select("*"),
    hub.from("hub_banners").select("*").order("created_at", { ascending: false }),
    hub.from("hub_notices").select("*").order("created_at", { ascending: false }),
    hub.from("hub_documents").select("*"),
    hub.from("hub_document_departments").select("*"),
    hub.from("hub_user_profiles").select("*").order("full_name", { ascending: true }),
    hub.from("hub_roles").select("*").order("label", { ascending: true }),
    hub.from("hub_user_roles").select("*"),
    hub.from("hub_user_departments").select("*"),
    listAllAuthUsers(),
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

  const roles = (rolesResult.data ?? []).map((row) => ({
    id: row.id as string,
    key: row.key as HubRoleKey,
    label: row.label as string,
  }));

  const adminRoleIds = new Set(roles.filter((role) => role.key === "admin").map((role) => role.id));
  const activeAdminUserIds = new Set(
    (userRolesResult.data ?? [])
      .filter((row) => !(row.deleted_at as string | null))
      .filter((row) => adminRoleIds.has(row.role_id as string))
      .map((row) => row.user_id as string)
  );

  const profiles = (profilesResult.data ?? []).map((row) => ({
    id: row.id as string,
    email: row.email as string,
    fullName: row.full_name as string,
    jobTitle: (row.job_title as string | null) ?? null,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));

  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const authUsers = authUsersResult.users;

  const adminUsers = sortByLabel(
    authUsers
      ? authUsers.map((user) => {
          const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
          const email = String(user.email ?? "");
          const profile = profileById.get(String(user.id));
          const fallbackName = email.split("@")[0] || "Colaborador";
          const fullName =
            profile?.fullName ||
            (typeof metadata.full_name === "string" ? metadata.full_name : fallbackName);

          return {
            id: String(user.id),
            email,
            fullName,
            createdAt: String(user.created_at ?? profile?.createdAt ?? ""),
            lastSignInAt:
              typeof user.last_sign_in_at === "string" ? user.last_sign_in_at : null,
            isAdmin: activeAdminUserIds.has(String(user.id)),
          };
        })
      : profiles.map((profile) => ({
          id: profile.id,
          email: profile.email,
          fullName: profile.fullName,
          createdAt: profile.createdAt,
          lastSignInAt: null,
          isAdmin: activeAdminUserIds.has(profile.id),
        })),
    (user) => `${user.fullName} ${user.email}`
  );

  const loadMessages: string[] = [];

  if (possibleErrors.length > 0) {
    loadMessages.push(
      "Alguns dados administrativos nao puderam ser carregados. Verifique o acesso do usuario ao schema do HUB."
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
    systems: sortByLabel(
      (systemsResult.data ?? []).map((row) => ({
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
      imageUrl: resolveBannerImageUrl(
        row.id as string,
        (row.image_url as string | null) ?? null
      ),
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
    documents: sortByLabel(
      (documentsResult.data ?? []).map((row) => ({
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
    documentDepartmentMap: (documentDepartmentMapResult.data ?? []).map((row) => ({
      documentId: row.document_id as string,
      departmentId: row.department_id as string,
      deletedAt: (row.deleted_at as string | null) ?? null,
    })),
    profiles,
    adminUsers,
    roles,
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
    loadError: loadMessages.length > 0 ? loadMessages.join(" ") : null,
    authUsersError: authUsersResult.errorMessage
      ? authUsers
        ? authUsersResult.errorMessage
        : "Nao foi possivel carregar todos os usuarios do Supabase Auth. Exibindo apenas os perfis ja conhecidos do HUB."
      : null,
  };
}

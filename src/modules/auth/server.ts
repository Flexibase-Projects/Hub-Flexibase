import { redirect } from "next/navigation";

import { getSupabaseEnv } from "@/shared/lib/supabase/env";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";
import type { HubRoleKey, ViewerContext } from "@/shared/types/hub";

async function getRoleKeys(userId: string) {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return [] as HubRoleKey[];
  }

  const hub = supabase.schema(getSupabaseEnv().schema);

  const { data: roles } = await hub
    .from("hub_roles")
    .select("id, key")
    .is("deleted_at", null);

  const { data: userRoles } = await hub
    .from("hub_user_roles")
    .select("role_id")
    .eq("user_id", userId)
    .is("deleted_at", null);

  const rolesMap = new Map(
    (roles ?? []).map((role) => [role.id as string, role.key as HubRoleKey])
  );

  return (userRoles ?? [])
    .map((entry) => rolesMap.get(entry.role_id as string))
    .filter((entry): entry is HubRoleKey => Boolean(entry));
}

async function getDepartmentIds(userId: string) {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return [] as string[];
  }

  const hub = supabase.schema(getSupabaseEnv().schema);

  const { data } = await hub
    .from("hub_user_departments")
    .select("department_id")
    .eq("user_id", userId)
    .is("deleted_at", null);

  return (data ?? []).map((entry) => entry.department_id as string);
}

export async function ensureOwnProfile() {
  const env = getSupabaseEnv();
  const supabase = await createServerSupabaseClient();

  if (!env.isConfigured || !supabase) {
    return;
  }

  const [{ data: claimsData }, { data: userData }] = await Promise.all([
    supabase.auth.getClaims(),
    supabase.auth.getUser(),
  ]);

  const user = userData.user;
  const userId = claimsData?.claims?.sub;

  if (!user || !userId) {
    return;
  }

  const hub = supabase.schema(env.schema);

  await hub.from("hub_user_profiles").upsert(
    {
      id: userId,
      email: user.email ?? "",
      full_name:
        (user.user_metadata?.full_name as string | undefined) ??
        user.email?.split("@")[0] ??
        "Colaborador",
      is_active: true,
    },
    { onConflict: "id" }
  );
}

export async function getViewerContext(): Promise<ViewerContext | null> {
  const env = getSupabaseEnv();
  const supabase = await createServerSupabaseClient();

  if (!env.isConfigured || !supabase) {
    return null;
  }

  const [{ data: claimsData }, { data: userData }] = await Promise.all([
    supabase.auth.getClaims(),
    supabase.auth.getUser(),
  ]);

  const userId = claimsData?.claims?.sub;
  const user = userData.user;

  if (!userId || !user) {
    return null;
  }

  const hub = supabase.schema(env.schema);
  const [{ data: profile }, roleKeys, departmentIds] = await Promise.all([
    hub
      .from("hub_user_profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle(),
    getRoleKeys(userId),
    getDepartmentIds(userId),
  ]);

  const displayName =
    (profile?.full_name as string | undefined) ||
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Colaborador";

  return {
    userId,
    email: user.email ?? "",
    displayName,
    isAdmin: roleKeys.includes("admin"),
    roleKeys,
    departmentIds,
    profile: profile
      ? {
          id: profile.id as string,
          email: profile.email as string,
          fullName: profile.full_name as string,
          jobTitle: (profile.job_title as string | null) ?? null,
          isActive: Boolean(profile.is_active),
          createdAt: profile.created_at as string,
          updatedAt: profile.updated_at as string,
        }
      : null,
  };
}

export async function requireViewer() {
  const viewer = await getViewerContext();

  if (!viewer) {
    redirect("/login?kind=info&message=Faça login para acessar o HUB.");
  }

  return viewer;
}

export async function requireAdminViewer() {
  const viewer = await requireViewer();

  if (!viewer.isAdmin) {
    redirect("/hub?kind=error&message=Seu usuário não possui acesso administrativo.");
  }

  return viewer;
}

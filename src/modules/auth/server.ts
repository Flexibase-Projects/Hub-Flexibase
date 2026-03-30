import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { getSupabaseEnv } from "@/shared/lib/supabase/env";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";
import type { HubRoleKey, ViewerContext } from "@/shared/types/hub";

export async function ensureOwnProfile(userOverride?: User | null) {
  const env = getSupabaseEnv();
  const supabase = await createServerSupabaseClient();

  if (!env.isConfigured || !supabase) {
    return;
  }

  const user = userOverride ?? (await supabase.auth.getUser()).data.user;

  if (!user) {
    return;
  }

  const hub = supabase.schema(env.schema);

  await hub.from("hub_user_profiles").upsert(
    {
      id: user.id,
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

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return null;
  }

  const hub = supabase.schema(env.schema);
  const [profileResult, rolesResult, userRolesResult, departmentsResult] = await Promise.all([
    hub.from("hub_user_profiles").select("*").eq("id", user.id).maybeSingle(),
    hub.from("hub_roles").select("id, key").is("deleted_at", null),
    hub
      .from("hub_user_roles")
      .select("role_id")
      .eq("user_id", user.id)
      .is("deleted_at", null),
    hub
      .from("hub_user_departments")
      .select("department_id")
      .eq("user_id", user.id)
      .is("deleted_at", null),
  ]);

  const rolesMap = new Map(
    (rolesResult.data ?? []).map((role) => [role.id as string, role.key as HubRoleKey])
  );

  const roleKeys = (userRolesResult.data ?? [])
    .map((entry) => rolesMap.get(entry.role_id as string))
    .filter((entry): entry is HubRoleKey => Boolean(entry));

  const departmentIds = (departmentsResult.data ?? []).map(
    (entry) => entry.department_id as string
  );

  const profile = profileResult.data;
  const displayName =
    (profile?.full_name as string | undefined) ||
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Colaborador";

  return {
    userId: user.id,
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

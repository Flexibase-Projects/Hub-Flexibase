import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getViewerContext } from "@/modules/auth/server";
import { buildFeedbackUrl } from "@/shared/lib/feedback";
import { createAdminSupabaseClient } from "@/shared/lib/supabase/admin";
import { getSupabaseEnv } from "@/shared/lib/supabase/env";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";
import { userAccessSchema } from "@/shared/schemas/hub";

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

function softDeleteColumns() {
  const now = new Date();
  const purgeAfter = new Date(now);
  purgeAfter.setDate(purgeAfter.getDate() + 30);

  return {
    deleted_at: now.toISOString(),
    purge_after_at: purgeAfter.toISOString(),
  };
}

async function ensureProfile(userId: string) {
  const adminSupabase = createAdminSupabaseClient();

  if (!adminSupabase) {
    return;
  }

  const userResult = await adminSupabase.auth.admin.getUserById(userId);

  if (userResult.error || !userResult.data.user) {
    return;
  }

  const hub = adminSupabase.schema(getSupabaseEnv().schema);
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
    { onConflict: "id" }
  );
}

export async function POST(request: Request) {
  const viewer = await getViewerContext();

  if (!viewer?.isAdmin) {
    return NextResponse.redirect(
      new URL("/hub?kind=error&message=Acesso%20administrativo%20necessario.", request.url),
      { status: 303 }
    );
  }

  const formData = await request.formData();
  const pathname = String(formData.get("pathname") || "/admin/users");
  const parsed = userAccessSchema.safeParse({
    userId: formData.get("userId"),
    isAdmin: formData.get("isAdmin"),
  });

  if (!parsed.success) {
    return redirectWithFeedback(
      request,
      pathname,
      "error",
      parsed.error.issues[0]?.message ?? "Permissao invalida."
    );
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return redirectWithFeedback(
      request,
      pathname,
      "error",
      "Supabase nao esta configurado para atualizar usuarios."
    );
  }

  const hub = supabase.schema(getSupabaseEnv().schema);
  const { data: adminRole } = await hub
    .from("hub_roles")
    .select("id")
    .eq("key", "admin")
    .is("deleted_at", null)
    .maybeSingle();

  if (!adminRole) {
    return redirectWithFeedback(request, pathname, "error", "Papel admin nao encontrado no banco.");
  }

  if (parsed.data.isAdmin) {
    await ensureProfile(parsed.data.userId);

    const { error } = await hub.from("hub_user_roles").upsert(
      {
        user_id: parsed.data.userId,
        role_id: adminRole.id as string,
        ...clearSoftDeleteColumns(),
      },
      { onConflict: "user_id,role_id" }
    );

    if (error) {
      return redirectWithFeedback(
        request,
        pathname,
        "error",
        "Nao foi possivel ativar a permissao administrativa."
      );
    }
  } else {
    const { error } = await hub
      .from("hub_user_roles")
      .update(softDeleteColumns())
      .eq("user_id", parsed.data.userId)
      .eq("role_id", adminRole.id as string)
      .is("deleted_at", null);

    if (error) {
      return redirectWithFeedback(
        request,
        pathname,
        "error",
        "Nao foi possivel remover a permissao administrativa."
      );
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/hub");
  revalidateTag("hub-content", "max");

  const query = normalizeOptional(formData.get("query"));
  const nextPathname = query ? `${pathname}?q=${encodeURIComponent(query)}` : pathname;

  return redirectWithFeedback(
    request,
    nextPathname,
    "success",
    parsed.data.isAdmin ? "Permissao de admin ativada." : "Permissao de admin removida."
  );
}

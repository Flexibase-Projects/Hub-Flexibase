"use server";

import { redirect } from "next/navigation";

import { ensureOwnProfile } from "@/modules/auth/server";
import { loginSchema } from "@/shared/schemas/hub";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";

export interface LoginActionState {
  status: "idle" | "error";
  message?: string;
}

export async function signInAction(
  _previousState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    rememberEmail: formData.get("rememberEmail"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Verifique os dados informados.",
    };
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return {
      status: "error",
      message:
        "Supabase ainda não está configurado. Confira o .env.local e a conexão do projeto.",
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      status: "error",
      message: "Não foi possível entrar. Revise email e senha.",
    };
  }

  await ensureOwnProfile(data.user);

  redirect("/hub");
}

export async function logoutAction() {
  const supabase = await createServerSupabaseClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/login?kind=success&message=Sua sessão foi encerrada.");
}

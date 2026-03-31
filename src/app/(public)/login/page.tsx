import { redirect } from "next/navigation";

import { LoginScreen } from "@/modules/auth/components/login-screen";
import { getViewerContext } from "@/modules/auth/server";
import { getPageFeedback } from "@/shared/lib/feedback";
import { getSupabaseEnv } from "@/shared/lib/supabase/env";

interface LoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const env = getSupabaseEnv();
  const viewer = await getViewerContext();

  if (viewer) {
    redirect("/hub");
  }

  const feedback = await getPageFeedback(searchParams);

  return <LoginScreen feedback={feedback} isConfigured={env.isConfigured} />;
}

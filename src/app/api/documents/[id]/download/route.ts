import { NextResponse } from "next/server";

import { getViewerContext } from "@/modules/auth/server";
import { createAdminSupabaseClient } from "@/shared/lib/supabase/admin";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";
import { getSupabaseEnv } from "@/shared/lib/supabase/env";

interface DownloadRouteProps {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: Request, { params }: DownloadRouteProps) {
  const viewer = await getViewerContext();

  if (!viewer) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const adminSupabase = createAdminSupabaseClient();

  if (!supabase || !adminSupabase) {
    return NextResponse.json(
      { error: "Supabase Storage ainda não está completamente configurado." },
      { status: 500 }
    );
  }

  const hub = supabase.schema(getSupabaseEnv().schema);
  const [{ data: document }, { data: mappings }] = await Promise.all([
    hub
      .from("hub_documents")
      .select("*")
      .eq("id", id)
      .eq("is_active", true)
      .is("deleted_at", null)
      .maybeSingle(),
    hub.from("hub_document_departments").select("*").eq("document_id", id).is("deleted_at", null),
  ]);

  if (!document) {
    return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
  }

  const isAllowed =
    viewer.isAdmin ||
    !document.is_restricted ||
    (mappings ?? []).some((entry) => viewer.departmentIds.includes(entry.department_id as string));

  if (!isAllowed) {
    return NextResponse.json({ error: "Acesso negado ao documento." }, { status: 403 });
  }

  const signedUrl = await adminSupabase.storage
    .from(document.storage_bucket as string)
    .createSignedUrl(document.storage_path as string, 60);

  if (signedUrl.error || !signedUrl.data.signedUrl) {
    return NextResponse.json({ error: "Não foi possível gerar o download." }, { status: 500 });
  }

  return NextResponse.redirect(signedUrl.data.signedUrl);
}

import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/shared/lib/supabase/admin";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";
import { getSupabaseEnv } from "@/shared/lib/supabase/env";

interface BannerImageRouteProps {
  params: Promise<{
    id: string;
  }>;
}

function normalizeStoragePath(value: string | null) {
  if (!value) {
    return null;
  }

  return value.startsWith("storage:") ? value.slice("storage:".length) : value;
}

export async function GET(_request: Request, { params }: BannerImageRouteProps) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const adminSupabase = createAdminSupabaseClient();

  if (!supabase || !adminSupabase) {
    return NextResponse.json(
      { error: "Supabase Storage ainda nao esta completamente configurado." },
      { status: 500 }
    );
  }

  const hub = supabase.schema(getSupabaseEnv().schema);
  const { data: banner } = await hub
    .from("hub_banners")
    .select("image_url")
    .eq("id", id)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();

  const storagePath = normalizeStoragePath((banner?.image_url as string | null) ?? null);

  if (!storagePath) {
    return NextResponse.json({ error: "Banner nao encontrado." }, { status: 404 });
  }

  const download = await adminSupabase.storage.from("hub-assets").download(storagePath);

  if (download.error || !download.data) {
    return NextResponse.json({ error: "Nao foi possivel carregar a imagem do banner." }, { status: 404 });
  }

  const headers = new Headers();
  headers.set("Content-Type", download.data.type || "application/octet-stream");
  headers.set("Cache-Control", "public, max-age=300");

  return new NextResponse(download.data, { headers });
}

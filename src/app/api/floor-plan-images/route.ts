import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase service role environment variable is missing." }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");
  if (!path) return NextResponse.json({ error: "Missing image path." }, { status: 400 });

  const { data, error } = await supabaseAdmin.storage.from(env.storageBucket).download(path);
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  return new Response(data, {
    headers: {
      "Cache-Control": "private, max-age=300",
      "Content-Type": data.type || "application/octet-stream"
    }
  });
}

export async function POST(request: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase service role environment variable is missing." }, { status: 500 });
  }

  const formData = await request.formData();
  const projectId = String(formData.get("projectId") ?? "");
  const file = formData.get("file");

  if (!projectId) return NextResponse.json({ error: "Missing projectId." }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: "Missing file." }, { status: 400 });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `app-state/floor-plans/${projectId}/${crypto.randomUUID()}-${safeName}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage
    .from(env.storageBucket)
    .upload(storagePath, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: false
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    storage_path: storagePath,
    image_url: `/api/floor-plan-images?path=${encodeURIComponent(storagePath)}`
  });
}

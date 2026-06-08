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
  const client = supabaseAdmin;

  const formData = await request.formData();
  const taskId = String(formData.get("taskId") ?? "");
  const files = formData.getAll("files").filter((file): file is File => file instanceof File);

  if (!taskId) return NextResponse.json({ error: "Missing taskId." }, { status: 400 });
  if (files.length === 0) return NextResponse.json({ images: [] });

  const images = await Promise.all(
    files.map(async (file) => {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `app-state/${taskId}/${crypto.randomUUID()}-${safeName}`;
      const bytes = Buffer.from(await file.arrayBuffer());

      const { error } = await client.storage
        .from(env.storageBucket)
        .upload(storagePath, bytes, {
          contentType: file.type || "application/octet-stream",
          upsert: false
        });

      if (error) throw error;

      return {
        storage_path: storagePath,
        image_url: `/api/task-images?path=${encodeURIComponent(storagePath)}`
      };
    })
  );

  return NextResponse.json({ images });
}

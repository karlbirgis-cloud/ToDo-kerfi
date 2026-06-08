import { NextResponse } from "next/server";
import { initialData } from "@/lib/mock-data";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { AppData } from "@/lib/types";

const stateKey = "production";

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase service role environment variable is missing." }, { status: 500 });
  }

  const { data, error } = await supabaseAdmin
    .from("app_state")
    .select("data")
    .eq("key", stateKey)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (data?.data) return NextResponse.json({ data: data.data as AppData });

  const { data: created, error: createError } = await supabaseAdmin
    .from("app_state")
    .insert({ key: stateKey, data: initialData })
    .select("data")
    .single();

  if (createError) return NextResponse.json({ error: createError.message }, { status: 500 });

  return NextResponse.json({ data: created.data as AppData });
}

export async function PUT(request: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase service role environment variable is missing." }, { status: 500 });
  }

  const body = (await request.json()) as { data?: AppData };
  if (!body.data) return NextResponse.json({ error: "Missing data payload." }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("app_state")
    .upsert({ key: stateKey, data: body.data, updated_at: new Date().toISOString() });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

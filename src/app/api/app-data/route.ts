import { NextResponse } from "next/server";
import { initialData } from "@/lib/mock-data";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { AppData } from "@/lib/types";

const stateKey = "production";

async function authorize(request: Request) {
  if (!supabaseAdmin) {
    return { response: NextResponse.json({ error: "Supabase service role environment variable is missing." }, { status: 500 }) };
  }
  const client = supabaseAdmin;

  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return { response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };

  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return { response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };

  return { client, user: data.user };
}

export async function GET(request: Request) {
  const authorization = await authorize(request);
  if (authorization.response) return authorization.response;

  const { client } = authorization;
  const { data, error } = await client
    .from("app_state")
    .select("data")
    .eq("key", stateKey)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (data?.data) return NextResponse.json({ data: data.data as AppData });

  const { data: created, error: createError } = await client
    .from("app_state")
    .insert({ key: stateKey, data: initialData })
    .select("data")
    .single();

  if (createError) return NextResponse.json({ error: createError.message }, { status: 500 });

  return NextResponse.json({ data: created.data as AppData });
}

export async function PUT(request: Request) {
  const authorization = await authorize(request);
  if (authorization.response) return authorization.response;
  const { client } = authorization;

  const body = (await request.json()) as { data?: AppData };
  if (!body.data) return NextResponse.json({ error: "Missing data payload." }, { status: 400 });

  const { error } = await client
    .from("app_state")
    .upsert({ key: stateKey, data: body.data, updated_at: new Date().toISOString() });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

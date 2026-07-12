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

  const body = (await request.json()) as { data?: AppData; allowDestructiveOverwrite?: boolean };
  if (!body.data) return NextResponse.json({ error: "Missing data payload." }, { status: 400 });

  if (!body.allowDestructiveOverwrite) {
    const { data: currentState, error: currentError } = await client
      .from("app_state")
      .select("data")
      .eq("key", stateKey)
      .maybeSingle();

    if (currentError) return NextResponse.json({ error: currentError.message }, { status: 500 });

    const currentData = currentState?.data as AppData | undefined;
    const destructiveDrop = currentData ? findDestructiveDrop(currentData, body.data) : null;
    if (destructiveDrop) {
      return NextResponse.json({
        error: `Rejected suspicious app-state overwrite: ${destructiveDrop}.`,
        code: "destructive_state_overwrite"
      }, { status: 409 });
    }
  }

  const { error } = await client
    .from("app_state")
    .upsert({ key: stateKey, data: body.data, updated_at: new Date().toISOString() });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

function findDestructiveDrop(currentData: AppData, nextData: AppData) {
  const checks: Array<{ label: string; current: number; next: number }> = [
    { label: "projects", current: currentData.projects?.length ?? 0, next: nextData.projects?.length ?? 0 },
    { label: "locations", current: currentData.locations?.length ?? 0, next: nextData.locations?.length ?? 0 },
    { label: "units", current: currentData.units?.length ?? 0, next: nextData.units?.length ?? 0 },
    { label: "tasks", current: currentData.tasks?.length ?? 0, next: nextData.tasks?.length ?? 0 },
    { label: "task_images", current: currentData.task_images?.length ?? 0, next: nextData.task_images?.length ?? 0 }
  ];

  const failingCheck = checks.find((check) =>
    check.current >= 5 &&
    check.next < check.current &&
    check.next <= Math.floor(check.current * 0.5)
  );

  return failingCheck ? `${failingCheck.label} dropped from ${failingCheck.current} to ${failingCheck.next}` : null;
}

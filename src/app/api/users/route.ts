import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { AppData } from "@/lib/types";

const stateKey = "production";

export async function POST(request: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase service role environment variable is missing." }, { status: 500 });
  }

  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { data: authUser, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !authUser.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { data: state, error: stateError } = await supabaseAdmin
    .from("app_state")
    .select("data")
    .eq("key", stateKey)
    .single();
  if (stateError) return NextResponse.json({ error: stateError.message }, { status: 500 });

  const appData = state.data as AppData;
  const actor = appData.profiles.find((profile) =>
    profile.id === authUser.user.id ||
    profile.email.toLowerCase() === authUser.user.email?.toLowerCase()
  );
  if (!actor || !["admin", "manager"].includes(actor.role)) {
    return NextResponse.json({ error: "Only admins and managers can create users." }, { status: 403 });
  }

  const body = (await request.json()) as { email?: string; password?: string; name?: string };
  if (!body.email || !body.password || !body.name) {
    return NextResponse.json({ error: "Missing name, email or password." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
    user_metadata: { name: body.name }
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ id: data.user.id });
}

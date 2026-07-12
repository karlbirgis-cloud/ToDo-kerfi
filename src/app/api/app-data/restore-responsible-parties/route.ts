import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { AppData, ResponsibleParty } from "@/lib/types";

const stateKey = "production";
const restoreToken = "775ebd6e10f6452e9e61ffa47faaad1d";

const responsiblePartiesToRestore = [
  "Bryggjuhverfi",
  "Dverghamrar",
  "Dona",
  "Járn og Gler",
  "Gæðamálverk"
];

export async function POST(request: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase service role environment variable is missing." }, { status: 500 });
  }

  const token = request.headers.get("x-restore-token");
  if (token !== restoreToken) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: state, error: stateError } = await supabaseAdmin
    .from("app_state")
    .select("data")
    .eq("key", stateKey)
    .single();

  if (stateError) return NextResponse.json({ error: stateError.message }, { status: 500 });

  const appData = state.data as AppData;
  const now = new Date().toISOString();
  const existingNames = new Set((appData.responsible_parties ?? []).map((party) => party.name.trim().toLowerCase()));
  const addedParties: ResponsibleParty[] = responsiblePartiesToRestore
    .filter((name) => !existingNames.has(name.toLowerCase()))
    .map((name, index) => ({
      id: `responsible_restored_${slugify(name)}_${index + 1}`,
      name,
      email: "",
      phone: "",
      created_at: now,
      updated_at: now
    }));

  const nextData: AppData = {
    ...appData,
    responsible_parties: [...(appData.responsible_parties ?? []), ...addedParties]
  };

  const { error: updateError } = await supabaseAdmin
    .from("app_state")
    .upsert({ key: stateKey, data: nextData, updated_at: now });

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    added: addedParties.map((party) => party.name),
    total: nextData.responsible_parties.length
  });
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

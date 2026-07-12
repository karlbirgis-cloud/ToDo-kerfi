import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { AppData, ResponsibleParty } from "@/lib/types";

const stateKey = "production";
const restoreToken = "775ebd6e10f6452e9e61ffa47faaad1d";

const responsiblePartiesToRestore = [
  "Bryggjuhverfi",
  "Dverghamrar",
  "Dona",
  "J\u00e1rn og Gler",
  "G\u00e6\u00f0am\u00e1lverk"
];

const nameFixes = new Map([
  ["J\u00c3\u00a1rn og Gler", "J\u00e1rn og Gler"],
  ["G\u00c3\u00a6\u00c3\u00b0am\u00c3\u00a1lverk", "G\u00e6\u00f0am\u00e1lverk"]
]);

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
  const originalParties = appData.responsible_parties ?? [];
  const repairedParties = originalParties.map((party) => ({
    ...party,
    name: nameFixes.get(party.name) ?? party.name,
    updated_at: nameFixes.has(party.name) ? now : party.updated_at
  }));
  const existingNames = new Set(repairedParties.map((party) => party.name.trim().toLowerCase()));
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
    responsible_parties: [...repairedParties, ...addedParties]
  };

  const { error: updateError } = await supabaseAdmin
    .from("app_state")
    .upsert({ key: stateKey, data: nextData, updated_at: now });

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    repaired: repairedParties
      .filter((party, index) => party.name !== originalParties[index]?.name)
      .map((party) => party.name),
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

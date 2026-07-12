import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";
import backupData from "../../../../../gogn/app-state-backup-2026-06-10T08-57-55-549Z.json";
import { defaultInspectionTypes, finalDeliveryChecklistItems, finalDeliveryTemplate, initialData } from "@/lib/mock-data";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { AppData } from "@/lib/types";

export const runtime = "nodejs";

const stateKey = "production";
const restoreToken = "3cdaf3cb01944da0b6420d7a66f6ab49";

export async function POST(request: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase service role environment variable is missing." }, { status: 500 });
  }

  const token = request.headers.get("x-restore-token");
  if (token !== restoreToken) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const decodedBackup = fixMojibake(backupData) as Partial<AppData>;
  const restoredData: AppData = {
    ...initialData,
    ...decodedBackup,
    responsible_parties: decodedBackup.responsible_parties ?? initialData.responsible_parties,
    inspection_types: decodedBackup.inspection_types ?? defaultInspectionTypes,
    inspection_templates: [finalDeliveryTemplate],
    inspection_checklist_items: finalDeliveryChecklistItems,
    inspection_runs: [],
    inspection_run_items: [],
    floor_plans: decodedBackup.floor_plans ?? [],
    task_plan_markers: decodedBackup.task_plan_markers ?? []
  };

  const { error } = await supabaseAdmin
    .from("app_state")
    .upsert({ key: stateKey, data: restoredData, updated_at: new Date().toISOString() });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    counts: {
      projects: restoredData.projects.length,
      locations: restoredData.locations.length,
      units: restoredData.units.length,
      tasks: restoredData.tasks.length,
      task_images: restoredData.task_images.length
    },
    sample: restoredData.tasks[0]?.title
  });
}

function fixMojibake(value: unknown): unknown {
  if (typeof value === "string") return decodeMojibake(value);
  if (Array.isArray(value)) return value.map(fixMojibake);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, childValue]) => [key, fixMojibake(childValue)])
    );
  }
  return value;
}

function decodeMojibake(value: string) {
  if (!/[ÃÂ]/.test(value)) return value;
  return Buffer.from(value, "latin1").toString("utf8");
}

import { NextResponse } from "next/server";
import backupData from "../../../../../gogn/app-state-backup-2026-06-10T08-57-55-549Z.json";
import { defaultInspectionTypes, finalDeliveryChecklistItems, finalDeliveryTemplate, initialData } from "@/lib/mock-data";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { AppData } from "@/lib/types";

const stateKey = "production";
const restoreToken = "e31c6c0788b24555b39eaebe4a91cbb7";

export async function POST(request: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase service role environment variable is missing." }, { status: 500 });
  }

  const token = request.headers.get("x-restore-token");
  if (token !== restoreToken) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const restoredData: AppData = {
    ...initialData,
    ...(backupData as Partial<AppData>),
    responsible_parties: (backupData as Partial<AppData>).responsible_parties ?? initialData.responsible_parties,
    inspection_types: (backupData as Partial<AppData>).inspection_types ?? defaultInspectionTypes,
    inspection_templates: [finalDeliveryTemplate],
    inspection_checklist_items: finalDeliveryChecklistItems,
    inspection_runs: [],
    inspection_run_items: [],
    floor_plans: (backupData as Partial<AppData>).floor_plans ?? [],
    task_plan_markers: (backupData as Partial<AppData>).task_plan_markers ?? []
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
    }
  });
}

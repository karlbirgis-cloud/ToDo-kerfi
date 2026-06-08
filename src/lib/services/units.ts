import { supabase } from "@/lib/supabase/client";
import type { Unit, UnitType } from "@/lib/types";

export async function getUnitsByLocation(locationId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase.from("units").select("*").eq("location_id", locationId).order("sort_order");
  if (error) throw error;
  return data as Unit[];
}

export async function createDefaultStructureForUnit(unitId: string) {
  if (!supabase) throw new Error("Supabase environment variables are missing.");
  const { error } = await supabase.rpc("create_default_structure_for_unit", { target_unit_id: unitId });
  if (error) throw error;
}

export async function createUnit(input: Pick<Unit, "project_id" | "location_id" | "name" | "unit_type" | "floor">) {
  if (!supabase) throw new Error("Supabase environment variables are missing.");
  const { data, error } = await supabase.from("units").insert(input).select().single();
  if (error) throw error;
  await createDefaultStructureForUnit(data.id);
  return data as Unit;
}

export async function createUnitsBulk(locationId: string, projectId: string, names: string[], unitType: UnitType, floor?: string) {
  if (!supabase) throw new Error("Supabase environment variables are missing.");
  const { data, error } = await supabase
    .from("units")
    .insert(names.map((name) => ({ location_id: locationId, project_id: projectId, name, unit_type: unitType, floor })))
    .select();
  if (error) throw error;
  await Promise.all((data as Unit[]).map((unit) => createDefaultStructureForUnit(unit.id)));
  return data as Unit[];
}

export async function updateUnit(id: string, patch: Partial<Unit>) {
  if (!supabase) throw new Error("Supabase environment variables are missing.");
  const { data, error } = await supabase.from("units").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data as Unit;
}

export async function deleteUnit(id: string) {
  if (!supabase) throw new Error("Supabase environment variables are missing.");
  const { error } = await supabase.from("units").delete().eq("id", id);
  if (error) throw error;
}

import { supabase } from "@/lib/supabase/client";
import type { Location } from "@/lib/types";

export async function getLocationsByProject(projectId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase.from("locations").select("*").eq("project_id", projectId).order("sort_order");
  if (error) throw error;
  return data as Location[];
}

export async function createLocation(input: Pick<Location, "project_id" | "name" | "description">) {
  if (!supabase) throw new Error("Supabase environment variables are missing.");
  const { data, error } = await supabase.from("locations").insert(input).select().single();
  if (error) throw error;
  return data as Location;
}

export async function updateLocation(id: string, patch: Partial<Location>) {
  if (!supabase) throw new Error("Supabase environment variables are missing.");
  const { data, error } = await supabase.from("locations").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data as Location;
}

export async function deleteLocation(id: string) {
  if (!supabase) throw new Error("Supabase environment variables are missing.");
  const { error } = await supabase.from("locations").delete().eq("id", id);
  if (error) throw error;
}

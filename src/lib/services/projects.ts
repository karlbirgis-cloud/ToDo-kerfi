import { supabase } from "@/lib/supabase/client";
import type { Project } from "@/lib/types";

export async function getProjects() {
  if (!supabase) return [];
  const { data, error } = await supabase.from("projects").select("*").order("project_number");
  if (error) throw error;
  return data as Project[];
}

export async function getProjectById(id: string) {
  if (!supabase) return null;
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).single();
  if (error) throw error;
  return data as Project;
}

export async function createProject(input: Pick<Project, "project_number" | "name" | "company_id">) {
  if (!supabase) throw new Error("Supabase environment variables are missing.");
  const { data, error } = await supabase
    .from("projects")
    .insert({ ...input, full_name: `${input.project_number} - ${input.name}`, status: "active" })
    .select()
    .single();
  if (error) throw error;
  return data as Project;
}

export async function updateProject(id: string, patch: Partial<Project>) {
  if (!supabase) throw new Error("Supabase environment variables are missing.");
  const { data, error } = await supabase.from("projects").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data as Project;
}

export async function deleteProject(id: string) {
  if (!supabase) throw new Error("Supabase environment variables are missing.");
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

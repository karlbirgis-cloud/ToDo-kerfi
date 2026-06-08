import { supabase } from "@/lib/supabase/client";
import type { Task, TaskStatus } from "@/lib/types";

export async function getTasks() {
  if (!supabase) return [];
  const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data as Task[];
}

export async function getTasksByUnit(unitId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase.from("tasks").select("*").eq("unit_id", unitId).order("created_at", { ascending: false });
  if (error) throw error;
  return data as Task[];
}

export async function getTasksBySubcategory(subcategoryId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase.from("tasks").select("*").eq("subcategory_id", subcategoryId).order("created_at", { ascending: false });
  if (error) throw error;
  return data as Task[];
}

export async function getTaskById(id: string) {
  if (!supabase) return null;
  const { data, error } = await supabase.from("tasks").select("*").eq("id", id).single();
  if (error) throw error;
  return data as Task;
}

export async function createTask(input: Omit<Task, "id" | "created_at" | "updated_at" | "completed_at">) {
  if (!supabase) throw new Error("Supabase environment variables are missing.");
  const { data, error } = await supabase.from("tasks").insert(input).select().single();
  if (error) throw error;
  return data as Task;
}

export async function updateTask(id: string, patch: Partial<Task>) {
  if (!supabase) throw new Error("Supabase environment variables are missing.");
  const { data, error } = await supabase.from("tasks").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data as Task;
}

export async function updateTaskStatus(taskId: string, status: TaskStatus, userId: string) {
  if (!supabase) throw new Error("Supabase environment variables are missing.");
  const current = await getTaskById(taskId);
  const { data, error } = await supabase
    .from("tasks")
    .update({ status, completed_at: status === "done" ? new Date().toISOString() : null })
    .eq("id", taskId)
    .select()
    .single();
  if (error) throw error;
  await supabase.from("task_status_history").insert({ task_id: taskId, old_status: current?.status, new_status: status, changed_by_user_id: userId });
  await supabase.from("task_activity_log").insert({ task_id: taskId, user_id: userId, action: "status_changed", metadata: { status } });
  return data as Task;
}

export function completeTask(taskId: string, userId: string) {
  return updateTaskStatus(taskId, "done", userId);
}

export function reopenTask(taskId: string, userId: string) {
  return updateTaskStatus(taskId, "open", userId);
}

export async function deleteTask(id: string) {
  if (!supabase) throw new Error("Supabase environment variables are missing.");
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

export async function getMyTasks(userId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase.from("tasks").select("*").eq("assigned_to_user_id", userId).order("due_date");
  if (error) throw error;
  return data as Task[];
}

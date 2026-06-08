import { supabase } from "@/lib/supabase/client";
import type { TaskComment } from "@/lib/types";

export async function getTaskComments(taskId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase.from("task_comments").select("*").eq("task_id", taskId).order("created_at");
  if (error) throw error;
  return data as TaskComment[];
}

export async function createTaskComment(taskId: string, userId: string, comment: string) {
  if (!supabase) throw new Error("Supabase environment variables are missing.");
  const { data, error } = await supabase.from("task_comments").insert({ task_id: taskId, user_id: userId, comment }).select().single();
  if (error) throw error;
  return data as TaskComment;
}

export async function deleteTaskComment(id: string) {
  if (!supabase) throw new Error("Supabase environment variables are missing.");
  const { error } = await supabase.from("task_comments").delete().eq("id", id);
  if (error) throw error;
}

import { supabase } from "@/lib/supabase/client";
import { env } from "@/lib/env";
import type { TaskImage } from "@/lib/types";

export async function uploadTaskImage(taskId: string, file: File, userId: string) {
  if (!supabase) throw new Error("Supabase environment variables are missing.");

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("company_id, project_id")
    .eq("id", taskId)
    .single();
  if (taskError) throw taskError;

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${task.company_id}/${task.project_id}/${taskId}/${crypto.randomUUID()}-${safeName}`;
  const { error: uploadError } = await supabase.storage.from(env.storageBucket).upload(storagePath, file);
  if (uploadError) throw uploadError;

  const { data: signedUrl, error: signedUrlError } = await supabase.storage
    .from(env.storageBucket)
    .createSignedUrl(storagePath, 60 * 60);
  if (signedUrlError) throw signedUrlError;

  const { data, error } = await supabase.from("task_images").insert({ task_id: taskId, image_url: signedUrl.signedUrl, storage_path: storagePath, uploaded_by_user_id: userId }).select().single();
  if (error) throw error;
  return data as TaskImage;
}

export async function deleteTaskImage(id: string, storagePath: string) {
  if (!supabase) throw new Error("Supabase environment variables are missing.");
  await supabase.storage.from(env.storageBucket).remove([storagePath]);
  const { error } = await supabase.from("task_images").delete().eq("id", id);
  if (error) throw error;
}

export async function getTaskImages(taskId: string) {
  if (!supabase) return [];
  const client = supabase;
  const { data, error } = await client.from("task_images").select("*").eq("task_id", taskId).order("created_at");
  if (error) throw error;

  const images = (data as TaskImage[]) ?? [];
  return Promise.all(
    images.map(async (image) => {
      const { data: signedUrl } = await client.storage
        .from(env.storageBucket)
        .createSignedUrl(image.storage_path, 60 * 60);

      return signedUrl?.signedUrl ? { ...image, image_url: signedUrl.signedUrl } : image;
    })
  );
}

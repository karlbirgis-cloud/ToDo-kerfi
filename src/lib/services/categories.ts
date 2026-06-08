import { supabase } from "@/lib/supabase/client";
import type { Category, Subcategory } from "@/lib/types";

export async function getCategoriesForUnit(unitId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase.from("unit_categories").select("categories(*)").eq("unit_id", unitId).order("sort_order");
  if (error) throw error;
  return data.map((row) => row.categories) as unknown as Category[];
}

export async function getSubcategoriesForUnit(unitId: string, categoryId?: string) {
  if (!supabase) return [];
  let query = supabase.from("unit_subcategories").select("subcategories(*)").eq("unit_id", unitId).order("sort_order");
  if (categoryId) query = query.eq("category_id", categoryId);
  const { data, error } = await query;
  if (error) throw error;
  return data.map((row) => row.subcategories) as unknown as Subcategory[];
}

export async function createCategory(input: Pick<Category, "name" | "sort_order" | "is_default" | "is_active">) {
  if (!supabase) throw new Error("Supabase environment variables are missing.");
  const { data, error } = await supabase.from("categories").insert(input).select().single();
  if (error) throw error;
  return data as Category;
}

export async function updateCategory(id: string, patch: Partial<Category>) {
  if (!supabase) throw new Error("Supabase environment variables are missing.");
  const { data, error } = await supabase.from("categories").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data as Category;
}

export async function createSubcategory(input: Pick<Subcategory, "category_id" | "name" | "sort_order" | "is_default" | "is_active">) {
  if (!supabase) throw new Error("Supabase environment variables are missing.");
  const { data, error } = await supabase.from("subcategories").insert(input).select().single();
  if (error) throw error;
  return data as Subcategory;
}

export async function updateSubcategory(id: string, patch: Partial<Subcategory>) {
  if (!supabase) throw new Error("Supabase environment variables are missing.");
  const { data, error } = await supabase.from("subcategories").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data as Subcategory;
}

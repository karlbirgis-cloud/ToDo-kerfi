import { createClient } from "@supabase/supabase-js";
import { env, hasSupabaseEnv } from "@/lib/env";

export const supabase = hasSupabaseEnv
  ? createClient(env.supabaseUrl!, env.supabaseAnonKey!)
  : null;

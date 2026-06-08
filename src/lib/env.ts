export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  storageBucket:
    process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ??
    process.env.SUPABASE_STORAGE_BUCKET ??
    "task-images"
};

export const hasSupabaseEnv = Boolean(env.supabaseUrl && env.supabaseAnonKey);

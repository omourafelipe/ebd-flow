import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== "PLACEHOLDER" && 
  supabaseAnonKey !== "PLACEHOLDER"
);

if (!isSupabaseConfigured && typeof window !== "undefined") {
  console.warn(
    "EBD Flow: Supabase URL or Anon Key not configured. Using localStorage fallback mode (Demo Mode)."
  );
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

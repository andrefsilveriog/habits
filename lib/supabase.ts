import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type Habit = {
  id: string;
  name: string;
  due_time: string | null; // "HH:MM:SS"
  start_date: string; // YYYY-MM-DD
  archived_at: string | null;
  created_at: string;
};

let client: SupabaseClient | null = null;

// Created lazily so the module can be imported during Next's server prerender
// without the browser-only env being read at import time.
export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    }
    client = createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return client;
}

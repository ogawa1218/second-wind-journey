"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env vars",
  );
}

/**
 * Browser-side Supabase client (anon key).
 * Used in client components for auth operations only.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(url!, anonKey!);
}

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase environment variables are not configured")
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key",
)

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return !!(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== "https://placeholder.supabase.co" &&
    supabaseAnonKey !== "placeholder-key"
  )
}

// Server-side client for admin operations
export const createServerClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase server configuration")
  }
  return createClient(supabaseUrl, serviceRoleKey)
}

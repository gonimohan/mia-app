import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  try {
    // Check if required environment variables are present
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("Supabase environment variables not configured, skipping auth middleware")
      return NextResponse.next()
    }

    // Create supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Get the session from the request
    const token = req.cookies.get("sb-access-token")?.value

    // Allow access to auth pages and public routes
    if (
      req.nextUrl.pathname.startsWith("/login") ||
      req.nextUrl.pathname.startsWith("/register") ||
      req.nextUrl.pathname.startsWith("/auth") ||
      req.nextUrl.pathname === "/"
    ) {
      return NextResponse.next()
    }

    // If no token, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    return NextResponse.next()
  } catch (error) {
    console.error("Middleware error:", error)
    // In case of error, allow the request to proceed
    return NextResponse.next()
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
}

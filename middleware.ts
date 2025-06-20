import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Define public paths that should bypass session checks
const publicPaths = [
  "/login",
  "/register",
  "/", // Root page
  // Auth related paths
  "/auth/callback",
  // API routes for auth or public data
  // path.startsWith("/api/auth") will be handled separately
];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Check if the current path is one of the public paths
  // or if it's for Next.js internals that should always be allowed.
  // The matcher already excludes _next/static, _next/image, favicon.ico, and /public.
  if (publicPaths.includes(path) || path.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  try {
    const cookieStore = cookies();
    // Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in environment
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Error getting session in middleware:", sessionError.message);
      // Decide if to redirect to login or allow access if session check fails critically
      // For now, redirect to login for security.
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    if (!session) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.search = ""; // Clear search params to avoid loops
      return NextResponse.redirect(redirectUrl);
    }

    // If there is a session, allow the request to proceed.
    // The response object needs to be passed through to allow Supabase helpers to set cookies if needed.
    const res = NextResponse.next();
    return res;

  } catch (error) {
    // Catch any other unexpected errors during middleware execution
    console.error("Unexpected middleware error on path:", path, error);
    const errorRedirectUrl = req.nextUrl.clone();
    errorRedirectUrl.pathname = "/login";
    errorRedirectUrl.search = "";
    return NextResponse.redirect(errorRedirectUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (directory) - This excludes all files in the /public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};

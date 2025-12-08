import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Next.js 16 Proxy Configuration
 * 
 * This file replaces middleware.ts and should only contain:
 * - Network rewrites
 * - Simple redirects
 * - Header modifications
 * 
 * Complex logic (auth, validation) should be in server components/functions.
 */

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Maintenance Mode - Simple Redirect
  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true"

  if (isMaintenanceMode && !path.startsWith("/maintenance")) {
    // Allow access to static files
    if (!path.includes(".") && !path.startsWith("/_next")) {
      return NextResponse.redirect(new URL("/maintenance", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/profiles (user uploaded images)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|images/profiles).*)",
  ],
}

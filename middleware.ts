import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key-here-change-in-production"

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // 1. Maintenance Mode Check
  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true"

  if (isMaintenanceMode && !path.startsWith("/(errors)/maintenance")) {
    // Allow access to static files and maintenance page
    if (!path.includes(".") && !path.startsWith("/_next")) {
      return NextResponse.redirect(new URL("/maintenance", request.url))
    }
  }

  if (!isMaintenanceMode && path.startsWith("/maintenance")) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // 2. Protected Routes (Dashboard)
  const isPrivateRoute = path.startsWith("/dashboard")
  const isAuthRoute = path.startsWith("/auth/login") || path.startsWith("/auth/register")

  if (isPrivateRoute) {
    const token = request.cookies.get("auth-token")?.value

    if (token) {
      try {
        const secret = new TextEncoder().encode(JWT_SECRET)
        await jwtVerify(token, secret)
      } catch (error) {
        // Invalid token, redirect to login and clear cookie
        const response = NextResponse.redirect(new URL("/auth/login", request.url))
        response.cookies.delete("auth-token")
        return response
      }
    }
  }

  // 3. Redirect logged-in users away from auth pages
  if (isAuthRoute) {
    const token = request.cookies.get("auth-token")?.value
    if (token) {
      try {
        const secret = new TextEncoder().encode(JWT_SECRET)
        await jwtVerify(token, secret)
        return NextResponse.redirect(new URL("/dashboard", request.url))
      } catch (error) {
        // Invalid token, allow access to auth pages
      }
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

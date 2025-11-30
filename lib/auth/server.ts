import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { redirect } from "next/navigation"

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key-here-change-in-production"

export interface AuthUser {
  userId: string
  email: string
  role?: string
  [key: string]: any
}

/**
 * Verify JWT token from cookies
 * This replaces the middleware auth logic for Next.js 16
 */
export async function verifyAuth(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value

  if (!token) {
    return null
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    return payload as AuthUser
  } catch (error) {
    console.error("JWT verification failed:", error)
    return null
  }
}

/**
 * Require authentication - redirects to login if not authenticated
 * Use this in server components/layouts for protected routes
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await verifyAuth()
  
  if (!user) {
    redirect("/auth/login")
  }
  
  return user
}

/**
 * Check if user is authenticated
 * Use this to conditionally redirect authenticated users away from auth pages
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await verifyAuth()
  return user !== null
}

/**
 * Get current user or null
 * Use this when you want to check auth without redirecting
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  return await verifyAuth()
}

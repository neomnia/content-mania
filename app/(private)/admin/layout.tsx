import type React from "react"
import { requireAdmin } from "@/lib/auth/server"
import { redirect } from "next/navigation"
import { AdminClientGuard } from "./admin-client-guard"

/**
 * Admin Layout - Dual Protection (Server + Client)
 *
 * IMPORTANT: This layout protects ALL routes under /admin with TWO layers:
 * 1. Server-side: requireAdmin() checks roles from database
 * 2. Client-side: AdminClientGuard checks roles via API
 *
 * Only users with 'admin' or 'super_admin' roles can access
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  console.log("[ADMIN LAYOUT] ==========================================")
  console.log("[ADMIN LAYOUT] Admin layout is being executed (SERVER-SIDE)!")
  console.log("[ADMIN LAYOUT] Timestamp:", new Date().toISOString())

  try {
    // SERVER-SIDE: Verify admin access - will throw/redirect if not admin
    const user = await requireAdmin()

    console.log("[ADMIN LAYOUT] ✅ SERVER-SIDE: Admin access GRANTED for user:", user.email)
    console.log("[ADMIN LAYOUT] Now rendering CLIENT-SIDE guard...")
    console.log("[ADMIN LAYOUT] ==========================================")

    // CLIENT-SIDE: Additional protection layer
    return <AdminClientGuard>{children}</AdminClientGuard>
  } catch (error) {
    console.log("[ADMIN LAYOUT] ❌ SERVER-SIDE: Admin access DENIED - Exception caught:", error)
    console.log("[ADMIN LAYOUT] Redirecting to /dashboard...")
    console.log("[ADMIN LAYOUT] ==========================================")

    // Explicit redirect if requireAdmin didn't already redirect
    redirect("/dashboard")
  }
}

// Force dynamic rendering - disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

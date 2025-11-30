import type React from "react"
import { requireAuth } from "@/lib/auth/server"
import { PrivateLayoutClient } from "./layout-client"

/**
 * Private Layout - Server Component
 *
 * This layout replaces middleware auth logic for Next.js 16.
 * It verifies authentication server-side before rendering protected routes.
 */
export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  // Verify authentication - redirects to login if not authenticated
  await requireAuth()

  return <PrivateLayoutClient>{children}</PrivateLayoutClient>
}

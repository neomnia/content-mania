import type React from "react"
import type { Metadata } from "next/metadata"
import Link from "next/link"
import { redirect } from "next/navigation"
import { MinimalFooter } from "@/components/layout/minimal-footer"
import { isAuthenticated } from "@/lib/auth/server"

export const metadata: Metadata = {
  title: "Authentication - NeoSaaS",
  description: "Authentication pages for NeoSaaS",
}

/**
 * Auth Layout - Server Component
 *
 * This layout replaces middleware auth redirect logic for Next.js 16.
 * It redirects authenticated users away from auth pages to dashboard.
 */
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Redirect authenticated users to dashboard
  const authenticated = await isAuthenticated()
  if (authenticated) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="p-4">
        <Link href="/" className="flex items-center">
          <div className="font-bold text-2xl tracking-tight">
            <span className="text-foreground">Neo</span>
            <span className="text-[#CD7F32]">SaaS</span>
          </div>
        </Link>
      </div>
      <div className="flex-1">{children}</div>
      <MinimalFooter />
    </div>
  )
}

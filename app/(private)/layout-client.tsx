"use client"

import type React from "react"
import { PrivateSidebar } from "@/components/layout/private-dashboard/sidebar"
import { PrivateHeader } from "@/components/layout/private-dashboard/header"
import { UserProvider } from "@/lib/contexts/user-context"
import { PlatformConfigProvider, type PlatformConfig } from "@/contexts/platform-config-context"
import { useState } from "react"

interface User {
  userId: string
  email: string
  roles?: string[]
  permissions?: string[]
}

interface PrivateLayoutClientProps {
  children: React.ReactNode
  user: User
  platformConfig: PlatformConfig
}

export function PrivateLayoutClient({ children, user, platformConfig }: PrivateLayoutClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <PlatformConfigProvider config={platformConfig}>
      <UserProvider>
        <div className="flex h-screen">
          <PrivateSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          <div className="flex flex-1 flex-col">
            <PrivateHeader onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
            <main className="flex-1 overflow-y-auto bg-muted/30 p-6">{children}</main>
          </div>
        </div>
      </UserProvider>
    </PlatformConfigProvider>
  )
}

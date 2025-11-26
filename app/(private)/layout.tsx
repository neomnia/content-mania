"use client"

import type React from "react"

import { PrivateSidebar } from "@/components/private-dashboard/sidebar"
import { PrivateHeader } from "@/components/private-dashboard/header"
import { useState } from "react"

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen">
      <PrivateSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex flex-1 flex-col">
        <PrivateHeader onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">{children}</main>
      </div>
    </div>
  )
}

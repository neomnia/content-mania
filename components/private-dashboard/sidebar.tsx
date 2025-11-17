"use client"

import Link from "next/link"
import { usePathname } from 'next/navigation'
import { Home, Users, CreditCard, Building2, LogOut } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const navItems = [
  { name: "Overview", href: "/dashboard", icon: Home },
  { name: "Users", href: "/dashboard/users", icon: Users },
  { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
  { name: "Enterprise", href: "/dashboard/enterprise", icon: Building2 },
]

export function PrivateSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-[#5B8FF9] flex items-center justify-center">
            <span className="font-bold text-white text-sm">NS</span>
          </div>
          <span className="font-bold text-lg">
            <span className="text-foreground">Neo</span>
            <span className="text-[#CD7F32]">SaaS</span>
          </span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#5B8FF9] text-white"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="border-t p-4">
        <Button
          asChild
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
        >
          <Link href="/auth/login" className="flex items-center gap-3">
            <LogOut className="h-5 w-5" />
            Log out
          </Link>
        </Button>
      </div>
    </aside>
  )
}

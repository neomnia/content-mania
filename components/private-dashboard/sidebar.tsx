"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  CreditCard,
  Building2,
  LogOut,
  User,
  Shield,
  Settings,
  Key,
  Mail,
  X,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const navItems = [
  { name: "Overview", href: "/dashboard", icon: Home },
  { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
  { name: "Enterprise", href: "/dashboard/enterprise", icon: Building2 },
  { name: "Profile", href: "/dashboard/profile", icon: User },
]

const adminItems = [
  { name: "Dashboard", href: "/admin", icon: Shield },
  { name: "API Management", href: "/admin/api", icon: Key },
  { name: "Pages ACL", href: "/admin/pages", icon: Settings },
  { name: "Mail Management", href: "/admin/mail", icon: Mail },
]

interface PrivateSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function PrivateSidebar({ isOpen = false, onClose }: PrivateSidebarProps) {
  const pathname = usePathname()
  const [isAdminOpen, setIsAdminOpen] = useState(
    pathname.startsWith("/admin") || pathname.startsWith("/dashboard/admin"),
  )
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleLinkClick = () => {
    if (onClose) onClose()
  }

  return (
    <TooltipProvider delayDuration={0}>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} />}

      <aside
        className={cn(
          "fixed md:static inset-y-0 left-0 z-50 flex flex-col border-r bg-background transition-all duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          isCollapsed ? "w-[68px]" : "w-64",
        )}
      >
        <div className={cn("flex h-16 items-center border-b", isCollapsed ? "px-3 justify-center" : "px-6")}>
          <Link href="/dashboard" className="flex items-center gap-2" onClick={handleLinkClick}>
            <div className="h-8 w-8 rounded-lg bg-[#CD7F32] flex items-center justify-center flex-shrink-0">
              <span className="font-bold text-white text-sm">NS</span>
            </div>
            {!isCollapsed && (
              <span className="font-bold text-lg">
                <span className="text-foreground">Neo</span>
                <span className="text-[#CD7F32]">SaaS</span>
              </span>
            )}
          </Link>
          {isOpen && !isCollapsed && (
            <Button variant="ghost" size="icon" className="ml-auto md:hidden" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        <nav className={cn("flex-1 space-y-1 overflow-y-auto", isCollapsed ? "p-2" : "p-4")}>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            const linkContent = (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-3 rounded-lg text-sm font-medium transition-colors",
                  isCollapsed ? "px-3 py-2 justify-center" : "px-3 py-2",
                  isActive ? "bg-[#CD7F32] text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && item.name}
              </Link>
            )

            if (isCollapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">{item.name}</TooltipContent>
                </Tooltip>
              )
            }
            return linkContent
          })}

          {isCollapsed ? (
            // Collapsed: show admin items directly with tooltips
            <div className="pt-2 border-t mt-2 space-y-1">
              {adminItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        onClick={handleLinkClick}
                        className={cn(
                          "flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-[#CD7F32] text-white"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.name}</TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          ) : (
            // Expanded: keep collapsible admin section
            <Collapsible open={isAdminOpen} onOpenChange={setIsAdminOpen}>
              <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5" />
                  <span>Admin</span>
                </div>
                <ChevronDown className={cn("h-4 w-4 transition-transform", isAdminOpen && "rotate-180")} />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1 space-y-1 pl-6">
                {adminItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleLinkClick}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-[#CD7F32] text-white"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  )
                })}
              </CollapsibleContent>
            </Collapsible>
          )}
        </nav>

        <div className={cn("border-t", isCollapsed ? "p-2" : "p-4")}>
          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "sm"}
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "hidden md:flex mb-2 text-muted-foreground hover:text-foreground",
              isCollapsed ? "w-full justify-center" : "w-full justify-start",
            )}
          >
            {isCollapsed ? (
              <PanelLeft className="h-5 w-5" />
            ) : (
              <>
                <PanelLeftClose className="h-5 w-5 mr-2" />
                <span>Collapse</span>
              </>
            )}
          </Button>

          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <Link href="/auth/login" onClick={handleLinkClick}>
                    <LogOut className="h-5 w-5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Log out</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <Link href="/auth/login" className="flex items-center gap-3" onClick={handleLinkClick}>
                <LogOut className="h-5 w-5" />
                Log out
              </Link>
            </Button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}

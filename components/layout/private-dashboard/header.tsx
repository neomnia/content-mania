"use client"

import { Menu, LogOut, User, CreditCard, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/common/theme-toggle"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface UserData {
  firstName: string
  lastName: string
  email: string
  role: string
  position?: string
  profileImage: string | null
}

interface PrivateHeaderProps {
  onMenuClick?: () => void
}

export function PrivateHeader({ onMenuClick }: PrivateHeaderProps) {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Array<{ name: string; path: string }>>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    } else {
      // Default mock data
      setUser({
        firstName: "Musharof",
        lastName: "Chowdhury",
        email: "randomuser@pimjo.com",
        role: "Team Manager",
        position: "Team Manager",
        profileImage: null,
      })
    }

    const handleStorageChange = () => {
      const updatedUser = localStorage.getItem("user")
      if (updatedUser) {
        setUser(JSON.parse(updatedUser))
      }
    }

    window.addEventListener("storage", handleStorageChange)
    const interval = setInterval(handleStorageChange, 1000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (searchQuery.length > 0) {
      setIsSearching(true)
      const timer = setTimeout(() => {
        const adminPages = [
          { name: "Admin Dashboard", path: "/admin" },
          { name: "API Management", path: "/admin/api" },
          { name: "Mail Configuration", path: "/admin/mail" },
          { name: "Pages ACL", path: "/admin/pages" },
        ]

        const filtered = adminPages.filter(
          (page) =>
            page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            page.path.toLowerCase().includes(searchQuery.toLowerCase()),
        )

        setSearchResults(filtered)
        setIsSearching(false)
      }, 300)

      return () => clearTimeout(timer)
    } else {
      setSearchResults([])
      setIsSearching(false)
    }
  }, [searchQuery])

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch (error) {
      console.error("Logout failed", error)
    }
    localStorage.removeItem("user")
    localStorage.removeItem("authToken")
    toast.success("Logged out successfully")
    // Force full page reload to ensure cookies are cleared and auth state is reset
    window.location.href = "/auth/login"
  }

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <div className="relative hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search admin pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 h-9 pl-9 pr-4 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#CD7F32] focus:border-transparent"
            />
          </div>

          {searchQuery && (
            <div className="absolute top-full mt-2 w-full bg-background border rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map((result) => (
                  <button
                    key={result.path}
                    onClick={() => {
                      router.push(result.path)
                      setSearchQuery("")
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                  >
                    <Search className="h-4 w-4 text-[#CD7F32]" />
                    <div>
                      <div className="font-medium">{result.name}</div>
                      <div className="text-xs text-muted-foreground">{result.path}</div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">No results found</div>
              )}
            </div>
          )}
        </div>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10 border-2 border-[#CD7F32]/20">
                <AvatarImage
                  src={user?.profileImage || "/placeholder.svg?height=40&width=40"}
                  alt={user ? `${user.firstName} ${user.lastName}` : "User"}
                />
                <AvatarFallback className="bg-[#CD7F32] text-white font-semibold">
                  {user ? getInitials(user.firstName, user.lastName) : "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold">{user ? `${user.firstName} ${user.lastName}` : "User"}</p>
                <p className="text-xs text-muted-foreground">{user?.email || "user@neosaas.com"}</p>
                <p className="text-xs text-[#CD7F32] font-medium">{user?.position || user?.role || "Member"}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile & Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/payments" className="cursor-pointer">
                <CreditCard className="mr-2 h-4 w-4" />
                Billing & Payments
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

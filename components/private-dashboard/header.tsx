"use client"

import { Menu } from 'lucide-react'
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
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { useEffect, useState } from 'react'

interface UserData {
  name: string
  email: string
  imageUrl: string | null
}

export function PrivateHeader() {
  const [user, setUser] = useState<UserData | null>(null)

  useEffect(() => {
    // TODO: Fetch real user data from session/database
    // For now, using mock data
    setUser({
      name: "John Doe",
      email: "john.doe@neosaas.com",
      imageUrl: null, // Will be loaded from /user-pictures/{userId}.jpg
    })
  }, [])

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
      <Button variant="ghost" size="icon" className="md:hidden">
        <Menu className="h-5 w-5" />
      </Button>
      
      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage 
                  src={user?.imageUrl || "/placeholder.svg?height=40&width=40"} 
                  alt={user?.name || "User"} 
                />
                <AvatarFallback className="bg-[#5B8FF9] text-white font-semibold">
                  {user ? getInitials(user.name) : "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground">{user?.email || "user@example.com"}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard">Dashboard</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/enterprise">Enterprise</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

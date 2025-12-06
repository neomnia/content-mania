"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Shield, Globe, Users } from "lucide-react"
import { useState, useEffect } from "react"
import { getPages, updatePageAccess, syncPages, type AccessLevel } from "@/app/actions/pages"
import { toast } from "sonner"

interface Page {
  path: string
  name: string
  access: AccessLevel
  group: string
}

const defaultPages: Page[] = [
  { path: "/", name: "Home Page", access: "public", group: "Public" },
  { path: "/features", name: "Features", access: "public", group: "Public" },
  { path: "/pricing", name: "Pricing", access: "public", group: "Public" },
  { path: "/docs", name: "Documentation", access: "public", group: "Public" },
  { path: "/auth/login", name: "Login", access: "public", group: "Authentication" },
  { path: "/auth/register", name: "Register", access: "public", group: "Authentication" },
  { path: "/dashboard", name: "Dashboard Overview", access: "user", group: "Dashboard" },
  { path: "/dashboard/profile", name: "User Profile", access: "user", group: "Dashboard" },
  { path: "/dashboard/payments", name: "Payments", access: "user", group: "Dashboard" },
  { path: "/dashboard/company-management", name: "Company Management", access: "user", group: "Dashboard" },
  { path: "/dashboard/checkout", name: "Checkout", access: "user", group: "Dashboard" },
  { path: "/admin", name: "Admin Dashboard", access: "admin", group: "Admin" },
  { path: "/admin/api", name: "API Management", access: "admin", group: "Admin" },
  { path: "/admin/pages", name: "Pages ACL", access: "admin", group: "Admin" },
  { path: "/admin/mail", name: "Mail Management", access: "admin", group: "Admin" },
]

export default function PagesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [pages, setPages] = useState<Page[]>([])
  const [filteredPages, setFilteredPages] = useState<Page[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPages = async () => {
      setIsLoading(true)
      const result = await getPages()
      if (result.success && result.data && result.data.length > 0) {
        // Map DB result to Page interface
        const dbPages = result.data.map(p => ({
          path: p.path,
          name: p.name,
          access: p.access as AccessLevel,
          group: p.group
        }))
        setPages(dbPages)
        setFilteredPages(dbPages)
      } else {
        // If no pages in DB, sync default pages
        await syncPages(defaultPages)
        setPages(defaultPages)
        setFilteredPages(defaultPages)
      }
      setIsLoading(false)
    }
    fetchPages()
  }, [])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) {
        setIsSearching(true)
        const filtered = pages.filter(
          (page) =>
            page.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
            page.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            page.group.toLowerCase().includes(searchTerm.toLowerCase()),
        )
        setFilteredPages(filtered)
        setIsSearching(false)
      } else {
        setFilteredPages(pages)
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm, pages])

  const getAccessBadge = (access: AccessLevel) => {
    switch (access) {
      case "public":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <Globe className="w-3 h-3 mr-1" /> Public
          </Badge>
        )
      case "user":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <Users className="w-3 h-3 mr-1" /> User/Customer
          </Badge>
        )
      case "admin":
        return (
          <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            <Shield className="w-3 h-3 mr-1" /> Admin
          </Badge>
        )
      case "super-admin":
        return (
          <Badge variant="secondary" className="bg-[#CD7F32]/20 text-[#CD7F32]">
            <Shield className="w-3 h-3 mr-1" /> Super Admin
          </Badge>
        )
    }
  }

  const handleAccessChange = async (path: string, newAccess: AccessLevel) => {
    setPages((prev) => prev.map((page) => (page.path === path ? { ...page, access: newAccess } : page)))
    
    const result = await updatePageAccess(path, newAccess)
    if (result.success) {
      toast.success(`Access for ${path} updated to ${newAccess}`)
    } else {
      toast.error("Failed to update access")
      // Revert on failure (could fetch again)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#1A1A1A]">Access Control</h1>
        <p className="text-muted-foreground mt-1">Manage page visibility and access permissions</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Page Permissions</CardTitle>
              <CardDescription>Configure access levels for all application routes</CardDescription>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by page name, path, or group..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {isSearching && (
                <div className="absolute right-3 top-2.5">
                  <div className="h-4 w-4 border-2 border-[#CD7F32] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-4 p-4 bg-muted rounded-lg">
            <div className="text-sm">
              <span className="font-semibold">Access Levels:</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4 text-green-600" />
              <span>
                <strong>Public:</strong> Everyone
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-blue-600" />
              <span>
                <strong>User/Customer:</strong> Logged in users (all dedicated pages accessible)
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-orange-600" />
              <span>
                <strong>Admin:</strong> Administrators (content & users)
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-[#CD7F32]" />
              <span>
                <strong>Super Admin:</strong> Full system access
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page Name</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Current Access</TableHead>
                <TableHead>Change Access</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading pages...
                  </TableCell>
                </TableRow>
              ) : filteredPages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No pages found matching "{searchTerm}"
                  </TableCell>
                </TableRow>
              ) : (
                filteredPages.map((page) => (
                  <TableRow key={page.path}>
                    <TableCell className="font-medium">{page.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{page.path}</TableCell>
                    <TableCell>
                      <span className="text-xs px-2 py-1 bg-muted rounded">{page.group}</span>
                    </TableCell>
                    <TableCell>{getAccessBadge(page.access)}</TableCell>
                    <TableCell>
                      <Select
                        value={page.access}
                        onValueChange={(value: AccessLevel) => handleAccessChange(page.path, value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4" /> Public
                            </div>
                          </SelectItem>
                          <SelectItem value="user">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" /> User/Customer
                            </div>
                          </SelectItem>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4" /> Admin
                            </div>
                          </SelectItem>
                          <SelectItem value="super-admin">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4" /> Super Admin
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

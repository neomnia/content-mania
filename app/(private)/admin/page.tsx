"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Upload,
  Save,
  Shield,
  Settings,
  Globe,
  Share2,
  Twitter,
  Facebook,
  Linkedin,
  Github,
  Instagram,
  Wrench,
  Send,
  UserX,
  X,
} from "lucide-react"

export default function AdminPage() {
  const [siteName, setSiteName] = useState("NeoSaaS")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>("/placeholder.svg?height=100&width=100")
  const [authEnabled, setAuthEnabled] = useState(true)
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [customHeaderCode, setCustomHeaderCode] = useState("")
  const [customFooterCode, setCustomFooterCode] = useState("")
  const [newAdminEmail, setNewAdminEmail] = useState("")
  const [newAdminRole, setNewAdminRole] = useState<"admin" | "super-admin">("admin")
  const [gtmCode, setGtmCode] = useState("")

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#1A1A1A]">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage your site configuration, SEO, and administrators</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general" className="data-[state=active]:bg-[#CD7F32] data-[state=active]:text-white">
            General Settings
          </TabsTrigger>
          <TabsTrigger value="seo" className="data-[state=active]:bg-[#CD7F32] data-[state=active]:text-white">
            SEO & Social
          </TabsTrigger>
          <TabsTrigger value="technical" className="data-[state=active]:bg-[#CD7F32] data-[state=active]:text-white">
            Technical
          </TabsTrigger>
          <TabsTrigger value="admins" className="data-[state=active]:bg-[#CD7F32] data-[state=active]:text-white">
            Administrators
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-[#CD7F32]" />
                  Site Configuration
                </CardTitle>
                <CardDescription>Manage your platform name and branding</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="Enter site name"
                  />
                  <p className="text-xs text-muted-foreground">Displayed on the platform and in communications</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo">Main Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-24 w-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-white">
                      {logoPreview ? (
                        <img
                          src={logoPreview || "/placeholder.svg"}
                          alt="Logo preview"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <Upload className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <Input
                        id="logo"
                        type="file"
                        accept="image/svg+xml,image/png,image/jpeg"
                        onChange={handleLogoChange}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        SVG, PNG recommended. Used for favicon generation.
                      </p>
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-[#CD7F32] hover:bg-[#B8691C]">
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#CD7F32]" />
                  Authentication
                </CardTitle>
                <CardDescription>Manage authentication and security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Authentication Status</p>
                    <p className="text-sm text-muted-foreground">Enable or disable user authentication</p>
                  </div>
                  <Button
                    variant={authEnabled ? "default" : "outline"}
                    size="sm"
                    className={authEnabled ? "bg-green-600 hover:bg-green-700" : ""}
                    onClick={() => setAuthEnabled(!authEnabled)}
                  >
                    {authEnabled ? "Enabled" : "Disabled"}
                  </Button>
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  <p className="font-medium text-sm">AUTH_SECRET</p>
                  <Input type="password" placeholder="••••••••••••••••••••" className="font-mono text-xs" />
                  <p className="text-xs text-muted-foreground">JWT secret key for token signing</p>
                </div>

                <Button className="w-full bg-[#CD7F32] hover:bg-[#B8691C]">
                  <Save className="h-4 w-4 mr-2" />
                  Update Authentication
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Custom Code Injection section */}
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-[#CD7F32]" />
                  Custom Code Injection
                </CardTitle>
                <CardDescription>
                  Add custom HTML or JavaScript to all pages (inserted in head or before closing body tag)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customHeaderCode">Header Code (in {"<head>"})</Label>
                  <Textarea
                    id="customHeaderCode"
                    value={customHeaderCode}
                    onChange={(e) => setCustomHeaderCode(e.target.value)}
                    placeholder={`<!-- Example: Google Analytics -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>\n<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag('js', new Date());\n  gtag('config', 'GA_MEASUREMENT_ID');\n</script>`}
                    rows={8}
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    This code will be injected in the {"<head>"} section of all pages (analytics, meta tags, etc.)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customFooterCode">Footer Code (before {"</body>"})</Label>
                  <Textarea
                    id="customFooterCode"
                    value={customFooterCode}
                    onChange={(e) => setCustomFooterCode(e.target.value)}
                    placeholder={`<!-- Example: Chat widget -->\n<script>\n  (function() {\n    // Your custom script here\n  })();\n</script>`}
                    rows={8}
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    This code will be injected before the closing {"</body>"} tag (chat widgets, tracking pixels, etc.)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gtmCode">Google Tag Manager ID</Label>
                  <Input
                    id="gtmCode"
                    placeholder="GTM-XXXXXXX"
                    className="font-mono"
                    value={gtmCode}
                    onChange={(e) => setGtmCode(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your GTM container ID (e.g., GTM-XXXXXXX). The GTM script will be automatically injected in
                    the header.
                  </p>
                </div>

                <div className="p-4 border rounded-lg space-y-2 bg-yellow-50 dark:bg-yellow-950/20">
                  <div className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Security Warning</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Only add code from trusted sources. Malicious scripts can compromise your site security. Test in
                        a development environment first.
                      </p>
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-[#CD7F32] hover:bg-[#B8691C]">
                  <Save className="h-4 w-4 mr-2" />
                  Save Custom Code
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SEO Management Tab */}
        <TabsContent value="seo">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-[#CD7F32]" />
                  SEO & Metadata
                </CardTitle>
                <CardDescription>Configure search engine optimization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Site Title Template</Label>
                    <Input defaultValue="%s | NeoSaaS" />
                    <p className="text-xs text-muted-foreground">Use %s for the page title</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Base URL</Label>
                    <Input defaultValue="https://neosaas.com" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Default Meta Description</Label>
                  <Textarea placeholder="Enter a brief description of your site..." rows={3} />
                </div>

                <div className="space-y-2">
                  <Label>Keywords</Label>
                  <Input placeholder="saas, dashboard, admin, nextjs..." />
                  <p className="text-xs text-muted-foreground">Comma separated keywords</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-[#CD7F32]" />
                  Social Sharing (Open Graph)
                </CardTitle>
                <CardDescription>Customize how your site appears when shared on social media</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label>OG Title</Label>
                      <Input defaultValue="NeoSaaS - Modern Admin Dashboard" />
                    </div>
                    <div className="space-y-2">
                      <Label>OG Description</Label>
                      <Textarea rows={3} defaultValue="The ultimate solution for your SaaS application." />
                    </div>
                  </div>
                  <div className="w-1/3 space-y-2">
                    <Label>OG Image</Label>
                    <div className="aspect-video bg-muted rounded-lg border-2 border-dashed flex items-center justify-center relative overflow-hidden group cursor-pointer">
                      <div className="text-center p-4">
                        <p className="text-sm font-medium">Click to upload</p>
                        <p className="text-xs text-muted-foreground">1200x630px recommended</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-[#CD7F32]" />
                  Social Media Links
                </CardTitle>
                <CardDescription>Connect your social profiles (used in public footer)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Twitter className="h-4 w-4" /> Twitter / X
                    </Label>
                    <Input placeholder="https://x.com/username" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Facebook className="h-4 w-4" /> Facebook
                    </Label>
                    <Input placeholder="https://facebook.com/page" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4" /> LinkedIn
                    </Label>
                    <Input placeholder="https://linkedin.com/company/..." />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Instagram className="h-4 w-4" /> Instagram
                    </Label>
                    <Input placeholder="https://instagram.com/username" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Github className="h-4 w-4" /> GitHub
                    </Label>
                    <Input placeholder="https://github.com/username" />
                  </div>
                </div>
                <Button className="bg-[#CD7F32] hover:bg-[#B8691C]">
                  <Save className="h-4 w-4 mr-2" /> Save All SEO Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Technical Tab */}
        <TabsContent value="technical">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-[#CD7F32]" />
                Technical Settings
              </CardTitle>
              <CardDescription>Manage maintenance mode and technical configurations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-6 bg-muted rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`h-3 w-3 rounded-full ${maintenanceMode ? "bg-orange-500" : "bg-green-500"} animate-pulse`}
                    />
                    <p className="font-semibold text-lg">
                      {maintenanceMode ? "Maintenance Mode Active" : "Site is Live"}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {maintenanceMode
                      ? "Your site is currently in maintenance mode. Visitors will see the maintenance page."
                      : "Your site is live and accessible to all visitors."}
                  </p>
                </div>
                <Button
                  variant={maintenanceMode ? "destructive" : "default"}
                  size="lg"
                  className={maintenanceMode ? "" : "bg-[#CD7F32] hover:bg-[#B8691C]"}
                  onClick={() => setMaintenanceMode(!maintenanceMode)}
                >
                  {maintenanceMode ? "Go Live" : "Enable Maintenance"}
                </Button>
              </div>

              <div className="p-4 border rounded-lg space-y-3 bg-orange-50 dark:bg-orange-950/20">
                <div className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">About Maintenance Mode</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      When enabled, all visitors will be redirected to a maintenance page. Admin users can still access
                      the dashboard. This is useful when performing updates, database migrations, or system maintenance.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Maintenance Message (Optional)</Label>
                <Textarea
                  placeholder="We're currently performing scheduled maintenance. We'll be back shortly!"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">Custom message displayed on the maintenance page</p>
              </div>

              <Button className="w-full bg-[#CD7F32] hover:bg-[#B8691C]">
                <Save className="h-4 w-4 mr-2" />
                Save Technical Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Administrators Tab */}
        <TabsContent value="admins">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#CD7F32]" />
                  Administrator Management
                </CardTitle>
                <CardDescription>Invite administrators and manage their access levels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-muted rounded-lg space-y-4">
                  <p className="text-sm font-medium">Invite New Administrator</p>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="md:col-span-2">
                      <Label htmlFor="adminEmail">Email Address</Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        placeholder="admin@example.com"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="adminRole">Role</Label>
                      <Select
                        value={newAdminRole}
                        onValueChange={(value: "admin" | "super-admin") => setNewAdminRole(value)}
                      >
                        <SelectTrigger id="adminRole">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="super-admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-muted-foreground">
                      <strong>Admin:</strong> Can manage content, users, and settings. <strong>Super Admin:</strong>{" "}
                      Full access including user revocation and system config.
                    </p>
                  </div>
                  <Button
                    className="w-full bg-[#CD7F32] hover:bg-[#B8691C]"
                    onClick={() => {
                      console.log("[v0] Inviting admin:", newAdminEmail, "as", newAdminRole)
                      // API call would go here
                      setNewAdminEmail("")
                    }}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Invitation
                  </Button>
                </div>

                <div>
                  <p className="text-sm font-medium mb-3">Current Administrators</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">John Doe</TableCell>
                        <TableCell>john@neosaas.com</TableCell>
                        <TableCell>
                          <Badge className="bg-[#CD7F32]/20 text-[#CD7F32]">Super Admin</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">(Owner)</span>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Jane Smith</TableCell>
                        <TableCell>jane@neosaas.com</TableCell>
                        <TableCell>
                          <Badge variant="outline">Admin</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => console.log("[v0] Revoking admin access for jane@neosaas.com")}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Revoke
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Bob Wilson</TableCell>
                        <TableCell>bob@example.com</TableCell>
                        <TableCell>
                          <Badge variant="outline">Admin</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            Pending
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => console.log("[v0] Canceling invitation for bob@example.com")}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

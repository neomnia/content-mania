"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  Upload,
  Save,
  Settings,
  Globe,
  Share2,
  Twitter,
  Facebook,
  Linkedin,
  Github,
  Instagram,
  Wrench,
  X,
  Shield,
} from "lucide-react"
import { useRequireAdmin } from "@/lib/hooks/use-require-admin"

export default function AdminPage() {
  // Client-side admin guard - second layer of protection
  const { isChecking, isAdmin } = useRequireAdmin()

  const [siteName, setSiteName] = useState("NeoSaaS")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>("/placeholder.svg?height=100&width=100")
  const [authEnabled, setAuthEnabled] = useState(true)
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [maintenanceMessage, setMaintenanceMessage] = useState("")
  const [customHeaderCode, setCustomHeaderCode] = useState("")
  const [customFooterCode, setCustomFooterCode] = useState("")
  const [gtmCode, setGtmCode] = useState("")
  
  const [seoSettings, setSeoSettings] = useState({
    titleTemplate: "%s | NeoSaaS",
    baseUrl: "https://neosaas.com",
    description: "",
    keywords: "",
    ogTitle: "NeoSaaS - Modern Admin Dashboard",
    ogDescription: "The ultimate solution for your SaaS application.",
  })

  const [socialLinks, setSocialLinks] = useState({
    twitter: "",
    facebook: "",
    linkedin: "",
    instagram: "",
    github: "",
  })

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

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/admin/config');
        if (res.ok) {
          const data = await res.json();
          if (data.site_name) setSiteName(data.site_name);
          if (data.logo) setLogoPreview(data.logo);
          if (data.auth_enabled !== undefined) setAuthEnabled(data.auth_enabled === 'true');
          if (data.maintenance_mode !== undefined) setMaintenanceMode(data.maintenance_mode === 'true');
          if (data.maintenance_message) setMaintenanceMessage(data.maintenance_message);
          if (data.custom_header_code) setCustomHeaderCode(data.custom_header_code);
          if (data.custom_footer_code) setCustomFooterCode(data.custom_footer_code);
          if (data.gtm_code) setGtmCode(data.gtm_code);
          if (data.seo_settings) setSeoSettings(prev => ({ ...prev, ...data.seo_settings }));
          if (data.social_links) setSocialLinks(prev => ({ ...prev, ...data.social_links }));
        }
      } catch (error) {
        console.error('Failed to fetch config', error);
      }
    };
    if (isAdmin) fetchConfig();
  }, [isAdmin]);

  const handleSaveConfig = async () => {
    try {
      const formData = new FormData();
      formData.append('siteName', siteName);
      formData.append('authEnabled', authEnabled.toString());
      formData.append('maintenanceMode', maintenanceMode.toString());
      formData.append('maintenanceMessage', maintenanceMessage);
      formData.append('customHeaderCode', customHeaderCode);
      formData.append('customFooterCode', customFooterCode);
      formData.append('gtmCode', gtmCode);
      formData.append('seoSettings', JSON.stringify(seoSettings));
      formData.append('socialLinks', JSON.stringify(socialLinks));
      
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      const res = await fetch('/api/admin/config', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to save config');
      
      toast.success('Configuration saved successfully');
    } catch (error) {
      toast.error('Failed to save configuration');
    }
  };

  // Show loading state while checking admin access
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="h-12 w-12 animate-pulse text-[#CD7F32] mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Vérification des droits d'accès...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if not admin (will be redirected)
  if (!isAdmin) {
    return null
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

                <Button onClick={handleSaveConfig} className="w-full bg-[#CD7F32] hover:bg-[#B8691C]">
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </Button>
              </CardContent>
            </Card>

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
                    size="sm"
                    className={maintenanceMode ? "" : "bg-[#CD7F32] hover:bg-[#B8691C]"}
                    onClick={() => setMaintenanceMode(!maintenanceMode)}
                  >
                    {maintenanceMode ? "Go Live" : "Enable Maintenance"}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Maintenance Message (Optional)</Label>
                  <Textarea
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    placeholder="We're currently performing scheduled maintenance. We'll be back shortly!"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">Custom message displayed on the maintenance page</p>
                </div>

                <Button onClick={handleSaveConfig} className="w-full bg-[#CD7F32] hover:bg-[#B8691C]">
                  <Save className="h-4 w-4 mr-2" />
                  Save Technical Settings
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

                <Button onClick={handleSaveConfig} className="w-full bg-[#CD7F32] hover:bg-[#B8691C]">
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
                    <Input 
                      value={seoSettings.titleTemplate}
                      onChange={(e) => setSeoSettings({...seoSettings, titleTemplate: e.target.value})}
                      placeholder="%s | NeoSaaS" 
                    />
                    <p className="text-xs text-muted-foreground">Use %s for the page title</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Base URL</Label>
                    <Input 
                      value={seoSettings.baseUrl}
                      onChange={(e) => setSeoSettings({...seoSettings, baseUrl: e.target.value})}
                      placeholder="https://neosaas.com" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Default Meta Description</Label>
                  <Textarea 
                    value={seoSettings.description}
                    onChange={(e) => setSeoSettings({...seoSettings, description: e.target.value})}
                    placeholder="Enter a brief description of your site..." 
                    rows={3} 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Keywords</Label>
                  <Input 
                    value={seoSettings.keywords}
                    onChange={(e) => setSeoSettings({...seoSettings, keywords: e.target.value})}
                    placeholder="saas, dashboard, admin, nextjs..." 
                  />
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
                      <Input 
                        value={seoSettings.ogTitle}
                        onChange={(e) => setSeoSettings({...seoSettings, ogTitle: e.target.value})}
                        placeholder="NeoSaaS - Modern Admin Dashboard" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>OG Description</Label>
                      <Textarea 
                        value={seoSettings.ogDescription}
                        onChange={(e) => setSeoSettings({...seoSettings, ogDescription: e.target.value})}
                        rows={3} 
                        placeholder="The ultimate solution for your SaaS application." 
                      />
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
                    <Input 
                      value={socialLinks.twitter}
                      onChange={(e) => setSocialLinks({...socialLinks, twitter: e.target.value})}
                      placeholder="https://x.com/username" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Facebook className="h-4 w-4" /> Facebook
                    </Label>
                    <Input 
                      value={socialLinks.facebook}
                      onChange={(e) => setSocialLinks({...socialLinks, facebook: e.target.value})}
                      placeholder="https://facebook.com/page" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4" /> LinkedIn
                    </Label>
                    <Input 
                      value={socialLinks.linkedin}
                      onChange={(e) => setSocialLinks({...socialLinks, linkedin: e.target.value})}
                      placeholder="https://linkedin.com/company/..." 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Instagram className="h-4 w-4" /> Instagram
                    </Label>
                    <Input 
                      value={socialLinks.instagram}
                      onChange={(e) => setSocialLinks({...socialLinks, instagram: e.target.value})}
                      placeholder="https://instagram.com/username" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Github className="h-4 w-4" /> GitHub
                    </Label>
                    <Input 
                      value={socialLinks.github}
                      onChange={(e) => setSocialLinks({...socialLinks, github: e.target.value})}
                      placeholder="https://github.com/username" 
                    />
                  </div>
                </div>
                <Button onClick={handleSaveConfig} className="bg-[#CD7F32] hover:bg-[#B8691C]">
                  <Save className="h-4 w-4 mr-2" /> Save All SEO Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, Save, RefreshCw, Key, Cloud } from "lucide-react"

const services = [
  { id: "resend", name: "Resend", icon: "📧" },
  { id: "scaleway", name: "Scaleway", icon: "scaleway" },
  { id: "aws", name: "AWS SES", icon: "☁️" },
  { id: "neon", name: "Neon DB", icon: "🐘" },
  { id: "stripe", name: "Stripe", icon: "💳" },
  { id: "lago", name: "Lago", icon: "📊" },
]

function ScalewayIcon({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center rounded bg-purple-600 text-white ${className}`}>
      <Cloud className="h-3 w-3" />
    </div>
  )
}

function ServiceIcon({ service, size = "sm" }: { service: (typeof services)[0]; size?: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "h-5 w-5" : "h-6 w-6"
  if (service.icon === "scaleway") {
    return <ScalewayIcon className={sizeClass} />
  }
  return <span>{service.icon}</span>
}

export default function AdminApiPage() {
  const [selectedService, setSelectedService] = useState(services[0].id)
  const [showKey, setShowKey] = useState(false)
  const [showSecretKey, setShowSecretKey] = useState(false)

  const currentService = services.find((s) => s.id === selectedService)
  const isScaleway = selectedService === "scaleway"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#1A1A1A]">API Management</h1>
        <p className="text-muted-foreground mt-1">Configure and manage your external service integrations</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-[#CD7F32]" />
              Service Configuration
            </CardTitle>
            <CardDescription>Select a service to configure its API keys and settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="w-full md:w-1/3">
              <Label>Select Service</Label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      <span className="flex items-center gap-2">
                        <ServiceIcon service={service} />
                        {service.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-6 border rounded-lg bg-card space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  {currentService && <ServiceIcon service={currentService} size="md" />}
                  {currentService?.name} Settings
                </h3>
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm text-muted-foreground">Active</span>
                </div>
              </div>

              <div className="grid gap-4">
                {isScaleway ? (
                  <>
                    <div className="space-y-2">
                      <Label>Access Key ID</Label>
                      <div className="relative">
                        <Input type={showKey ? "text" : "password"} placeholder="SCW..." className="pr-10" />
                        <button
                          onClick={() => setShowKey(!showKey)}
                          className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                        >
                          {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Secret Key</Label>
                      <div className="relative">
                        <Input
                          type={showSecretKey ? "text" : "password"}
                          placeholder="Enter Scaleway Secret Key"
                          className="pr-10"
                        />
                        <button
                          onClick={() => setShowSecretKey(!showSecretKey)}
                          className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                        >
                          {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <div className="relative">
                        <Input
                          type={showKey ? "text" : "password"}
                          placeholder={`Enter ${currentService?.name} API Key`}
                          className="pr-10"
                        />
                        <button
                          onClick={() => setShowKey(!showKey)}
                          className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                        >
                          {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Webhook Secret (Optional)</Label>
                      <Input type="password" placeholder="whsec_..." />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <Button className="bg-[#CD7F32] hover:bg-[#B8691C]">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>General Configuration</CardTitle>
            <CardDescription>Global application settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>NEXT_PUBLIC_SITE_URL</Label>
              <Input placeholder="https://example.com" />
              <p className="text-xs text-muted-foreground">The public URL of your application</p>
            </div>

            <div className="space-y-2">
              <Label>AUTH_SECRET</Label>
              <div className="flex gap-2">
                <Input type="password" value="****************" disabled />
                <Button variant="outline" size="icon">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Used for signing authentication tokens</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

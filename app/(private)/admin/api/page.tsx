"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Eye, EyeOff, Save, RefreshCw, Key, Cloud, CheckCircle, XCircle, Loader2, Trash2, Plus, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

const services = [
  { id: "scaleway", name: "Scaleway", icon: "scaleway", type: "storage", description: "Object Storage, Functions, etc." },
  { id: "resend", name: "Resend", icon: "📧", type: "email", description: "Transactional email service" },
  { id: "aws", name: "AWS SES", icon: "☁️", type: "email", description: "Amazon Simple Email Service" },
]

function ScalewayIcon({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center rounded bg-purple-600 text-white ${className}`}>
      <Cloud className="h-3 w-3" />
    </div>
  )
}

function ServiceIcon({ service, size = "sm" }: { service: (typeof services)[0]; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "sm" ? "h-5 w-5" : size === "md" ? "h-6 w-6" : "h-8 w-8"
  if (service.icon === "scaleway") {
    return <ScalewayIcon className={sizeClass} />
  }
  return <span className={size === "lg" ? "text-2xl" : "text-base"}>{service.icon}</span>
}

interface ApiConfig {
  id: string
  serviceName: string
  serviceType: string
  environment: string
  isActive: boolean
  isDefault: boolean
  metadata?: any
  lastTestedAt?: string
}

export default function AdminApiPage() {
  const [allConfigs, setAllConfigs] = useState<ApiConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<ApiConfig | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const { toast } = useToast()

  // Form state
  const [selectedService, setSelectedService] = useState(services[0].id)
  const [environment, setEnvironment] = useState("production")
  const [showKey, setShowKey] = useState(false)
  const [showSecretKey, setShowSecretKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testingInModal, setTestingInModal] = useState(false)
  const [modalTestResult, setModalTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // Service-specific configs
  const [scalewayConfig, setScalewayConfig] = useState({
    accessKey: "",
    secretKey: "",
  })
  const [resendConfig, setResendConfig] = useState({ apiKey: "", domain: "" })
  const [awsConfig, setAwsConfig] = useState({
    accessKeyId: "",
    secretAccessKey: "",
    region: "eu-west-1",
    sessionToken: ""
  })

  useEffect(() => {
    loadAllConfigs()
  }, [])

  const loadAllConfigs = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/services')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAllConfigs(data.data || [])
        }
      }
    } catch (error) {
      console.error("Error loading configurations:", error)
      toast({
        title: "❌ Error",
        description: "Failed to load API configurations",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const openAddDialog = () => {
    setEditingConfig(null)
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = async (config: ApiConfig) => {
    setEditingConfig(config)
    setSelectedService(config.serviceName)
    setEnvironment(config.environment)

    // Load the actual config data
    try {
      const response = await fetch(`/api/services/${config.serviceName}?environment=${config.environment}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          switch (config.serviceName) {
            case "scaleway":
              setScalewayConfig({
                accessKey: data.data.config.accessKey || "",
                secretKey: data.data.config.secretKey || "",
              })
              break
            case "resend":
              setResendConfig({ ...data.data.config, domain: data.data.metadata?.domain || "" })
              break
            case "aws":
              setAwsConfig(data.data.config)
              break
          }
        }
      }
    } catch (error) {
      console.error("Error loading config details:", error)
    }

    setDialogOpen(true)
  }

  const resetForm = () => {
    setSelectedService(services[0].id)
    setEnvironment("production")
    setScalewayConfig({ accessKey: "", secretKey: "" })
    setResendConfig({ apiKey: "", domain: "" })
    setAwsConfig({ accessKeyId: "", secretAccessKey: "", region: "eu-west-1", sessionToken: "" })
    setShowKey(false)
    setShowSecretKey(false)
    setModalTestResult(null)
  }

  const handleTestInModal = async () => {
    setTestingInModal(true)
    setModalTestResult(null)

    try {
      let config: any
      let metadata: any = {}

      switch (selectedService) {
        case "scaleway":
          if (!scalewayConfig.accessKey || !scalewayConfig.secretKey) {
            throw new Error("Please fill in Access Key and Secret Key")
          }
          config = {
            accessKey: scalewayConfig.accessKey,
            secretKey: scalewayConfig.secretKey,
          }
          metadata = {}
          break
        case "resend":
          if (!resendConfig.apiKey) {
            throw new Error("Veuillez remplir la clé API")
          }
          config = { apiKey: resendConfig.apiKey }
          metadata = { domain: resendConfig.domain }
          break
        case "aws":
          if (!awsConfig.accessKeyId || !awsConfig.secretAccessKey) {
            throw new Error("Veuillez remplir tous les champs requis")
          }
          config = awsConfig
          break
      }

      const response = await fetch(`/api/services/${selectedService}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          environment: editingConfig ? environment : undefined,
          testConfig: !editingConfig ? { config, metadata } : undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setModalTestResult({ success: true, message: data.message })
        toast({
          title: "✅ Clé valide",
          description: `${data.message} (${data.responseTime}ms)`,
        })
      } else {
        setModalTestResult({ success: false, message: data.message || data.error })
        toast({
          title: "❌ Clé invalide",
          description: data.message || data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de vérifier la clé"
      setModalTestResult({ success: false, message })
      toast({
        title: "❌ Erreur",
        description: message,
        variant: "destructive",
      })
    } finally {
      setTestingInModal(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      let config: any
      let metadata: any = {}
      const currentService = services.find(s => s.id === selectedService)

      switch (selectedService) {
        case "scaleway":
          if (!scalewayConfig.accessKey || !scalewayConfig.secretKey) {
            throw new Error("Access Key and Secret Key are required")
          }
          config = {
            accessKey: scalewayConfig.accessKey,
            secretKey: scalewayConfig.secretKey,
          }
          metadata = {}
          break
        case "resend":
          if (!resendConfig.apiKey) {
            throw new Error("API Key is required")
          }
          config = { apiKey: resendConfig.apiKey }
          metadata = { domain: resendConfig.domain }
          break
        case "aws":
          if (!awsConfig.accessKeyId || !awsConfig.secretAccessKey) {
            throw new Error("Access Key ID and Secret Access Key are required")
          }
          config = awsConfig
          break
      }

      const payload = {
        serviceType: currentService?.type,
        environment,
        isActive: true,
        isDefault: true,
        config,
        metadata,
      }

      console.log("Saving configuration:", { service: selectedService, payload })

      const response = await fetch(`/api/services/${selectedService}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      console.log("Response status:", response.status)
      const data = await response.json()
      console.log("Response data:", data)

      if (data.success) {
        toast({
          title: "✅ Configuration Saved",
          description: `${currentService?.name} configuration has been saved and encrypted.`,
        })
        setDialogOpen(false)
        resetForm()
        await loadAllConfigs()
      } else {
        throw new Error(data.error || "Failed to save configuration")
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Failed to save configuration",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async (config: ApiConfig) => {
    setTestingId(config.id)

    try {
      const response = await fetch(`/api/services/${config.serviceName}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ environment: config.environment }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "✅ Clé valide",
          description: `${data.message} (${data.responseTime}ms)`,
        })
        await loadAllConfigs()
      } else {
        toast({
          title: "❌ Clé invalide",
          description: data.message || data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: error instanceof Error ? error.message : "Impossible de vérifier la clé",
        variant: "destructive",
      })
    } finally {
      setTestingId(null)
    }
  }

  const handleDelete = async (config: ApiConfig) => {
    const serviceInfo = getServiceInfo(config.serviceName)
    if (!confirm(`Are you sure you want to delete the ${serviceInfo?.name || config.serviceName} API configuration?`)) {
      return
    }

    try {
      const response = await fetch(`/api/services/${config.serviceName}?id=${config.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "✅ Configuration Deleted",
          description: "The configuration has been removed.",
        })
        await loadAllConfigs()
      } else {
        throw new Error(data.error || "Failed to delete configuration")
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Failed to delete configuration",
        variant: "destructive",
      })
    }
  }

  const renderConfigFields = () => {
    switch (selectedService) {
      case "scaleway":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Access Key (ID de la clé) *</Label>
              <div className="relative">
                <Input
                  type={showKey ? "text" : "password"}
                  placeholder="SCW..."
                  value={scalewayConfig.accessKey}
                  onChange={(e) => setScalewayConfig({ ...scalewayConfig, accessKey: e.target.value })}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Secret Key (Clé secrète) *</Label>
              <div className="relative">
                <Input
                  type={showSecretKey ? "text" : "password"}
                  placeholder="Secret Key"
                  value={scalewayConfig.secretKey}
                  onChange={(e) => setScalewayConfig({ ...scalewayConfig, secretKey: e.target.value })}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                >
                  {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        )

      case "resend":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>API Key *</Label>
              <div className="relative">
                <Input
                  type={showKey ? "text" : "password"}
                  placeholder="re_..."
                  value={resendConfig.apiKey}
                  onChange={(e) => setResendConfig({ ...resendConfig, apiKey: e.target.value })}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Domain (Optional)</Label>
              <Input
                type="text"
                placeholder="example.com"
                value={resendConfig.domain}
                onChange={(e) => setResendConfig({ ...resendConfig, domain: e.target.value })}
              />
            </div>
          </div>
        )

      case "aws":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Access Key ID *</Label>
              <div className="relative">
                <Input
                  type={showKey ? "text" : "password"}
                  placeholder="AKIA..."
                  value={awsConfig.accessKeyId}
                  onChange={(e) => setAwsConfig({ ...awsConfig, accessKeyId: e.target.value })}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Secret Access Key *</Label>
              <div className="relative">
                <Input
                  type={showSecretKey ? "text" : "password"}
                  placeholder="Secret Access Key"
                  value={awsConfig.secretAccessKey}
                  onChange={(e) => setAwsConfig({ ...awsConfig, secretAccessKey: e.target.value })}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                >
                  {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Region *</Label>
              <Select value={awsConfig.region} onValueChange={(value) => setAwsConfig({ ...awsConfig, region: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                  <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                  <SelectItem value="eu-west-1">Europe (Ireland)</SelectItem>
                  <SelectItem value="eu-central-1">Europe (Frankfurt)</SelectItem>
                  <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Session Token (Optional)</Label>
              <Input
                type="password"
                placeholder="Session Token"
                value={awsConfig.sessionToken}
                onChange={(e) => setAwsConfig({ ...awsConfig, sessionToken: e.target.value })}
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const getServiceInfo = (serviceName: string) => {
    return services.find(s => s.id === serviceName)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1A1A]">API Management</h1>
          <p className="text-muted-foreground mt-1">Configure and manage your external service integrations</p>
        </div>
        <Button
          onClick={openAddDialog}
          className="bg-[#CD7F32] hover:bg-[#B8691C]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add API
        </Button>
      </div>

      {/* API List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-[#CD7F32]" />
            Registered API Configurations
          </CardTitle>
          <CardDescription>Manage your external service API keys and credentials</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : allConfigs.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No API configurations yet. Click "Add API" to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allConfigs.map((config) => {
                const serviceInfo = getServiceInfo(config.serviceName)
                return (
                  <div
                    key={config.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {serviceInfo && <ServiceIcon service={serviceInfo} size="lg" />}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-lg">{serviceInfo?.name || config.serviceName}</span>
                          {config.isActive && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="capitalize">{config.serviceType}</span>
                          {config.metadata && (
                            <>
                              {config.metadata.region && <span>• Region: {config.metadata.region}</span>}
                              {config.metadata.domain && <span>• Domain: {config.metadata.domain}</span>}
                            </>
                          )}
                          {config.lastTestedAt && (
                            <span>• Last tested: {new Date(config.lastTestedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTest(config)}
                        disabled={testingId === config.id}
                      >
                        {testingId === config.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Vérification...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Vérifier
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(config)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(config)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-[#CD7F32]" />
              {editingConfig ? "Edit API Configuration" : "Add New API Configuration"}
            </DialogTitle>
            <DialogDescription>
              {editingConfig
                ? "Update the API configuration below"
                : "Configure a new external service integration"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Select Service</Label>
              <Select
                value={selectedService}
                onValueChange={setSelectedService}
                disabled={!!editingConfig}
              >
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

            {renderConfigFields()}

            {modalTestResult && (
              <div className={`p-4 rounded-lg border ${modalTestResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <div className="flex items-center gap-2">
                  {modalTestResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <p className={modalTestResult.success ? "text-green-800" : "text-red-800"}>
                    {modalTestResult.message}
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving || testingInModal}
            >
              Cancel
            </Button>
            <div className="flex-1" />
            <Button
              variant="outline"
              onClick={handleTestInModal}
              disabled={saving || testingInModal}
            >
              {testingInModal ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Vérification...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Vérifier la clé
                </>
              )}
            </Button>
            <Button
              className="bg-[#CD7F32] hover:bg-[#B8691C]"
              onClick={handleSave}
              disabled={saving || testingInModal}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {editingConfig ? "Update" : "Save"} Configuration
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

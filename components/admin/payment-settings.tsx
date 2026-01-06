"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { CreditCard, AlertCircle, ExternalLink, Loader2, TestTube, Rocket, Code2 } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type LagoMode = 'dev' | 'test' | 'production'

export function PaymentSettings() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [config, setConfig] = useState({
    isEnabled: true,
    paypalEnabled: false,
    stripeEnabled: false,
    lagoMode: "dev" as LagoMode
  })

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/admin/config')
        if (res.ok) {
          const data = await res.json()
          setConfig({
            isEnabled: true,
            paypalEnabled: data.lago_paypal_enabled === 'true',
            stripeEnabled: data.lago_stripe_enabled === 'true',
            lagoMode: (data.lago_mode || "dev") as LagoMode
          })
        }
      } catch (error) {
        console.error("Failed to fetch payment config", error)
        toast.error("Failed to load payment settings")
      } finally {
        setIsLoading(false)
      }
    }
    fetchConfig()
  }, [])

  const handleSave = async (newConfig: typeof config) => {
    setIsSaving(true)
    setConfig(newConfig) // Optimistic update

    try {
      const formData = new FormData()
      formData.append('lagoPaypalEnabled', newConfig.paypalEnabled.toString())
      formData.append('lagoStripeEnabled', newConfig.stripeEnabled.toString())
      formData.append('lagoMode', newConfig.lagoMode)

      const res = await fetch('/api/admin/config', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error("Failed to save")

      toast.success("Payment settings saved")
    } catch (error) {
      toast.error("Failed to save payment settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleModeChange = (mode: LagoMode) => {
    handleSave({ ...config, lagoMode: mode })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[#CD7F32]" />
            Lago Configuration
          </CardTitle>
          <CardDescription>
            Configure your billing engine settings. API keys are managed separately in the{" "}
            <Link href="/admin/api" className="text-primary hover:underline">
              API Manager
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Environment Mode - 3 options */}
          <div className="rounded-lg border p-4 space-y-4">
            <div className="space-y-1">
              <Label className="text-base font-medium">Environment Mode</Label>
              <p className="text-sm text-muted-foreground">
                Choose how Lago billing is integrated.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* DEV Mode */}
              <button
                onClick={() => handleModeChange('dev')}
                disabled={isSaving}
                className={cn(
                  "relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                  config.lagoMode === 'dev'
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30"
                    : "border-muted hover:border-purple-300 hover:bg-purple-50/50"
                )}
              >
                <Code2 className={cn(
                  "h-6 w-6",
                  config.lagoMode === 'dev' ? "text-purple-600" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "font-medium text-sm",
                  config.lagoMode === 'dev' ? "text-purple-600" : "text-muted-foreground"
                )}>
                  Dev
                </span>
                <span className="text-xs text-muted-foreground text-center">
                  Lago bypassed
                </span>
                {config.lagoMode === 'dev' && (
                  <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-purple-500" />
                )}
              </button>

              {/* TEST Mode */}
              <button
                onClick={() => handleModeChange('test')}
                disabled={isSaving}
                className={cn(
                  "relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                  config.lagoMode === 'test'
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                    : "border-muted hover:border-orange-300 hover:bg-orange-50/50"
                )}
              >
                <TestTube className={cn(
                  "h-6 w-6",
                  config.lagoMode === 'test' ? "text-orange-600" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "font-medium text-sm",
                  config.lagoMode === 'test' ? "text-orange-600" : "text-muted-foreground"
                )}>
                  Test
                </span>
                <span className="text-xs text-muted-foreground text-center">
                  Test API key
                </span>
                {config.lagoMode === 'test' && (
                  <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-orange-500" />
                )}
              </button>

              {/* PRODUCTION Mode */}
              <button
                onClick={() => handleModeChange('production')}
                disabled={isSaving}
                className={cn(
                  "relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                  config.lagoMode === 'production'
                    ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                    : "border-muted hover:border-green-300 hover:bg-green-50/50"
                )}
              >
                <Rocket className={cn(
                  "h-6 w-6",
                  config.lagoMode === 'production' ? "text-green-600" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "font-medium text-sm",
                  config.lagoMode === 'production' ? "text-green-600" : "text-muted-foreground"
                )}>
                  Production
                </span>
                <span className="text-xs text-muted-foreground text-center">
                  Live API key
                </span>
                {config.lagoMode === 'production' && (
                  <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-500" />
                )}
              </button>
            </div>

            {/* Mode description */}
            <div className={cn(
              "p-3 rounded-lg text-sm",
              config.lagoMode === 'dev' && "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200",
              config.lagoMode === 'test' && "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
              config.lagoMode === 'production' && "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
            )}>
              {config.lagoMode === 'dev' && (
                <>
                  <strong>Dev Mode:</strong> Lago est completement desactive. Les commandes sont creees sans appels API Lago.
                  Ideal pour tester le tunnel de vente localement.
                </>
              )}
              {config.lagoMode === 'test' && (
                <>
                  <strong>Test Mode:</strong> Lago est appele avec la cle API de test.
                  Les factures sont creees en environnement sandbox.
                </>
              )}
              {config.lagoMode === 'production' && (
                <>
                  <strong>Production Mode:</strong> Lago est appele avec la cle API de production.
                  Les factures reelles sont generees.
                </>
              )}
            </div>
          </div>

          {/* Payment Methods - Only show if not in dev mode */}
          {config.lagoMode !== 'dev' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-base font-medium">Payment Methods</Label>
                <p className="text-sm text-muted-foreground">
                  Enable payment providers for your platform.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#635BFF]/10 flex items-center justify-center">
                      <svg viewBox="0 0 32 32" className="h-6 w-6 fill-[#635BFF]" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.9 16.2c0 1.3 1.3 1.9 3.4 1.9 2.6 0 4.9-.6 4.9-.6v3.6s-1.9.6-4.5.6c-4.6 0-7.3-2.3-7.3-6.1 0-5.9 8.3-6.1 8.3-9.2 0-1-.9-1.6-2.6-1.6-2.3 0-4.6.7-4.6.7V1.8s2-.6 4.8-.6c4.3 0 7 2.2 7 5.9 0 6.1-8.4 6.2-8.4 9.1z"/>
                      </svg>
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-base">Stripe</Label>
                      <p className="text-sm text-muted-foreground">
                        Accept credit cards
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={config.stripeEnabled}
                    onCheckedChange={(checked) => handleSave({ ...config, stripeEnabled: checked })}
                    disabled={isSaving}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#003087]/10 flex items-center justify-center">
                      <svg viewBox="0 0 32 32" className="h-5 w-5 fill-[#003087]" xmlns="http://www.w3.org/2000/svg">
                        <path d="M26.6 9.3c-.6-2.6-2.8-4.3-6.5-4.3h-6.4c-.7 0-1.3.5-1.4 1.2L9.8 26.5c-.1.5.3 1 .8 1h3.8c.6 0 1.1-.4 1.2-1l.9-5.6h2.6c4.6 0 8.2-1.9 9.3-6.6.3-1.3.3-2.5-.2-3.6-.5-1.1-1.3-1.9-2.4-2.4z"/>
                      </svg>
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-base">PayPal</Label>
                      <p className="text-sm text-muted-foreground">
                        Online payments
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={config.paypalEnabled}
                    onCheckedChange={(checked) => handleSave({ ...config, paypalEnabled: checked })}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Dev mode notice */}
          {config.lagoMode === 'dev' && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-900 dark:bg-purple-950/30">
              <div className="flex items-start gap-3">
                <Code2 className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <h4 className="font-medium text-purple-900 dark:text-purple-100">Mode Developpement Actif</h4>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Les methodes de paiement sont masquees car Lago est desactive.
                    Les commandes seront creees directement sans facturation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* API Configuration Info */}
          {config.lagoMode !== 'dev' && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">API Configuration</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    To configure Lago API keys, URLs, and credentials, please use the centralized API Management interface.
                  </p>
                  <Button variant="link" className="h-auto p-0 text-blue-700 dark:text-blue-300" asChild>
                    <Link href="/admin/api" className="flex items-center gap-1">
                      Open API Manager <ExternalLink className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardStats } from "@/components/admin/dashboard-stats"
import { DashboardPayments } from "@/components/admin/dashboard-payments"
import { DashboardInvoices } from "@/components/admin/dashboard-invoices"
import { PaymentSettings } from "@/components/admin/payment-settings"
import { useRequireAdmin } from "@/lib/hooks/use-require-admin"
import { Shield } from "lucide-react"

export default function AdminPage() {
  const { isChecking, isAdmin } = useRequireAdmin()

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

  if (!isAdmin) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1A1A]">Business Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your platform performance, payments, and invoices. 
            Our model relies on an external <a href="https://docs.getlago.com/docs/guide/introduction" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Lago instance</a> (Self-Hosted or Cloud).
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#CD7F32] data-[state=active]:text-white">
            Overview
          </TabsTrigger>
          <TabsTrigger value="payments" className="data-[state=active]:bg-[#CD7F32] data-[state=active]:text-white">
            <span className="hidden sm:inline">Payments & Invoices</span>
            <span className="sm:hidden">Payments</span>
          </TabsTrigger>
          <TabsTrigger value="lago" className="data-[state=active]:bg-[#CD7F32] data-[state=active]:text-white">
            <span className="hidden sm:inline">Lago Parameters</span>
            <span className="sm:hidden">Lago</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <DashboardStats />
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="space-y-6">
            <DashboardPayments />
            <DashboardInvoices />
          </div>
        </TabsContent>

        <TabsContent value="lago" className="space-y-4">
          <PaymentSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}

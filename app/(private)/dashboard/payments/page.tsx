"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Check, ExternalLink, Loader2, AlertCircle } from "lucide-react"
import { getPaymentMethods, getCustomerPortalUrl, getInvoices } from "@/app/actions/payments"
import { useToast } from "@/hooks/use-toast"





export default function PaymentsPage() {
  const [methods, setMethods] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [methodsResponse, invoicesResponse] = await Promise.all([
          getPaymentMethods(),
          getInvoices()
        ])
        
        if (methodsResponse.success && methodsResponse.data) {
           // If data is an array, use it. If it's a customer object, wrap it or extract relevant info.
           // For now, assuming the action might return a customer object, let's normalize it.
           // But wait, I should probably fix the action to return an array of methods.
           // Let's assume I'll fix the action to return { success: true, data: [...] }
           setMethods(Array.isArray(methodsResponse.data) ? methodsResponse.data : [])
        }

        if (invoicesResponse.success && invoicesResponse.data) {
          setInvoices(Array.isArray(invoicesResponse.data) ? invoicesResponse.data : [])
        }
      } catch (error) {
        console.error("Error fetching payment data:", error)
        toast({
          title: "Error",
          description: "Failed to load payment information",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  const handleManagePaymentMethods = async () => {
    setPortalLoading(true)
    try {
      const response = await getCustomerPortalUrl()
      if (response.success && response.url) {
        window.location.href = response.url
      } else {
        throw new Error(response.error || "No portal URL returned")
      }
    } catch (error) {
      console.error("Error getting portal URL:", error)
      toast({
        title: "Error",
        description: "Could not redirect to payment portal",
        variant: "destructive",
      })
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">Manage payment methods and transactions</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Manage your payment methods via our secure portal</CardDescription>
          </div>
          <Button 
            onClick={handleManagePaymentMethods} 
            disabled={portalLoading}
            className="bg-[#CD7F32] hover:bg-[#B86F28] text-white"
          >
            {portalLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="mr-2 h-4 w-4" />
            )}
            Manage Cards
          </Button>
        </CardHeader>
        <CardContent>
          {methods.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <AlertCircle className="h-8 w-8 mb-2" />
              <p>No payment methods found</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {methods.map((method: any, index: number) => (
                <Card
                  key={index}
                  className="relative overflow-hidden border-2 hover:border-[#CD7F32] transition-colors"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center p-1 border border-gray-200">
                          {/* Simple icon fallback based on brand if available, otherwise generic */}
                          <div className="font-bold text-xs">{method.brand || "CARD"}</div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-[#1A1A1A] capitalize">{method.brand || "Card"}</p>
                            {method.is_default && (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">
                                <Check className="w-3 h-3 mr-1" />
                                Default
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-[#6B7280]">**** **** **** {method.last4}</p>
                          <p className="text-xs text-[#6B7280]">Expires {method.exp_month}/{method.exp_year}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
          <CardDescription>View all your invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">No invoices found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Download</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice: any) => (
                  <TableRow key={invoice.lago_id}>
                    <TableCell className="font-medium">{invoice.number}</TableCell>
                    <TableCell>{new Date(invoice.issuing_date).toLocaleDateString()}</TableCell>
                    <TableCell>{invoice.total_amount_cents / 100} {invoice.currency}</TableCell>
                    <TableCell>
                      <Badge
                        variant={invoice.status === "finalized" ? "default" : "secondary"}
                        className={
                          invoice.status === "finalized"
                            ? "bg-[#CD7F32] hover:bg-[#B86F28] text-white"
                            : "bg-[#6B7280] hover:bg-[#6B7280] text-white"
                        }
                      >
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {invoice.file_url && (
                        <a href={invoice.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                          <ExternalLink className="h-3 w-3 mr-1" /> PDF
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

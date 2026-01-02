"use client"

import { useState, useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"
import { Search, Eye, Edit, UserCog, History, LogIn, ExternalLink, Calendar, DollarSign, Filter, X, FileText } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"

interface Invoice {
  id: string
  orderNumber: string
  companyName: string | null
  companyEmail: string | null
  amount: number
  status: string
  date: Date | null
  createdAt: Date
  userId?: string
  userName?: string
  userEmail?: string
}

interface InvoicesTableProps {
  invoices: Invoice[]
}

export function InvoicesTable({ invoices }: InvoicesTableProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [minAmount, setMinAmount] = useState("")
  const [maxAmount, setMaxAmount] = useState("")
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showUserHistory, setShowUserHistory] = useState(false)
  const [userHistory, setUserHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Filtrage des factures
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      // Recherche textuelle
      const matchesSearch = 
        invoice.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.companyEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())

      // Filtre de statut
      const matchesStatus = statusFilter === "all" || invoice.status === statusFilter

      // Filtre de montant
      const amount = invoice.amount / 100
      const matchesMinAmount = !minAmount || amount >= parseFloat(minAmount)
      const matchesMaxAmount = !maxAmount || amount <= parseFloat(maxAmount)

      // Filtre de date
      let matchesDate = true
      if (dateFilter !== "all" && invoice.date) {
        const invoiceDate = new Date(invoice.date)
        const now = new Date()
        
        switch (dateFilter) {
          case "today":
            matchesDate = invoiceDate.toDateString() === now.toDateString()
            break
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            matchesDate = invoiceDate >= weekAgo
            break
          case "month":
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            matchesDate = invoiceDate >= monthAgo
            break
          case "year":
            matchesDate = invoiceDate.getFullYear() === now.getFullYear()
            break
        }
      }

      return matchesSearch && matchesStatus && matchesMinAmount && matchesMaxAmount && matchesDate
    })
  }, [invoices, searchTerm, statusFilter, dateFilter, minAmount, maxAmount])

  const loadUserHistory = async (userId: string, userEmail: string) => {
    setLoadingHistory(true)
    setShowUserHistory(true)
    
    try {
      const response = await fetch(`/api/admin/users/${userId}/history`)
      if (response.ok) {
        const data = await response.json()
        setUserHistory(data.history || [])
      } else {
        toast.error("Failed to load user history")
      }
    } catch (error) {
      console.error("Error loading user history:", error)
      toast.error("Error loading user history")
    } finally {
      setLoadingHistory(false)
    }
  }

  const impersonateUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Se connecter en tant que ${userEmail} ?\n\nVous allez être redirigé vers son dashboard pour visualiser son compte.`)) {
      return
    }

    try {
      const response = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        toast.success(`Connecté en tant que ${userEmail}`)
        router.push("/dashboard")
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || "Impersonation failed")
      }
    } catch (error) {
      console.error("Impersonation error:", error)
      toast.error("Failed to impersonate user")
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setDateFilter("all")
    setMinAmount("")
    setMaxAmount("")
  }

  const hasActiveFilters = searchTerm || statusFilter !== "all" || dateFilter !== "all" || minAmount || maxAmount

  return (
    <div className="space-y-4">
      {/* Barre de recherche et filtres */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Filter className="h-5 w-5 text-[#CD7F32]" />
              Filtres de recherche
            </h3>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Recherche textuelle */}
            <div className="space-y-2">
              <Label htmlFor="search">Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="N° commande, société, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Filtre de statut */}
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="paid">Payé</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="failed">Échoué</SelectItem>
                  <SelectItem value="refunded">Remboursé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtre de période */}
            <div className="space-y-2">
              <Label htmlFor="date">Période</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger id="date">
                  <SelectValue placeholder="Toutes les dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="week">7 derniers jours</SelectItem>
                  <SelectItem value="month">30 derniers jours</SelectItem>
                  <SelectItem value="year">Cette année</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtre de montant */}
            <div className="space-y-2">
              <Label>Montant</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  className="w-full"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {filteredInvoices.length} facture{filteredInvoices.length !== 1 ? 's' : ''} trouvée{filteredInvoices.length !== 1 ? 's' : ''}
          </div>
        </div>
      </Card>

      {/* Tableau des factures - Desktop */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° Commande</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Aucune facture trouvée.
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.orderNumber}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{invoice.companyName || invoice.userName || "Unknown"}</span>
                      <span className="text-xs text-muted-foreground">{invoice.companyEmail || invoice.userEmail}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">{formatCurrency(invoice.amount / 100)}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        invoice.status === "paid" ? "default" : 
                        invoice.status === "pending" ? "secondary" :
                        invoice.status === "refunded" ? "outline" :
                        "destructive"
                      }
                    >
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {invoice.date ? new Date(invoice.date).toLocaleDateString('fr-FR') : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setSelectedInvoice(invoice)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Détails de la facture</DialogTitle>
                            <DialogDescription>
                              Commande {invoice.orderNumber}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-muted-foreground">Client</Label>
                                <p className="font-medium">{invoice.companyName || invoice.userName}</p>
                                <p className="text-sm text-muted-foreground">{invoice.companyEmail || invoice.userEmail}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Montant</Label>
                                <p className="text-2xl font-bold text-[#CD7F32]">{formatCurrency(invoice.amount / 100)}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-muted-foreground">Statut</Label>
                                <div className="mt-1">
                                  <Badge variant={invoice.status === "paid" ? "default" : "secondary"}>
                                    {invoice.status}
                                  </Badge>
                                </div>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Date</Label>
                                <p>{invoice.date ? new Date(invoice.date).toLocaleDateString('fr-FR') : "-"}</p>
                              </div>
                            </div>
                          </div>
                          <DialogFooter className="gap-2">
                            {invoice.userId && (
                              <>
                                <Button 
                                  variant="outline" 
                                  onClick={() => {
                                    loadUserHistory(invoice.userId!, invoice.userEmail!)
                                  }}
                                >
                                  <History className="h-4 w-4 mr-2" />
                                  Historique
                                </Button>
                                <Button 
                                  variant="outline"
                                  onClick={() => impersonateUser(invoice.userId!, invoice.userEmail!)}
                                >
                                  <LogIn className="h-4 w-4 mr-2" />
                                  Se connecter
                                </Button>
                              </>
                            )}
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {invoice.userId && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          asChild
                          title="Modifier l'utilisateur"
                        >
                          <Link href={`/admin/users?edit=${invoice.userId}`}>
                            <UserCog className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}

                      <Button 
                        variant="ghost" 
                        size="icon"
                        asChild
                        title="Modifier la commande"
                      >
                        <Link href={`/admin/orders/${invoice.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Cartes des factures - Mobile */}
      <div className="md:hidden space-y-3">
        {filteredInvoices.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            Aucune facture trouvée.
          </Card>
        ) : (
          filteredInvoices.map((invoice) => (
            <Card key={invoice.id} className="p-4">
              <div className="space-y-3">
                {/* Header avec N° et Statut */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{invoice.orderNumber}</span>
                  </div>
                  <Badge 
                    variant={
                      invoice.status === "paid" ? "default" : 
                      invoice.status === "pending" ? "secondary" :
                      invoice.status === "refunded" ? "outline" :
                      "destructive"
                    }
                  >
                    {invoice.status}
                  </Badge>
                </div>

                {/* Client */}
                <div>
                  <div className="font-medium text-sm">
                    {invoice.companyName || invoice.userName || "Unknown"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {invoice.companyEmail || invoice.userEmail}
                  </div>
                </div>

                {/* Montant et Date */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-xl font-bold text-[#CD7F32]">
                    {formatCurrency(invoice.amount / 100)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {invoice.date ? new Date(invoice.date).toLocaleDateString('fr-FR') : "-"}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 pt-2 border-t">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedInvoice(invoice)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Voir
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Détails de la facture</DialogTitle>
                        <DialogDescription>
                          Commande {invoice.orderNumber}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-muted-foreground">Client</Label>
                            <p className="font-medium">{invoice.companyName || invoice.userName}</p>
                            <p className="text-sm text-muted-foreground">{invoice.companyEmail || invoice.userEmail}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Montant</Label>
                            <p className="text-2xl font-bold text-[#CD7F32]">{formatCurrency(invoice.amount / 100)}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-muted-foreground">Statut</Label>
                            <div className="mt-1">
                              <Badge variant={invoice.status === "paid" ? "default" : "secondary"}>
                                {invoice.status}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Date</Label>
                            <p>{invoice.date ? new Date(invoice.date).toLocaleDateString('fr-FR') : "-"}</p>
                          </div>
                        </div>
                      </div>
                      <DialogFooter className="gap-2 flex-col sm:flex-row">
                        {invoice.userId && (
                          <>
                            <Button 
                              variant="outline" 
                              className="w-full sm:w-auto"
                              onClick={() => {
                                loadUserHistory(invoice.userId!, invoice.userEmail!)
                              }}
                            >
                              <History className="h-4 w-4 mr-2" />
                              Historique
                            </Button>
                            <Button 
                              variant="outline"
                              className="w-full sm:w-auto"
                              onClick={() => impersonateUser(invoice.userId!, invoice.userEmail!)}
                            >
                              <LogIn className="h-4 w-4 mr-2" />
                              Se connecter
                            </Button>
                          </>
                        )}
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {invoice.userId && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      asChild
                      className="flex-1"
                    >
                      <Link href={`/admin/users?edit=${invoice.userId}`}>
                        <UserCog className="h-4 w-4 mr-2" />
                        User
                      </Link>
                    </Button>
                  )}

                  <Button 
                    variant="outline" 
                    size="sm"
                    asChild
                    className="flex-1"
                  >
                    <Link href={`/admin/orders/${invoice.id}`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Dialog Historique utilisateur */}
      <Dialog open={showUserHistory} onOpenChange={setShowUserHistory}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Historique client</DialogTitle>
            <DialogDescription>
              Actions et commandes du client
            </DialogDescription>
          </DialogHeader>
          {loadingHistory ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin h-8 w-8 border-4 border-[#CD7F32] border-t-transparent rounded-full"></div>
            </div>
          ) : userHistory.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              Aucun historique disponible
            </div>
          ) : (
            <div className="space-y-2">
              {userHistory.map((event, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{event.action}</p>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(event.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

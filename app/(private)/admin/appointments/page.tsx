"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  Calendar,
  Plus,
  Clock,
  MapPin,
  Video,
  User,
  DollarSign,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Download,
  Mail,
  Phone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface Appointment {
  id: string
  title: string
  description?: string
  location?: string
  meetingUrl?: string
  startTime: string
  endTime: string
  timezone: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  type: 'free' | 'paid'
  price: number
  currency: string
  isPaid: boolean
  paymentStatus?: string
  attendeeEmail?: string
  attendeeName?: string
  attendeePhone?: string
  notes?: string
  user?: {
    firstName: string
    lastName: string
    email: string
  }
  createdAt: string
}

const statusConfig = {
  pending: { label: "En attente", variant: "warning" as const, icon: AlertCircle, color: "text-yellow-600" },
  confirmed: { label: "Confirmé", variant: "success" as const, icon: CheckCircle, color: "text-green-600" },
  cancelled: { label: "Annulé", variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
  completed: { label: "Terminé", variant: "secondary" as const, icon: CheckCircle, color: "text-gray-600" },
  no_show: { label: "Absent", variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
}

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const fetchAppointments = async () => {
    try {
      // Admin endpoint to get ALL appointments
      const params = new URLSearchParams({ limit: "100" })
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (typeFilter !== "all") params.set("type", typeFilter)

      const response = await fetch(`/api/admin/appointments?${params}`)
      const data = await response.json()

      if (data.success) {
        setAppointments(data.data)
      } else {
        // Fallback to regular endpoint for testing
        const fallbackResponse = await fetch(`/api/appointments?${params}`)
        const fallbackData = await fallbackResponse.json()
        if (fallbackData.success) {
          setAppointments(fallbackData.data)
        } else {
          toast.error("Erreur lors du chargement des rendez-vous")
        }
      }
    } catch (error) {
      console.error("Failed to fetch appointments:", error)
      toast.error("Erreur de connexion")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [statusFilter, typeFilter])

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast.success(`Statut mis à jour: ${statusConfig[newStatus as keyof typeof statusConfig]?.label}`)
        fetchAppointments()
      } else {
        toast.error("Erreur lors de la mise à jour")
      }
    } catch (error) {
      toast.error("Erreur de connexion")
    }
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency,
    }).format(price / 100)
  }

  const filteredAppointments = appointments.filter(apt => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      apt.title.toLowerCase().includes(query) ||
      apt.attendeeName?.toLowerCase().includes(query) ||
      apt.attendeeEmail?.toLowerCase().includes(query) ||
      apt.user?.firstName.toLowerCase().includes(query) ||
      apt.user?.lastName.toLowerCase().includes(query)
    )
  })

  // Stats
  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
    totalRevenue: appointments
      .filter(a => a.isPaid && a.type === 'paid')
      .reduce((sum, a) => sum + (a.price || 0), 0),
    unpaidAmount: appointments
      .filter(a => !a.isPaid && a.type === 'paid')
      .reduce((sum, a) => sum + (a.price || 0), 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Rendez-vous</h1>
          <p className="text-muted-foreground">
            Gérez tous les rendez-vous de la plateforme
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmés</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats.totalRevenue, "EUR")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impayés</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatPrice(stats.unpaidAmount, "EUR")}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="confirmed">Confirmé</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
                <SelectItem value="no_show">Absent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="free">Gratuit</SelectItem>
                <SelectItem value="paid">Payant</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-pulse text-muted-foreground">Chargement...</div>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Aucun rendez-vous</p>
              <p className="text-muted-foreground">
                Aucun rendez-vous ne correspond à vos critères
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Heure</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Participant</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Paiement</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.map((appointment) => {
                  const status = statusConfig[appointment.status]
                  const StatusIcon = status.icon

                  return (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <div className="font-medium">
                          {format(new Date(appointment.startTime), "d MMM yyyy", { locale: fr })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(appointment.startTime), "HH:mm")} - {format(new Date(appointment.endTime), "HH:mm")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{appointment.title}</div>
                        {appointment.location && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {appointment.location}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {appointment.user ? (
                          <div>
                            <div className="font-medium">
                              {appointment.user.firstName} {appointment.user.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {appointment.user.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {appointment.attendeeName ? (
                          <div>
                            <div className="font-medium">{appointment.attendeeName}</div>
                            {appointment.attendeeEmail && (
                              <div className="text-sm text-muted-foreground">
                                {appointment.attendeeEmail}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={appointment.type === "paid" ? "default" : "secondary"}>
                          {appointment.type === "paid" ? formatPrice(appointment.price, appointment.currency) : "Gratuit"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant === "warning" ? "outline" : status.variant}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {appointment.type === "paid" ? (
                          <Badge variant={appointment.isPaid ? "default" : "destructive"}>
                            {appointment.isPaid ? "Payé" : "Impayé"}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedAppointment(appointment)
                              setDetailsOpen(true)
                            }}>
                              Voir les détails
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {appointment.status === "pending" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(appointment.id, "confirmed")}>
                                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                Confirmer
                              </DropdownMenuItem>
                            )}
                            {appointment.status === "confirmed" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(appointment.id, "completed")}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Marquer terminé
                              </DropdownMenuItem>
                            )}
                            {appointment.status !== "cancelled" && appointment.status !== "completed" && (
                              <>
                                <DropdownMenuItem onClick={() => handleStatusChange(appointment.id, "no_show")}>
                                  <XCircle className="mr-2 h-4 w-4 text-orange-500" />
                                  Marquer absent
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleStatusChange(appointment.id, "cancelled")}
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Annuler
                                </DropdownMenuItem>
                              </>
                            )}
                            {appointment.attendeeEmail && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <a href={`mailto:${appointment.attendeeEmail}`}>
                                    <Mail className="mr-2 h-4 w-4" />
                                    Envoyer un email
                                  </a>
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedAppointment?.title}</DialogTitle>
            <DialogDescription>
              Détails du rendez-vous
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(new Date(selectedAppointment.startTime), "EEEE d MMMM yyyy", { locale: fr })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Horaire</p>
                  <p className="font-medium">
                    {format(new Date(selectedAppointment.startTime), "HH:mm")} - {format(new Date(selectedAppointment.endTime), "HH:mm")}
                  </p>
                </div>
              </div>

              {selectedAppointment.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p>{selectedAppointment.description}</p>
                </div>
              )}

              {(selectedAppointment.location || selectedAppointment.meetingUrl) && (
                <div>
                  <p className="text-sm text-muted-foreground">Lieu</p>
                  {selectedAppointment.location && <p>{selectedAppointment.location}</p>}
                  {selectedAppointment.meetingUrl && (
                    <Button asChild variant="link" className="p-0 h-auto">
                      <a href={selectedAppointment.meetingUrl} target="_blank" rel="noopener noreferrer">
                        <Video className="mr-2 h-4 w-4" />
                        Lien de visioconférence
                      </a>
                    </Button>
                  )}
                </div>
              )}

              {(selectedAppointment.attendeeName || selectedAppointment.attendeeEmail) && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Participant externe</p>
                  <div className="bg-muted p-3 rounded-lg space-y-1">
                    {selectedAppointment.attendeeName && (
                      <p className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {selectedAppointment.attendeeName}
                      </p>
                    )}
                    {selectedAppointment.attendeeEmail && (
                      <p className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {selectedAppointment.attendeeEmail}
                      </p>
                    )}
                    {selectedAppointment.attendeePhone && (
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {selectedAppointment.attendeePhone}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {selectedAppointment.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes internes</p>
                  <p className="bg-muted p-3 rounded-lg">{selectedAppointment.notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                {selectedAppointment.status === "pending" && (
                  <Button onClick={() => {
                    handleStatusChange(selectedAppointment.id, "confirmed")
                    setDetailsOpen(false)
                  }}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirmer
                  </Button>
                )}
                {selectedAppointment.attendeeEmail && (
                  <Button variant="outline" asChild>
                    <a href={`mailto:${selectedAppointment.attendeeEmail}`}>
                      <Mail className="mr-2 h-4 w-4" />
                      Contacter
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

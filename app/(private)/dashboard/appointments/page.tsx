"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

/**
 * Appointments page - redirects to Calendar
 * The calendar page now handles both calendar view and appointments list
 */
export default function AppointmentsRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/dashboard/calendar")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Redirecting to Calendar...</p>
      </div>
    </div>
  )
}
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      })

      if (response.ok) {
        toast.success("Rendez-vous annulé")
        fetchAppointments()
      } else {
        toast.error("Erreur lors de l'annulation")
      }
    } catch (error) {
      toast.error("Erreur de connexion")
    }
  }

  const handleConfirm = async (id: string) => {
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "confirmed" }),
      })

      if (response.ok) {
        toast.success("Rendez-vous confirmé")
        fetchAppointments()
      } else {
        toast.error("Erreur lors de la confirmation")
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

  const upcomingCount = appointments.filter(
    a => a.status !== "cancelled" && a.status !== "completed" && new Date(a.startTime) > new Date()
  ).length

  const paidCount = appointments.filter(a => a.isPaid && a.type === "paid").length
  const unpaidCount = appointments.filter(a => !a.isPaid && a.type === "paid").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rendez-vous</h1>
          <p className="text-muted-foreground">
            Gérez vos rendez-vous et consultations
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/calendar">
              <CalendarDays className="mr-2 h-4 w-4" />
              Calendrier
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/appointments/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau rendez-vous
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">À venir</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payés</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unpaidCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
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

      {/* Appointments List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="animate-pulse text-muted-foreground">Chargement...</div>
            </CardContent>
          </Card>
        ) : appointments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Aucun rendez-vous</p>
              <p className="text-muted-foreground mb-4">
                Créez votre premier rendez-vous pour commencer
              </p>
              <Button asChild>
                <Link href="/dashboard/appointments/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau rendez-vous
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          appointments.map((appointment) => {
            const status = statusConfig[appointment.status]
            const StatusIcon = status.icon
            const isPast = new Date(appointment.endTime) < new Date()

            return (
              <Card key={appointment.id} className={isPast ? "opacity-60" : ""}>
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center justify-center bg-muted rounded-lg p-3 min-w-[60px]">
                      <span className="text-xs text-muted-foreground uppercase">
                        {format(new Date(appointment.startTime), "MMM", { locale: fr })}
                      </span>
                      <span className="text-2xl font-bold">
                        {format(new Date(appointment.startTime), "d")}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/appointments/${appointment.id}`}
                          className="font-medium hover:underline"
                        >
                          {appointment.title}
                        </Link>
                        <Badge variant={status.variant === "warning" ? "outline" : status.variant}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {status.label}
                        </Badge>
                        {appointment.type === "paid" && (
                          <Badge variant={appointment.isPaid ? "default" : "outline"}>
                            <DollarSign className="mr-1 h-3 w-3" />
                            {appointment.isPaid ? "Payé" : formatPrice(appointment.price, appointment.currency)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {format(new Date(appointment.startTime), "HH:mm")} - {format(new Date(appointment.endTime), "HH:mm")}
                        </span>
                        {appointment.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {appointment.location}
                          </span>
                        )}
                        {appointment.meetingUrl && (
                          <span className="flex items-center gap-1">
                            <Video className="h-4 w-4" />
                            Visioconférence
                          </span>
                        )}
                        {appointment.attendeeName && (
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {appointment.attendeeName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/appointments/${appointment.id}`}>
                          Voir les détails
                        </Link>
                      </DropdownMenuItem>
                      {appointment.status === "pending" && (
                        <DropdownMenuItem onClick={() => handleConfirm(appointment.id)}>
                          Confirmer
                        </DropdownMenuItem>
                      )}
                      {appointment.meetingUrl && (
                        <DropdownMenuItem asChild>
                          <a href={appointment.meetingUrl} target="_blank" rel="noopener noreferrer">
                            Rejoindre la réunion
                          </a>
                        </DropdownMenuItem>
                      )}
                      {appointment.status !== "cancelled" && appointment.status !== "completed" && (
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleCancel(appointment.id)}
                        >
                          Annuler
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

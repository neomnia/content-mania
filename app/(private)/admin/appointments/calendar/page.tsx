"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar"
import { format, parse, startOfWeek, getDay, addMonths, subMonths } from "date-fns"
import { enUS } from "date-fns/locale"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  List,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import "react-big-calendar/lib/css/react-big-calendar.css"

// Setup the localizer
const locales = { enUS }
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
})

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
  attendeeName?: string
  attendeeEmail?: string
  user?: {
    firstName: string
    lastName: string
    email: string
  }
  assignedAdmin?: {
    firstName: string
    lastName: string
    email: string
  }
}

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: Appointment
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  confirmed: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
  completed: "bg-gray-100 text-gray-800 border-gray-300",
  no_show: "bg-red-100 text-red-800 border-red-300",
}

export default function AdminCalendarPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<typeof Views[keyof typeof Views]>(Views.MONTH)
  const [date, setDate] = useState(new Date())
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null)
  const [newAppointment, setNewAppointment] = useState({
    clientEmail: '',
    title: '',
    description: '',
    type: 'free' as 'free' | 'paid',
    price: 0,
    location: '',
    meetingUrl: '',
    notes: '',
  })

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true)
      // Fetch appointments for a wide range (3 months before and after current date)
      const startDate = subMonths(date, 3)
      const endDate = addMonths(date, 3)

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: "500",
      })

      const response = await fetch(`/api/admin/appointments?${params}`)
      const data = await response.json()

      if (data.success) {
        setAppointments(data.data)
      } else {
        toast.error("Failed to load appointments")
      }
    } catch (error) {
      console.error("Failed to fetch appointments:", error)
      toast.error("Connection error")
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  const events: CalendarEvent[] = useMemo(() => {
    return appointments
      .filter(apt => apt.status !== "cancelled")
      .map(apt => ({
        id: apt.id,
        title: apt.title,
        start: new Date(apt.startTime),
        end: new Date(apt.endTime),
        resource: apt,
      }))
  }, [appointments])

  const handleSelectEvent = (event: CalendarEvent) => {
    // Navigate to appointment details (could open a modal instead)
    router.push(`/admin/appointments?selected=${event.id}`)
  }

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setSelectedSlot({ start, end })
    setNewAppointment({
      ...newAppointment,
      title: '',
      clientEmail: '',
      description: '',
      location: '',
      meetingUrl: '',
      notes: '',
    })
    setCreateDialogOpen(true)
  }

  const handleCreateAppointment = async () => {
    if (!selectedSlot) return

    if (!newAppointment.clientEmail || !newAppointment.title) {
      toast.error("Client email and title are required")
      return
    }

    try {
      const response = await fetch('/api/admin/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          ...newAppointment,
          startTime: selectedSlot.start.toISOString(),
          endTime: selectedSlot.end.toISOString(),
          timezone: 'Europe/Paris',
          currency: 'EUR',
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Appointment request sent to client")
        setCreateDialogOpen(false)
        fetchAppointments()
      } else {
        toast.error(data.error || "Failed to create appointment")
      }
    } catch (error) {
      console.error("Failed to create appointment:", error)
      toast.error("Connection error")
    }
  }

  const handleNavigate = (newDate: Date) => {
    setDate(newDate)
  }

  const handleViewChange = (newView: typeof Views[keyof typeof Views]) => {
    setView(newView)
  }

  // Custom event component
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const apt = event.resource
    const statusClass = statusColors[apt.status] || statusColors.pending

    return (
      <div className={`px-1 py-0.5 rounded text-xs truncate border ${statusClass}`}>
        <span className="font-medium">{event.title}</span>
        {apt.user && (
          <span className="ml-1 opacity-75">
            - {apt.user.firstName} {apt.user.lastName}
          </span>
        )}
      </div>
    )
  }

  // Custom toolbar
  const CustomToolbar = ({ label, onNavigate, onView }: any) => (
    <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigate("PREV")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          onClick={() => onNavigate("TODAY")}
        >
          Today
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigate("NEXT")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="text-lg font-semibold ml-4">{label}</span>
      </div>

      <div className="flex items-center gap-2">
        <Select value={view as string} onValueChange={(v) => onView(v)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={Views.MONTH}>Month</SelectItem>
            <SelectItem value={Views.WEEK}>Week</SelectItem>
            <SelectItem value={Views.DAY}>Day</SelectItem>
            <SelectItem value={Views.AGENDA}>Agenda</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  const messages = {
    today: "Today",
    previous: "Previous",
    next: "Next",
    month: "Month",
    week: "Week",
    day: "Day",
    agenda: "Agenda",
    date: "Date",
    time: "Time",
    event: "Event",
    noEventsInRange: "No appointments in this period",
    showMore: (total: number) => `+${total} more`,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Appointments Calendar</h1>
          <p className="text-muted-foreground">
            Overview of all appointments (group & clients)
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/appointments">
              <List className="mr-2 h-4 w-4" />
              List View
            </Link>
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-500"></div>
          <span className="text-sm">Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500"></div>
          <span className="text-sm">Confirmed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gray-500"></div>
          <span className="text-sm">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500"></div>
          <span className="text-sm">Cancelled / No Show</span>
        </div>
      </div>

      {/* Calendar */}
      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-pulse text-muted-foreground">Loading...</div>
            </div>
          ) : (
            <Calendar
              localizer={localizer}
              events={events}
              view={view}
              onView={handleViewChange}
              date={date}
              onNavigate={handleNavigate}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              startAccessor="start"
              endAccessor="end"
              style={{ height: 700 }}
              messages={messages}
              components={{
                event: EventComponent,
                toolbar: CustomToolbar,
              }}
              popup
            />
          )}
        </CardContent>
      </Card>

      {/* Create Appointment Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Appointment with Client</DialogTitle>
            <DialogDescription>
              Create an appointment request that the client will need to confirm.
              {selectedSlot && (
                <div className="mt-2 p-3 bg-muted rounded-md text-sm">
                  <strong>Selected time:</strong> {format(selectedSlot.start, "PPP p", { locale: enUS })} - {format(selectedSlot.end, "p", { locale: enUS })}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="clientEmail">Client Email *</Label>
              <Input
                id="clientEmail"
                type="email"
                placeholder="client@example.com"
                value={newAppointment.clientEmail}
                onChange={(e) => setNewAppointment({ ...newAppointment, clientEmail: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                The client must be registered in the system
              </p>
            </div>

            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Consultation, Meeting, etc."
                value={newAppointment.title}
                onChange={(e) => setNewAppointment({ ...newAppointment, title: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Additional details..."
                value={newAppointment.description}
                onChange={(e) => setNewAppointment({ ...newAppointment, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={newAppointment.type}
                  onValueChange={(value: 'free' | 'paid') => setNewAppointment({ ...newAppointment, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newAppointment.type === 'paid' && (
                <div>
                  <Label htmlFor="price">Price (EUR)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="0"
                    value={newAppointment.price / 100}
                    onChange={(e) => setNewAppointment({
                      ...newAppointment,
                      price: Math.round(parseFloat(e.target.value) * 100)
                    })}
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Office address or 'Virtual'"
                value={newAppointment.location}
                onChange={(e) => setNewAppointment({ ...newAppointment, location: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="meetingUrl">Meeting URL</Label>
              <Input
                id="meetingUrl"
                type="url"
                placeholder="https://meet.google.com/..."
                value={newAppointment.meetingUrl}
                onChange={(e) => setNewAppointment({ ...newAppointment, meetingUrl: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="notes">Internal Notes</Label>
              <Textarea
                id="notes"
                placeholder="Notes visible only to admins..."
                value={newAppointment.notes}
                onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAppointment}>
                <Plus className="mr-2 h-4 w-4" />
                Send Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

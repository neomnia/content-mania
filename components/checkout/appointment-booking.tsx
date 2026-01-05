'use client'

import { useState, useEffect } from 'react'
import { format, addDays, isSameDay, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  FileText,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimeSlot {
  startTime: string
  endTime: string
  available: boolean
}

interface AvailableSlotsResponse {
  productId: string
  productTitle: string
  productPrice: number
  currency: string
  timezone: string
  slots: Record<string, TimeSlot[]>
}

interface AppointmentBookingProps {
  productId: string
  productTitle: string
  productPrice: number
  currency: string
  onBook: (data: {
    startTime: string
    endTime: string
    timezone: string
    attendeeEmail: string
    attendeeName: string
    attendeePhone?: string
    notes?: string
  }) => Promise<void>
  onCancel?: () => void
}

type Step = 'select-date' | 'select-time' | 'fill-info' | 'confirm'

export function AppointmentBooking({
  productId,
  productTitle,
  productPrice,
  currency,
  onBook,
  onCancel
}: AppointmentBookingProps) {
  const [step, setStep] = useState<Step>('select-date')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slots, setSlots] = useState<Record<string, TimeSlot[]>>({})
  const [timezone, setTimezone] = useState('Europe/Paris')

  // Selection state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    attendeeName: '',
    attendeeEmail: '',
    attendeePhone: '',
    notes: ''
  })

  // Booking state
  const [booking, setBooking] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)

  // Week navigation
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  })

  // Fetch available slots
  useEffect(() => {
    async function fetchSlots() {
      setLoading(true)
      setError(null)
      try {
        const dateStr = weekStart.toISOString().split('T')[0]
        const res = await fetch(
          `/api/checkout/available-slots?productId=${productId}&date=${dateStr}&timezone=${timezone}`
        )
        const data = await res.json()

        if (data.success) {
          setSlots(data.data.slots)
          setTimezone(data.data.timezone)
        } else {
          setError(data.error || 'Erreur lors du chargement des créneaux')
        }
      } catch (err) {
        setError('Erreur de connexion')
      } finally {
        setLoading(false)
      }
    }

    fetchSlots()
  }, [productId, weekStart, timezone])

  // Format price
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency
    }).format(amount / 100)
  }

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Get slots for selected date
  const slotsForDate = selectedDate
    ? slots[format(selectedDate, 'yyyy-MM-dd')] || []
    : []

  // Handle booking
  const handleBook = async () => {
    if (!selectedSlot || !formData.attendeeName || !formData.attendeeEmail) {
      return
    }

    setBooking(true)
    setError(null)

    try {
      await onBook({
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        timezone,
        attendeeEmail: formData.attendeeEmail,
        attendeeName: formData.attendeeName,
        attendeePhone: formData.attendeePhone || undefined,
        notes: formData.notes || undefined
      })
      setBookingSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la réservation')
    } finally {
      setBooking(false)
    }
  }

  // Success view
  if (bookingSuccess) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Réservation confirmée !
        </h2>
        <p className="text-gray-600 mb-4">
          Votre rendez-vous a été enregistré. Vous recevrez une confirmation par email.
        </p>
        {selectedDate && selectedSlot && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="font-medium">{productTitle}</p>
            <p className="text-gray-600">
              {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
            </p>
            <p className="text-gray-600">
              {format(parseISO(selectedSlot.startTime), 'HH:mm')} -{' '}
              {format(parseISO(selectedSlot.endTime), 'HH:mm')}
            </p>
          </div>
        )}
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          Fermer
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-white">
        <h2 className="text-xl font-bold">{productTitle}</h2>
        <p className="text-white/80">
          {productPrice > 0 ? formatPrice(productPrice) : 'Gratuit'}
        </p>
      </div>

      {/* Progress bar */}
      <div className="flex border-b">
        {(['select-date', 'select-time', 'fill-info', 'confirm'] as Step[]).map(
          (s, i) => (
            <div
              key={s}
              className={cn(
                'flex-1 py-2 text-center text-sm transition-colors',
                step === s
                  ? 'bg-primary/10 text-primary font-medium'
                  : i < ['select-date', 'select-time', 'fill-info', 'confirm'].indexOf(step)
                  ? 'bg-green-50 text-green-600'
                  : 'text-gray-400'
              )}
            >
              {i + 1}. {s === 'select-date' ? 'Date' : s === 'select-time' ? 'Heure' : s === 'fill-info' ? 'Infos' : 'Confirmer'}
            </div>
          )
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Select Date */}
        {step === 'select-date' && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Choisissez une date
            </h3>

            {/* Week navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setWeekStart(addDays(weekStart, -7))}
                className="p-2 hover:bg-gray-100 rounded-lg"
                disabled={weekStart <= new Date()}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-medium">
                {format(weekStart, 'd MMM', { locale: fr })} -{' '}
                {format(addDays(weekStart, 6), 'd MMM yyyy', { locale: fr })}
              </span>
              <button
                onClick={() => setWeekStart(addDays(weekStart, 7))}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Days grid */}
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day) => {
                  const dateKey = format(day, 'yyyy-MM-dd')
                  const daySlots = slots[dateKey] || []
                  const hasAvailable = daySlots.some((s) => s.available)
                  const isPast = day < new Date()
                  const isSelected = selectedDate && isSameDay(day, selectedDate)

                  return (
                    <button
                      key={dateKey}
                      onClick={() => {
                        if (!isPast && hasAvailable) {
                          setSelectedDate(day)
                          setStep('select-time')
                        }
                      }}
                      disabled={isPast || !hasAvailable}
                      className={cn(
                        'p-3 rounded-lg text-center transition-all',
                        isSelected
                          ? 'bg-primary text-white'
                          : hasAvailable && !isPast
                          ? 'bg-green-50 hover:bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      )}
                    >
                      <div className="text-xs uppercase">
                        {format(day, 'EEE', { locale: fr })}
                      </div>
                      <div className="text-lg font-bold">{format(day, 'd')}</div>
                      {hasAvailable && !isPast && (
                        <div className="text-xs">
                          {daySlots.filter((s) => s.available).length} dispo
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Time */}
        {step === 'select-time' && selectedDate && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Choisissez une heure
            </h3>
            <p className="text-gray-600 mb-4">
              {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
            </p>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slotsForDate.map((slot, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (slot.available) {
                      setSelectedSlot(slot)
                      setStep('fill-info')
                    }
                  }}
                  disabled={!slot.available}
                  className={cn(
                    'p-3 rounded-lg text-center transition-all',
                    selectedSlot?.startTime === slot.startTime
                      ? 'bg-primary text-white'
                      : slot.available
                      ? 'bg-gray-50 hover:bg-primary/10 text-gray-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                  )}
                >
                  {format(parseISO(slot.startTime), 'HH:mm')}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setSelectedDate(null)
                setStep('select-date')
              }}
              className="mt-4 text-primary hover:underline"
            >
              ← Changer de date
            </button>
          </div>
        )}

        {/* Step 3: Fill Info */}
        {step === 'fill-info' && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Vos informations
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom complet *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.attendeeName}
                    onChange={(e) =>
                      setFormData({ ...formData, attendeeName: e.target.value })
                    }
                    placeholder="Jean Dupont"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.attendeeEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, attendeeEmail: e.target.value })
                    }
                    placeholder="jean.dupont@example.com"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.attendeePhone}
                    onChange={(e) =>
                      setFormData({ ...formData, attendeePhone: e.target.value })
                    }
                    placeholder="+33 6 12 34 56 78"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes / Message
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Informations complémentaires..."
                    rows={3}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setStep('select-time')}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                ← Retour
              </button>
              <button
                onClick={() => setStep('confirm')}
                disabled={!formData.attendeeName || !formData.attendeeEmail}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuer
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 'confirm' && selectedDate && selectedSlot && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Check className="w-5 h-5" />
              Confirmation
            </h3>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
              <div>
                <span className="text-gray-500">Service:</span>
                <span className="ml-2 font-medium">{productTitle}</span>
              </div>
              <div>
                <span className="text-gray-500">Date:</span>
                <span className="ml-2 font-medium">
                  {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Heure:</span>
                <span className="ml-2 font-medium">
                  {format(parseISO(selectedSlot.startTime), 'HH:mm')} -{' '}
                  {format(parseISO(selectedSlot.endTime), 'HH:mm')}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Nom:</span>
                <span className="ml-2 font-medium">{formData.attendeeName}</span>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>
                <span className="ml-2 font-medium">{formData.attendeeEmail}</span>
              </div>
              {formData.attendeePhone && (
                <div>
                  <span className="text-gray-500">Téléphone:</span>
                  <span className="ml-2 font-medium">{formData.attendeePhone}</span>
                </div>
              )}
              <div className="pt-2 border-t">
                <span className="text-gray-500">Total:</span>
                <span className="ml-2 font-bold text-lg text-primary">
                  {productPrice > 0 ? formatPrice(productPrice) : 'Gratuit'}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep('fill-info')}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                ← Modifier
              </button>
              <button
                onClick={handleBook}
                disabled={booking}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {booking ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Réservation en cours...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Confirmer la réservation
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {onCancel && (
        <div className="border-t px-6 py-4 bg-gray-50">
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            Annuler
          </button>
        </div>
      )}
    </div>
  )
}

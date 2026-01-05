'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Check,
  Clock,
  Calendar,
  User,
  Mail,
  CreditCard,
  Loader2,
  AlertCircle,
  ArrowLeft,
  X,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Booking {
  id: string
  status: 'pending_payment' | 'confirmed' | 'cancelled'
  serviceId: string
  serviceName: string
  startTime: string
  endTime: string
  timezone: string
  attendeeName: string
  attendeeEmail: string
  price: number
  currency: string
  isPaid: boolean
  createdAt: string
}

export default function BookingConfirmationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const bookingId = searchParams.get('bookingId')

  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [simulating, setSimulating] = useState(false)

  // Fetch booking details
  useEffect(() => {
    async function fetchBooking() {
      if (!bookingId) {
        setError('ID de réservation manquant')
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/bookings/test?id=${bookingId}`)
        const data = await res.json()

        if (data.success) {
          setBooking(data.booking)
        } else {
          setError(data.error || 'Réservation non trouvée')
        }
      } catch (err) {
        setError('Erreur de connexion')
      } finally {
        setLoading(false)
      }
    }

    fetchBooking()
  }, [bookingId])

  // Simulate payment for testing
  const handleSimulatePayment = async () => {
    if (!booking) return

    setSimulating(true)
    try {
      const res = await fetch('/api/checkout/simulate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: booking.id })
      })
      const data = await res.json()

      if (data.success) {
        // Refresh booking data
        const refreshRes = await fetch(`/api/bookings/test?id=${booking.id}`)
        const refreshData = await refreshRes.json()
        if (refreshData.success) {
          setBooking(refreshData.booking)
        }
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Erreur lors de la simulation du paiement')
    } finally {
      setSimulating(false)
    }
  }

  // Handle cancel
  const handleCancel = async () => {
    if (!booking || !confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) return

    try {
      const res = await fetch(`/api/appointments/${booking.id}`, {
        method: 'DELETE'
      })
      const data = await res.json()

      if (data.success) {
        setBooking({ ...booking, status: 'cancelled' })
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Erreur lors de l\'annulation')
    }
  }

  // Format price
  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency
    }).format(amount / 100)
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">Confirmé</Badge>
      case 'pending_payment':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente de paiement</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Annulé</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {error || 'Réservation non trouvée'}
              </h2>
              <p className="text-gray-600 mb-6">
                Impossible de charger les détails de cette réservation.
              </p>
              <Link href="/dashboard/calendar">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour au calendrier
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header with Neomia Studio branding */}
      <div className="bg-gradient-to-r from-[#CD7F32] to-[#B8860B] rounded-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Neomia Studio</h1>
            <p className="text-white/80 text-sm">Confirmation de réservation</p>
          </div>
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Statut de la réservation</CardTitle>
            {getStatusBadge(booking.status)}
          </div>
        </CardHeader>
        <CardContent>
          {booking.status === 'pending_payment' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 text-sm">
                <strong>Action requise:</strong> Votre réservation est en attente de paiement.
                Veuillez finaliser le paiement pour confirmer votre rendez-vous.
              </p>
            </div>
          )}
          {booking.status === 'confirmed' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-center gap-3">
              <Check className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-green-800 font-medium">Réservation confirmée !</p>
                <p className="text-green-700 text-sm">
                  Un email de confirmation a été envoyé à {booking.attendeeEmail}
                </p>
              </div>
            </div>
          )}
          {booking.status === 'cancelled' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-center gap-3">
              <X className="w-6 h-6 text-red-600" />
              <p className="text-red-800">Cette réservation a été annulée.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Details */}
      <Card>
        <CardHeader>
          <CardTitle>{booking.serviceName}</CardTitle>
          <CardDescription>Référence: {booking.id.slice(0, 8).toUpperCase()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">
                  {format(new Date(booking.startTime), 'EEEE d MMMM yyyy', { locale: fr })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Horaire</p>
                <p className="font-medium">
                  {format(new Date(booking.startTime), 'HH:mm')} - {format(new Date(booking.endTime), 'HH:mm')}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Participant</p>
                <p className="font-medium">{booking.attendeeName}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{booking.attendeeEmail}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600">Total à payer</span>
            </div>
            <span className="text-xl font-bold text-[#CD7F32]">
              {booking.price > 0 ? formatPrice(booking.price, booking.currency) : 'Gratuit'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {booking.status === 'pending_payment' && booking.price > 0 && (
              <Button
                onClick={handleSimulatePayment}
                disabled={simulating}
                className="flex-1 bg-[#CD7F32] hover:bg-[#B8860B]"
              >
                {simulating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Simuler le paiement (Test)
                  </>
                )}
              </Button>
            )}
            {booking.status !== 'cancelled' && (
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-2" />
                Annuler la réservation
              </Button>
            )}
          </div>

          <div className="flex justify-center mt-4 pt-4 border-t">
            <Link href="/dashboard/calendar">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour au calendrier
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Test Mode Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5" />
        <div>
          <p className="text-blue-800 font-medium text-sm">Mode Test Activé</p>
          <p className="text-blue-700 text-sm">
            Cette réservation a été créée via l'endpoint de test.
            Les paiements sont simulés et aucune transaction réelle n'est effectuée.
          </p>
        </div>
      </div>
    </div>
  )
}

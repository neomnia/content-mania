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
  ExternalLink,
  ShoppingBag,
  Package,
  Home,
  Download,
  Key,
  Copy,
  CheckCircle
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

interface Order {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  totalAmount: number
  createdAt: string
  items?: Array<{
    itemName: string
    quantity: number
    unitPrice: number
    totalPrice: number
    metadata?: {
      productType?: string
      downloadUrl?: string | null
      generatedLicenseKey?: string | null
      licenseInstructions?: string | null
    }
  }>
}

export default function ConfirmationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const bookingId = searchParams.get('bookingId')
  const orderId = searchParams.get('orderId')

  const [booking, setBooking] = useState<Booking | null>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [simulating, setSimulating] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Determine mode
  const isBookingMode = !!bookingId
  const isOrderMode = !!orderId
  
  // Helper to copy license key to clipboard
  const copyToClipboard = (text: string, productName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(productName)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  // Fetch data based on mode
  useEffect(() => {
    async function fetchData() {
      if (isBookingMode && bookingId) {
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
        }
      } else if (isOrderMode && orderId) {
        try {
          const res = await fetch(`/api/orders/${orderId}`)
          const data = await res.json()

          if (data.success) {
            setOrder(data.order)
          } else {
            setError(data.error || 'Commande non trouvée')
          }
        } catch (err) {
          console.error('[Confirmation] Failed to fetch order:', err)
          // If API doesn't exist yet, show generic success
          setOrder({
            id: orderId,
            orderNumber: `ORD-${orderId.slice(0, 8).toUpperCase()}`,
            status: 'completed',
            paymentStatus: 'pending',
            totalAmount: 0,
            createdAt: new Date().toISOString(),
            items: []
          })
        }
      } else {
        setError('Paramètre manquant (orderId ou bookingId)')
      }

      setLoading(false)
    }

    fetchData()
  }, [bookingId, orderId, isBookingMode, isOrderMode])

  // Simulate payment for testing (booking only)
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

  // Handle cancel (booking only)
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
  const formatPrice = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency
    }).format(amount / 100)
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>
      case 'pending_payment':
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Payment</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
      case 'shipped':
        return <Badge className="bg-blue-100 text-blue-800">Shipped</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#CD7F32]" />
      </div>
    )
  }

  if (error && !order && !booking) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {error}
              </h2>
              <p className="text-gray-600 mb-6">
                Impossible de charger les détails.
              </p>
              <Link href="/dashboard">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour au dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ORDER CONFIRMATION VIEW
  if (isOrderMode && order) {
    // Detect product types in the order
    const hasAppointments = order.appointments && order.appointments.length > 0
    const hasDigital = order.items?.some(item => item.metadata?.productType === 'digital') || false
    const hasPhysical = order.items?.some(item => item.metadata?.productType === 'physical') || false
    const productTypeCount = [hasAppointments, hasDigital, hasPhysical].filter(Boolean).length
    const isMixed = productTypeCount > 1
    
    // Determine header message and color based on product type
    let headerTitle = "Commande confirmée !"
    let headerSubtitle = "Merci pour votre achat"
    let headerIcon = <Check className="w-10 h-10" />
    let headerColor = "from-green-500 to-green-600"
    
    if (hasAppointments && !isMixed) {
      headerTitle = "Rendez-vous confirmé !"
      headerSubtitle = "Votre rendez-vous a été réservé avec succès"
      headerIcon = <Calendar className="w-10 h-10" />
      headerColor = "from-[#CD7F32] to-[#B8860B]"
    } else if (hasDigital && !isMixed) {
      headerTitle = "Produits numériques prêts !"
      headerSubtitle = "Accès immédiat à vos téléchargements"
      headerIcon = <Download className="w-10 h-10" />
      headerColor = "from-blue-500 to-blue-600"
    } else if (hasPhysical && !isMixed) {
      headerTitle = "Commande confirmée !"
      headerSubtitle = "Votre colis sera préparé et expédié"
      headerIcon = <Package className="w-10 h-10" />
      headerColor = "from-purple-500 to-purple-600"
    }
    
    return (
      <div className="max-w-2xl mx-auto space-y-6 p-6">
        {/* Success Header */}
        <div className={`bg-gradient-to-r ${headerColor} rounded-lg p-6 text-white text-center`}>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            {headerIcon}
          </div>
          <h1 className="text-2xl font-bold mb-2">{headerTitle}</h1>
          <p className="text-white/80">{headerSubtitle}</p>
        </div>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Order {order.orderNumber}
                </CardTitle>
                <CardDescription>
                  {format(new Date(order.createdAt), "MMMM d, yyyy 'at' HH:mm")}
                </CardDescription>
              </div>
              {getStatusBadge(order.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Contextual success message based on product type */}
            {hasAppointments && !isMixed && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <Calendar className="w-6 h-6 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-amber-800 font-medium">Rendez-vous confirmé !</p>
                  <p className="text-amber-700 text-sm">
                    Un email de confirmation avec les détails de votre rendez-vous et un fichier .ics pour l'ajouter à votre calendrier vous a été envoyé.
                  </p>
                </div>
              </div>
            )}
            {hasDigital && !isMixed && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <Download className="w-6 h-6 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-blue-800 font-medium">Produits numériques disponibles !</p>
                  <p className="text-blue-700 text-sm">
                    Vos liens de téléchargement et clés de licence sont disponibles ci-dessous. Un email de confirmation a également été envoyé.
                  </p>
                </div>
              </div>
            )}
            {hasPhysical && !isMixed && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start gap-3">
                <Package className="w-6 h-6 text-purple-600 mt-0.5" />
                <div>
                  <p className="text-purple-800 font-medium">Commande en préparation !</p>
                  <p className="text-purple-700 text-sm">
                    Votre commande sera préparée sous 24-48h. Vous recevrez un email avec le numéro de suivi dès l'expédition.
                  </p>
                </div>
              </div>
            )}
            {isMixed && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <Check className="w-6 h-6 text-green-600" />
                <div>
                  <p className="text-green-800 font-medium">Commande mixte confirmée !</p>
                  <p className="text-green-700 text-sm">
                    Votre commande contient plusieurs types de produits. Consultez les détails ci-dessous et vérifiez votre email.
                  </p>
                </div>
              </div>
            )}
            {!hasAppointments && !hasDigital && !hasPhysical && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <Check className="w-6 h-6 text-green-600" />
                <div>
                  <p className="text-green-800 font-medium">Commande reçue avec succès</p>
                  <p className="text-green-700 text-sm">
                    Un email de confirmation vous a été envoyé.
                  </p>
                </div>
              </div>
            )}

            {order.items && order.items.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-medium">Ordered Items</h3>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{item.itemName}</p>
                        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                      </div>
                      <p className="font-medium">{formatPrice(item.totalPrice)}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Digital Products Section - Download URLs and License Keys */}
            {order.items && order.items.filter(item => item.metadata?.productType === 'digital').length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Download className="w-5 h-5 text-blue-500" />
                    Your Digital Products
                  </h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <p className="text-sm text-blue-800">
                      🎉 Your digital products are ready for instant access! Download links and license keys are provided below.
                    </p>
                  </div>
                  {order.items
                    .filter(item => item.metadata?.productType === 'digital')
                    .map((item, idx) => (
                      <div key={idx} className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-5 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-lg text-purple-900">{item.itemName}</p>
                            <p className="text-sm text-purple-700">Digital Product • Instant Access</p>
                          </div>
                          <Badge className="bg-green-500 text-white">Ready</Badge>
                        </div>

                        {/* Download URL */}
                        {item.metadata?.downloadUrl && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <Download className="w-4 h-4" />
                              Download Link
                            </p>
                            <a
                              href={item.metadata.downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-3 bg-white border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors group"
                            >
                              <ExternalLink className="w-4 h-4 text-purple-600" />
                              <span className="text-purple-900 font-medium group-hover:underline">
                                Download {item.itemName}
                              </span>
                            </a>
                          </div>
                        )}

                        {/* License Key */}
                        {item.metadata?.generatedLicenseKey && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <Key className="w-4 h-4" />
                              License Key
                            </p>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 px-4 py-3 bg-white border border-purple-300 rounded-lg font-mono text-sm text-purple-900 font-semibold">
                                {item.metadata.generatedLicenseKey}
                              </code>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(item.metadata!.generatedLicenseKey!, item.itemName)}
                                className="shrink-0"
                              >
                                {copiedKey === item.itemName ? (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-4 h-4 mr-1" />
                                    Copy
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* License Instructions */}
                        {item.metadata?.licenseInstructions && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700">Activation Instructions</p>
                            <div className="px-4 py-3 bg-white border border-purple-300 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                              {item.metadata.licenseInstructions}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-sm text-gray-700">
                      <Mail className="w-4 h-4 inline mr-1" />
                      A copy of your license keys and download links has been sent to your email.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Appointments Section */}
            {order.appointments && order.appointments.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#CD7F32]" />
                    Scheduled Appointments
                  </h3>
                  {order.appointments.map((apt: any, idx: number) => (
                    <div key={idx} className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-medium text-amber-900">{apt.title}</p>
                          <p className="text-sm text-amber-700">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {format(new Date(apt.startTime), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                          </p>
                          <p className="text-sm text-amber-700">
                            <User className="w-3 h-3 inline mr-1" />
                            {apt.attendeeName} ({apt.attendeeEmail})
                          </p>
                        </div>
                        <Badge variant={apt.status === 'confirmed' ? 'default' : 'secondary'}>
                          {apt.status}
                        </Badge>
                      </div>
                      <div className="mt-3 pt-3 border-t border-amber-200 flex items-center justify-between text-sm">
                        <span className="text-amber-700">Payment Status</span>
                        <span className={apt.isPaid ? "text-green-600 font-medium" : "text-orange-600"}>
                          {apt.isPaid ? '✓ Paid' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <Mail className="w-4 h-4 inline mr-1" />
                      A confirmation email with your appointment details has been sent to you.
                    </p>
                  </div>
                </div>
              </>
            )}

            {order.totalAmount > 0 && (
              <>
                <Separator />
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600 font-medium">Total</span>
                  </div>
                  <span className="text-xl font-bold text-[#CD7F32]">
                    {formatPrice(order.totalAmount)}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/dashboard" className="flex-1">
                <Button className="w-full bg-[#CD7F32] hover:bg-[#B8860B]">
                  <Home className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <Link href="/store" className="flex-1">
                <Button variant="outline" className="w-full">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // BOOKING CONFIRMATION VIEW (existing)
  if (isBookingMode && booking) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 p-6">
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
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}

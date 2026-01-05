'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppointmentBooking } from '@/components/checkout/appointment-booking'
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Product {
  id: string
  title: string
  description: string | null
  price: number
  hourlyRate: number | null
  type: string
  currency: string
  isPublished: boolean
}

export default function BookAppointmentPage({
  params
}: {
  params: Promise<{ productId: string }>
}) {
  const { productId } = use(params)
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${productId}`)
        const data = await res.json()

        if (data.success && data.data) {
          if (data.data.type !== 'appointment') {
            setError('Ce produit ne supporte pas la réservation de rendez-vous')
          } else if (!data.data.isPublished) {
            setError('Ce service n\'est pas disponible actuellement')
          } else {
            setProduct(data.data)
          }
        } else {
          setError('Service non trouvé')
        }
      } catch (err) {
        setError('Erreur lors du chargement du service')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId])

  const handleBook = async (data: {
    startTime: string
    endTime: string
    timezone: string
    attendeeEmail: string
    attendeeName: string
    attendeePhone?: string
    notes?: string
  }) => {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointmentData: {
          productId,
          ...data
        }
      })
    })

    const result = await res.json()

    if (!result.success) {
      throw new Error(result.error || 'Erreur lors de la réservation')
    }

    // Success - the component handles the success state
    return result
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error || 'Service non disponible'}
          </h1>
          <p className="text-gray-600 mb-6">
            Impossible de charger ce service de réservation.
          </p>
          <Link
            href="/store"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la boutique
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Back link */}
        <Link
          href="/store"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la boutique
        </Link>

        {/* Description */}
        {product.description && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-2">
              À propos de ce service
            </h2>
            <p className="text-gray-600">{product.description}</p>
          </div>
        )}

        {/* Booking component */}
        <AppointmentBooking
          productId={product.id}
          productTitle={product.title}
          productPrice={product.hourlyRate || product.price}
          currency={product.currency}
          onBook={handleBook}
          onCancel={() => router.push('/store')}
        />
      </div>
    </div>
  )
}

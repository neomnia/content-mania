'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AppointmentBooking } from './appointment-booking'
import { Calendar, X } from 'lucide-react'

interface AppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  product: {
    id: string
    title: string
    price: number
    currency: string
  }
  onAppointmentBooked: (appointmentData: {
    productId: string
    startTime: string
    endTime: string
    timezone: string
    attendeeEmail: string
    attendeeName: string
    attendeePhone?: string
    notes?: string
  }) => void
}

/**
 * Modal qui s'ouvre pendant le checkout pour sélectionner un rendez-vous
 * Intègre le composant AppointmentBooking dans une modale
 */
export function AppointmentModal({
  isOpen,
  onClose,
  product,
  onAppointmentBooked
}: AppointmentModalProps) {
  const [isBooking, setIsBooking] = useState(false)

  const handleBook = async (data: {
    startTime: string
    endTime: string
    timezone: string
    attendeeEmail: string
    attendeeName: string
    attendeePhone?: string
    notes?: string
  }) => {
    setIsBooking(true)
    try {
      await onAppointmentBooked({
        productId: product.id,
        ...data
      })
      // La modale sera fermée par le parent après le succès
    } finally {
      setIsBooking(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <DialogTitle>Sélectionnez votre créneau</DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              disabled={isBooking}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Veuillez choisir un créneau disponible pour : {product.title}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4" onClick={(e) => e.stopPropagation()}>
          <AppointmentBooking
            productId={product.id}
            productTitle={product.title}
            productPrice={product.price}
            currency={product.currency}
            onBook={handleBook}
            onCancel={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

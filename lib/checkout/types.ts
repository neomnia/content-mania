/**
 * Types pour le tunnel d'achat
 */

export type ProductType = 'standard' | 'digital' | 'free' | 'appointment'

export interface CheckoutItem {
  productId: string
  productTitle: string
  productType: ProductType
  quantity: number
  unitPrice: number
  totalPrice: number
  metadata?: Record<string, any>
}

export interface AppointmentBookingData {
  productId: string
  startTime: Date
  endTime: Date
  timezone: string
  attendeeEmail: string
  attendeeName: string
  attendeePhone?: string
  notes?: string
}

export interface CheckoutSession {
  id: string
  userId: string
  userEmail: string
  items: CheckoutItem[]
  appointmentData?: AppointmentBookingData
  totalAmount: number
  currency: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  lagoInvoiceId?: string
  lagoCustomerId?: string
  createdAt: Date
  completedAt?: Date
}

export interface CheckoutResult {
  success: boolean
  orderId?: string
  appointmentId?: string
  invoiceId?: string
  paymentUrl?: string
  error?: string
  requiresPayment?: boolean
  testMode?: boolean
}

export interface LagoTestModeResult {
  success: boolean
  invoiceId: string
  invoiceNumber: string
  amount: number
  currency: string
  status: 'draft' | 'pending' | 'paid'
  testMode: true
  message: string
}

export interface TeamNotification {
  type: 'digital_product_purchase' | 'appointment_booking' | 'new_order'
  orderId: string
  orderNumber: string
  customerEmail: string
  customerName: string
  items: {
    name: string
    type: ProductType
    quantity: number
    price: number
  }[]
  totalAmount: number
  currency: string
  appointmentDetails?: {
    startTime: Date
    endTime: Date
    timezone: string
    notes?: string
  }
}

import type { SanityImageSource } from '@sanity/image-url'

export interface Product {
  _id: string
  title: string
  slug?: { current: string }
  price: number
  material?: string
  description: string
  image: SanityImageSource
  category?: string
  color?: string
  featured?: boolean
}

export type OrderStatus =
  | 'RICEVUTO'
  | 'IN_LAVORAZIONE'
  | 'SPEDITO'
  | 'IN_CONSEGNA'
  | 'CONSEGNATO'
  | 'PROBLEMA_CONSEGNA'
  | 'ANNULLATO'

export interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  createdAt: string
  isDemo?: boolean
}

export interface UserAddress {
  id: string
  label: string
  recipientName: string
  line1: string
  line2?: string
  city: string
  postalCode: string
  province: string
  country: string
  phone?: string
  isDefault: boolean
}

export interface ShippingAddressSnapshot {
  recipientName: string
  line1: string
  line2?: string
  city: string
  postalCode: string
  province?: string
  country: string
  phone?: string
}

export interface OrderItemSnapshot {
  id: string
  productId: string | null
  sku: string
  title: string
  imageUrl: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface OrderStatusEvent {
  id: string
  status: OrderStatus
  title: string
  description: string
  createdAt: string
}

export interface CustomerOrder {
  id: string
  orderNumber: string
  customerEmail?: string
  status: OrderStatus
  currency: string
  subtotal: number
  shippingCost: number
  discount: number
  tax: number
  total: number
  shippingAddress: ShippingAddressSnapshot
  billingAddress?: ShippingAddressSnapshot | null
  paymentMethodSummary: string
  carrierName: string | null
  trackingNumber: string | null
  trackingUrl: string | null
  estimatedDelivery: string | null
  receiptNumber: string | null
  createdAt: string
  updatedAt: string
  items: OrderItemSnapshot[]
  statusHistory: OrderStatusEvent[]
}

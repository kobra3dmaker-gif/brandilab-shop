import { ref } from 'vue'
import type { CustomerOrder, OrderStatus, ShippingAddressSnapshot } from '@/types'
import { useAuth, getAuthHeaders } from '@/composables/useAuth'

const API_BASE = import.meta.env.VITE_API_URL || ''
const DEMO_ORDERS_KEY = 'brandilab-demo-orders-v1'
const ADMIN_KEY_STORAGE = 'brandilab-admin-key'

export function buildCarrierTrackingUrl(
  carrierName: string | null | undefined,
  trackingNumber: string | null | undefined,
  customUrl?: string | null,
): string | null {
  if (customUrl && customUrl.trim()) return customUrl.trim()
  if (!trackingNumber || !trackingNumber.trim()) return null
  const code = encodeURIComponent(trackingNumber.trim())
  const c = (carrierName || '').toLowerCase()

  if (c.includes('brt') || c.includes('bartolini') || c.includes('dpd')) {
    return `https://vas.brt.it/vas/sped_det_show.hsm?chisono=${code}`
  }
  if (c.includes('poste') || c.includes('sda') || c.includes('crono')) {
    return `https://www.poste.it/cerca/index.html#/risultati-ricerca/${code}`
  }
  if (c.includes('dhl')) {
    return `https://www.dhl.com/it-it/home/tracciabilita.html?tracking-id=${code}`
  }
  if (c.includes('gls')) {
    return `https://www.gls-italy.com/it/servizi-per-destinatari/dettaglio-spedizione?numero_spedizione=${code}&tipo_ricerca=nazionale`
  }
  if (c.includes('inpost')) {
    return `https://inpost.it/trova-il-tuo-pacco?number=${code}`
  }
  if (c.includes('ups')) {
    return `https://www.ups.com/track?loc=it_IT&tracknum=${code}`
  }
  return null
}

export const DEFAULT_STATUS_MESSAGES: Record<OrderStatus, { title: string; description: string }> = {
  RICEVUTO: {
    title: 'Ordine ricevuto e pagamento confermato',
    description: 'Ordine registrato correttamente nel sistema BrandiLab.',
  },
  IN_LAVORAZIONE: {
    title: 'In stampa 3D e controllo qualità',
    description: 'Stiamo stampando il tuo ordine strato dopo strato nel nostro laboratorio.',
  },
  SPEDITO: {
    title: 'Spedito con corriere',
    description: 'Il pacco è stato affidato al corriere ed è in viaggio verso di te.',
  },
  IN_CONSEGNA: {
    title: 'In consegna oggi',
    description: 'Il corriere è uscito per la consegna al tuo indirizzo.',
  },
  CONSEGNATO: {
    title: 'Consegnato',
    description: 'Il pacco è stato consegnato all’indirizzo indicato.',
  },
  PROBLEMA_CONSEGNA: {
    title: 'Attenzione: aggiornamento sulla consegna',
    description: 'Il corriere ha segnalato un imprevisto durante la consegna.',
  },
  ANNULLATO: {
    title: 'Ordine annullato',
    description: 'Questo ordine è stato annullato.',
  },
}

const INITIAL_DEMO_ORDERS: CustomerOrder[] = [
  {
    id: 'ord-demo-01',
    orderNumber: 'ORD-2026-84K9P2',
    customerEmail: 'cliente@brandilab.it',
    status: 'SPEDITO',
    currency: 'eur',
    subtotal: 49.0,
    shippingCost: 0,
    discount: 0,
    tax: 8.84,
    total: 49.0,
    shippingAddress: {
      recipientName: 'Marco Rossi',
      line1: 'Via Emilia Centro 142, Scala B',
      city: 'Modena',
      postalCode: '41121',
      province: 'MO',
      country: 'IT',
      phone: '+39 348 123 4567',
    },
    paymentMethodSummary: 'VISA •••• 4242',
    carrierName: 'BRT / DPD Express',
    trackingNumber: '06219948271645',
    trackingUrl: 'https://vas.brt.it/vas/sped_det_show.hsm?chisono=06219948271645',
    estimatedDelivery: '2026-10-13T18:00:00Z',
    receiptNumber: 'RIC-2026-004192',
    createdAt: '2026-10-08T14:22:00Z',
    updatedAt: '2026-10-10T09:15:00Z',
    items: [
      {
        id: 'item-demo-1',
        productId: null,
        sku: 'BL-STAND-PRO',
        title: 'Supporto Controller & Cuffie Dual-Layer — Nero Opaco (PLA+)',
        imageUrl: '',
        quantity: 1,
        unitPrice: 29.0,
        totalPrice: 29.0,
      },
      {
        id: 'item-demo-2',
        productId: null,
        sku: 'BL-DESK-TRAY',
        title: 'Vassoio Svuotatasche Geometrico da Scrivania — Grigio Antracite',
        imageUrl: '',
        quantity: 1,
        unitPrice: 20.0,
        totalPrice: 20.0,
      },
    ],
    statusHistory: [
      {
        id: 'ev-1',
        status: 'RICEVUTO',
        title: 'Ordine ricevuto e pagamento confermato',
        description: 'Abbiamo ricevuto il tuo ordine #ORD-2026-84K9P2 e confermato il pagamento con Stripe.',
        createdAt: '2026-10-08T14:22:00Z',
      },
      {
        id: 'ev-2',
        status: 'IN_LAVORAZIONE',
        title: 'In stampa 3D e controllo qualità',
        description:
          'I tuoi pezzi sono stati stampati strato dopo strato nel nostro laboratorio di Pavullo nel Frignano e superati al controllo qualità.',
        createdAt: '2026-10-09T10:40:00Z',
      },
      {
        id: 'ev-3',
        status: 'SPEDITO',
        title: 'Spedito con corriere BRT / DPD Express',
        description: 'Pacco affidato al corriere. Codice di tracciamento: 06219948271645.',
        createdAt: '2026-10-10T09:15:00Z',
      },
    ],
  },
  {
    id: 'ord-demo-02',
    orderNumber: 'ORD-2026-51M3X7',
    customerEmail: 'cliente@brandilab.it',
    status: 'IN_LAVORAZIONE',
    currency: 'eur',
    subtotal: 34.0,
    shippingCost: 4.9,
    discount: 0,
    tax: 7.01,
    total: 38.9,
    shippingAddress: {
      recipientName: 'Marco Rossi',
      line1: 'Via Emilia Centro 142, Scala B',
      city: 'Modena',
      postalCode: '41121',
      province: 'MO',
      country: 'IT',
      phone: '+39 348 123 4567',
    },
    paymentMethodSummary: 'Apple Pay (Mastercard •••• 8819)',
    carrierName: null,
    trackingNumber: null,
    trackingUrl: null,
    estimatedDelivery: '2026-10-15T18:00:00Z',
    receiptNumber: 'RIC-2026-004218',
    createdAt: '2026-10-10T11:05:00Z',
    updatedAt: '2026-10-10T15:30:00Z',
    items: [
      {
        id: 'item-demo-3',
        productId: null,
        sku: 'BL-CANDY-BOWL',
        title: 'Porta Caramelle Articolato Stampato in 3D — Edizione Blu Elettrico',
        imageUrl: '',
        quantity: 2,
        unitPrice: 17.0,
        totalPrice: 34.0,
      },
    ],
    statusHistory: [
      {
        id: 'ev-201',
        status: 'RICEVUTO',
        title: 'Ordine ricevuto e pagamento confermato',
        description: 'Ordine registrato correttamente.',
        createdAt: '2026-10-10T11:05:00Z',
      },
      {
        id: 'ev-202',
        status: 'IN_LAVORAZIONE',
        title: 'In stampa 3D nel laboratorio BrandiLab',
        description: 'La stampa dei tuoi 2 pezzi è attualmente in corso sulle nostre stampanti.',
        createdAt: '2026-10-10T15:30:00Z',
      },
    ],
  },
  {
    id: 'ord-demo-03',
    orderNumber: 'ORD-2026-19C4W8',
    customerEmail: 'cliente@brandilab.it',
    status: 'CONSEGNATO',
    currency: 'eur',
    subtotal: 25.0,
    shippingCost: 4.9,
    discount: 0,
    tax: 5.39,
    total: 29.9,
    shippingAddress: {
      recipientName: 'Marco Rossi — Studio Design',
      line1: 'Viale Indipendenza 58, Piano 2',
      city: 'Bologna',
      postalCode: '40121',
      province: 'BO',
      country: 'IT',
      phone: '+39 348 123 4567',
    },
    paymentMethodSummary: 'VISA •••• 4242',
    carrierName: 'Poste Delivery Business',
    trackingNumber: '3UW0081928371IT',
    trackingUrl: 'https://www.poste.it/cerca/index.html#/risultati-ricerca/3UW0081928371IT',
    estimatedDelivery: '2026-08-22T18:00:00Z',
    receiptNumber: 'RIC-2026-003810',
    createdAt: '2026-08-18T09:12:00Z',
    updatedAt: '2026-08-21T16:04:00Z',
    items: [
      {
        id: 'item-demo-4',
        productId: null,
        sku: 'BL-CABLE-ORG',
        title: 'Set 6 Organizer Cavi Magnetici da Scrivania (PETG)',
        imageUrl: '',
        quantity: 1,
        unitPrice: 25.0,
        totalPrice: 25.0,
      },
    ],
    statusHistory: [
      {
        id: 'ev-301',
        status: 'RICEVUTO',
        title: 'Ordine ricevuto',
        description: 'Pagamento confermato con Stripe.',
        createdAt: '2026-08-18T09:12:00Z',
      },
      {
        id: 'ev-302',
        status: 'IN_LAVORAZIONE',
        title: 'In stampa 3D e controllo qualità',
        description: 'Stampa completata e verificata.',
        createdAt: '2026-08-19T11:30:00Z',
      },
      {
        id: 'ev-303',
        status: 'SPEDITO',
        title: 'Spedito con Poste Delivery Business',
        description: 'Codice di tracciamento: 3UW0081928371IT.',
        createdAt: '2026-08-19T18:10:00Z',
      },
      {
        id: 'ev-304',
        status: 'IN_CONSEGNA',
        title: 'In consegna',
        description: 'Il corriere è in consegna nella zona di Bologna.',
        createdAt: '2026-08-21T08:45:00Z',
      },
      {
        id: 'ev-305',
        status: 'CONSEGNATO',
        title: 'Consegnato',
        description: 'Consegnato e firmato dal destinatario a Bologna (BO).',
        createdAt: '2026-08-21T16:04:00Z',
      },
    ],
  },
]

function loadDemoOrders(): CustomerOrder[] {
  try {
    const raw = localStorage.getItem(DEMO_ORDERS_KEY)
    return raw ? (JSON.parse(raw) as CustomerOrder[]) : [...INITIAL_DEMO_ORDERS]
  } catch {
    return [...INITIAL_DEMO_ORDERS]
  }
}

function saveDemoOrders(list: CustomerOrder[]) {
  try {
    localStorage.setItem(DEMO_ORDERS_KEY, JSON.stringify(list))
  } catch {
    // Ignore storage error
  }
}

const orders = ref<CustomerOrder[]>([])
const adminOrders = ref<CustomerOrder[]>([])
const currentOrder = ref<CustomerOrder | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const adminKey = ref<string>(localStorage.getItem(ADMIN_KEY_STORAGE) || '')

export function useOrders() {
  const { user } = useAuth()

  function setAdminKey(key: string) {
    adminKey.value = key.trim()
    try {
      if (adminKey.value) localStorage.setItem(ADMIN_KEY_STORAGE, adminKey.value)
      else localStorage.removeItem(ADMIN_KEY_STORAGE)
    } catch {
      // Ignore storage error
    }
  }

  function getLocalOrdersForUser(email: string): CustomerOrder[] {
    const all = loadDemoOrders()
    const clean = email.trim().toLowerCase()
    if (clean === 'cliente@brandilab.it') {
      return all.filter((o) => !o.customerEmail || o.customerEmail.toLowerCase() === clean)
    }
    return all.filter((o) => o.customerEmail && o.customerEmail.toLowerCase() === clean)
  }

  async function fetchMyOrders(): Promise<CustomerOrder[]> {
    if (!user.value) {
      orders.value = []
      return []
    }

    if (user.value.isDemo) {
      orders.value = getLocalOrdersForUser(user.value.email)
      return orders.value
    }

    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/api/me/orders`, {
        headers: getAuthHeaders(),
      })
      const contentType = res.headers.get('content-type') || ''
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json()
        orders.value = data.orders || []
        return orders.value
      }
      if (res.status === 401) {
        error.value = 'unauthorized'
        return []
      }
      orders.value = getLocalOrdersForUser(user.value.email)
      return orders.value
    } catch {
      orders.value = getLocalOrdersForUser(user.value.email)
      return orders.value
    } finally {
      loading.value = false
    }
  }

  async function fetchOrderById(orderKey: string): Promise<CustomerOrder | null> {
    if (!user.value) return null

    if (user.value.isDemo) {
      const list = loadDemoOrders()
      const found = list.find((o) => o.id === orderKey || o.orderNumber === orderKey) || null
      currentOrder.value = found
      error.value = found ? null : 'order_not_found'
      return found
    }

    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/api/me/orders/${encodeURIComponent(orderKey)}`, {
        headers: getAuthHeaders(),
      })
      if (res.status === 404) {
        currentOrder.value = null
        error.value = 'order_not_found'
        return null
      }
      const contentType = res.headers.get('content-type') || ''
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json()
        currentOrder.value = data.order || null
        return currentOrder.value
      }
      const list = loadDemoOrders()
      const found = list.find((o) => o.id === orderKey || o.orderNumber === orderKey) || null
      currentOrder.value = found
      error.value = found ? null : 'order_not_found'
      return found
    } catch {
      const list = loadDemoOrders()
      const found = list.find((o) => o.id === orderKey || o.orderNumber === orderKey) || null
      currentOrder.value = found
      error.value = found ? null : 'order_not_found'
      return found
    } finally {
      loading.value = false
    }
  }

  async function confirmCheckoutSession(sessionId: string): Promise<CustomerOrder | null> {
    try {
      const res = await fetch(`${API_BASE}/api/orders/confirm-session`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ sessionId }),
      })
      const contentType = res.headers.get('content-type') || ''
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json()
        return data.order || null
      }
      return null
    } catch {
      return null
    }
  }

  // ── ADMIN PANEL ACTIONS (Updates D1 in production + local shared store in preview) ──

  async function fetchAdminOrders(): Promise<{ ok: boolean; isLocalFallback?: boolean }> {
    loading.value = true
    try {
      const res = await fetch(`${API_BASE}/api/admin/orders`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': adminKey.value,
        },
      })
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        if (res.status === 401) {
          return { ok: false }
        }
        if (res.ok) {
          const data = await res.json()
          adminOrders.value = data.orders || []
          return { ok: true, isLocalFallback: false }
        }
      }
      adminOrders.value = loadDemoOrders()
      return { ok: true, isLocalFallback: true }
    } catch {
      adminOrders.value = loadDemoOrders()
      return { ok: true, isLocalFallback: true }
    } finally {
      loading.value = false
    }
  }

  async function adminUpdateOrderStatus(
    orderId: string,
    payload: {
      status: OrderStatus
      carrierName?: string | null
      trackingNumber?: string | null
      trackingUrl?: string | null
      estimatedDelivery?: string | null
      title?: string
      description?: string
    },
  ): Promise<{ ok: boolean; order?: CustomerOrder }> {
    // 1. Try remote D1 API first
    try {
      const res = await fetch(`${API_BASE}/api/admin/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': adminKey.value,
        },
        body: JSON.stringify(payload),
      })
      const contentType = res.headers.get('content-type') || ''
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json()
        const updated = data.order as CustomerOrder
        adminOrders.value = adminOrders.value.map((o) => (o.id === updated.id ? updated : o))
        orders.value = orders.value.map((o) => (o.id === updated.id ? updated : o))
        if (currentOrder.value?.id === updated.id) {
          currentOrder.value = updated
        }
        return { ok: true, order: updated }
      }
    } catch {
      // Fallback to local store below
    }

    // 2. Local / Demo persistence (shared with Customer Portal)
    const list = loadDemoOrders()
    const idx = list.findIndex((o) => o.id === orderId || o.orderNumber === orderId)
    if (idx === -1) return { ok: false }
    const target = list[idx]
    if (!target) return { ok: false }

    const now = new Date().toISOString()
    const nextStatus = payload.status
    const carrier =
      payload.carrierName !== undefined ? (payload.carrierName || '').trim() || null : target.carrierName
    const tracking =
      payload.trackingNumber !== undefined
        ? (payload.trackingNumber || '').trim() || null
        : target.trackingNumber
    const resolvedUrl = buildCarrierTrackingUrl(carrier, tracking, payload.trackingUrl)

    const defaultMeta = DEFAULT_STATUS_MESSAGES[nextStatus]
    const evTitle =
      (payload.title || '').trim() ||
      (nextStatus === 'SPEDITO' && carrier ? `Spedito con corriere ${carrier}` : defaultMeta.title)
    const evDesc =
      (payload.description || '').trim() ||
      (nextStatus === 'SPEDITO' && tracking
        ? `Pacco affidato a ${carrier || 'corriere espresso'}. Codice di tracciamento: ${tracking}.`
        : defaultMeta.description)

    target.status = nextStatus
    target.carrierName = carrier
    target.trackingNumber = tracking
    target.trackingUrl = resolvedUrl
    if (payload.estimatedDelivery !== undefined) {
      target.estimatedDelivery = payload.estimatedDelivery || null
    }
    target.updatedAt = now
    target.statusHistory.push({
      id: `ev-${Date.now()}`,
      status: nextStatus,
      title: evTitle,
      description: evDesc,
      createdAt: now,
    })

    saveDemoOrders(list)
    adminOrders.value = [...list]
    orders.value = [...list]
    if (currentOrder.value?.id === target.id) {
      currentOrder.value = { ...target, statusHistory: [...target.statusHistory] }
    }
    return { ok: true, order: target }
  }

  async function adminCreateOrder(payload: {
    customerEmail: string
    shippingAddress: ShippingAddressSnapshot
    items: Array<{ sku: string; title: string; quantity: number; unitPrice: number }>
    shippingCost: number
    status: OrderStatus
    carrierName?: string
    trackingNumber?: string
  }): Promise<{ ok: boolean; order?: CustomerOrder }> {
    try {
      const res = await fetch(`${API_BASE}/api/admin/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': adminKey.value,
        },
        body: JSON.stringify(payload),
      })
      const contentType = res.headers.get('content-type') || ''
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json()
        const created = data.order as CustomerOrder
        adminOrders.value = [created, ...adminOrders.value]
        return { ok: true, order: created }
      }
    } catch {
      // Fallback to local store below
    }

    const now = new Date().toISOString()
    const suffix = Math.random().toString(36).substring(2, 8).toUpperCase()
    const orderNumber = `ORD-2026-${suffix}`
    const subtotal = payload.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
    const total = subtotal + (payload.shippingCost || 0)
    const tax = Number((total - total / 1.22).toFixed(2))
    const carrier = payload.carrierName?.trim() || null
    const tracking = payload.trackingNumber?.trim() || null

    const created: CustomerOrder = {
      id: `ord-${Date.now()}`,
      orderNumber,
      customerEmail: payload.customerEmail.trim().toLowerCase(),
      status: payload.status || 'RICEVUTO',
      currency: 'eur',
      subtotal,
      shippingCost: payload.shippingCost || 0,
      discount: 0,
      tax,
      total,
      shippingAddress: payload.shippingAddress,
      paymentMethodSummary: 'Ordine diretto / Stripe',
      carrierName: carrier,
      trackingNumber: tracking,
      trackingUrl: buildCarrierTrackingUrl(carrier, tracking),
      estimatedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      receiptNumber: `RIC-2026-${String(Math.floor(100000 + Math.random() * 900000))}`,
      createdAt: now,
      updatedAt: now,
      items: payload.items.map((it, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        productId: null,
        sku: it.sku || 'BL-3D',
        title: it.title,
        imageUrl: '',
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        totalPrice: it.unitPrice * it.quantity,
      })),
      statusHistory: [
        {
          id: `ev-${Date.now()}`,
          status: payload.status || 'RICEVUTO',
          title: DEFAULT_STATUS_MESSAGES[payload.status || 'RICEVUTO'].title,
          description: DEFAULT_STATUS_MESSAGES[payload.status || 'RICEVUTO'].description,
          createdAt: now,
        },
      ],
    }

    const list = [created, ...loadDemoOrders()]
    saveDemoOrders(list)
    adminOrders.value = [...list]
    orders.value = [...list]
    return { ok: true, order: created }
  }

  async function adminDeleteOrder(orderId: string): Promise<void> {
    try {
      await fetch(`${API_BASE}/api/admin/orders/${encodeURIComponent(orderId)}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Key': adminKey.value },
      }).catch(() => {})
    } catch {
      // Ignore network error
    }
    const list = loadDemoOrders().filter((o) => o.id !== orderId)
    saveDemoOrders(list)
    adminOrders.value = adminOrders.value.filter((o) => o.id !== orderId)
    orders.value = orders.value.filter((o) => o.id !== orderId)
  }

  function simulateNextOrderStatus(orderId: string) {
    const sequence: OrderStatus[] = ['RICEVUTO', 'IN_LAVORAZIONE', 'SPEDITO', 'IN_CONSEGNA', 'CONSEGNATO']
    const list = loadDemoOrders()
    const target = list.find((o) => o.id === orderId || o.orderNumber === orderId)
    if (!target) return
    const currentStepIdx = sequence.indexOf(target.status)
    const nextStatus: OrderStatus =
      currentStepIdx >= 0 && currentStepIdx < sequence.length - 1
        ? (sequence[currentStepIdx + 1] as OrderStatus)
        : 'RICEVUTO'

    adminUpdateOrderStatus(target.id, {
      status: nextStatus,
      ...(nextStatus === 'SPEDITO' && !target.trackingNumber
        ? { carrierName: 'BRT / DPD Express', trackingNumber: '06219948279910' }
        : {}),
    })
  }

  return {
    orders,
    adminOrders,
    currentOrder,
    loading,
    error,
    adminKey,
    setAdminKey,
    fetchMyOrders,
    fetchOrderById,
    confirmCheckoutSession,
    fetchAdminOrders,
    adminUpdateOrderStatus,
    adminCreateOrder,
    adminDeleteOrder,
    simulateNextOrderStatus,
  }
}

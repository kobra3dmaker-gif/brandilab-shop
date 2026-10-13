import { ref } from 'vue'
import type { CustomerOrder, OrderStatus } from '@/types'
import { useAuth, getAuthHeaders } from '@/composables/useAuth'

const API_BASE = import.meta.env.VITE_API_URL || ''

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
    title: 'Ordine ricevuto',
    description: 'Il tuo ordine è stato registrato ed è pronto per essere preso in carico.',
  },
  IN_LAVORAZIONE: {
    title: 'In stampa 3D',
    description: 'Il tuo pezzo è attualmente in lavorazione nel nostro laboratorio di Pavullo (MO).',
  },
  SPEDITO: {
    title: 'Spedito',
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

const orders = ref<CustomerOrder[]>([])
const currentOrder = ref<CustomerOrder | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

export function useOrders() {
  const { user } = useAuth()

  async function fetchMyOrders(): Promise<CustomerOrder[]> {
    if (!user.value) {
      orders.value = []
      return []
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
      error.value = 'fetch_failed'
      return []
    } catch {
      error.value = 'server_unreachable'
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchOrderById(orderKey: string): Promise<CustomerOrder | null> {
    if (!user.value) return null

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
      error.value = 'fetch_failed'
      return null
    } catch {
      error.value = 'server_unreachable'
      return null
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

  return {
    orders,
    currentOrder,
    loading,
    error,
    fetchMyOrders,
    fetchOrderById,
    confirmCheckoutSession,
  }
}

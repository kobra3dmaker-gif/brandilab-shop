import { useSnipcart } from './useSnipcart'
import { onMounted } from 'vue'

/**
 * Composable that listens for Snipcart order.completed events
 * and pushes new orders to the Admin Dashboard's Google Sheets API.
 *
 * Mount this in App.vue to automatically sync Snipcart orders with the admin system.
 */

const SCRIPT_ID = 'AKfycbwehSYdNkby0CX1oFUw7P3_7MmEctZw7CsxRVakYpM13HN4m8P0YwrZvMsCpChX3u-y-w'
const API_URL = `https://script.google.com/macros/s/${SCRIPT_ID}/exec`
const API_TOKEN = 'BrandiLab_Admin_99xK2pL5_2026!'

let listenerAttached = false

async function pushOrderToSheet(order: any) {
  // Format the items into a comma-separated string
  const productNames = order.items
    .map((item: any) => `${item.name} x${item.quantity}`)
    .join(', ')

  const totalPrice = `€${order.total.toFixed(2)}`
  const buyerName = `${order.billingAddress?.fullName || order.email || 'Website Order'}`

  const shippingAddress = order.shippingAddress
    ? `${order.shippingAddress.address1 || ''}, ${order.shippingAddress.city || ''} ${order.shippingAddress.postalCode || ''} ${order.shippingAddress.country || ''}`
    : ''

  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        token: API_TOKEN,
        action: 'addOrder',
        piattaforma: 'Sito Web',
        prodotto: productNames,
        prezzo: totalPrice,
        username: buyerName,
        indirizzo: shippingAddress,
        email: order.email || '',
        assegnato: '',
      }),
    })
    console.log('[BrandiLab] Order synced to admin dashboard:', order.token)
  } catch (error) {
    console.error('[BrandiLab] Failed to sync order to admin dashboard:', error)
  }
}

export function useOrderSync() {
  const { isReady } = useSnipcart()

  onMounted(() => {
    if (listenerAttached) return

    // Wait for Snipcart to be ready, then attach the listener
    const checkAndAttach = () => {
      const snipcart = (window as any).Snipcart
      if (!snipcart) return

      snipcart.events.on('order.completed', (order: any) => {
        console.log('[BrandiLab] Order completed:', order)
        pushOrderToSheet(order)
      })

      listenerAttached = true
    }

    if ((window as any).Snipcart) {
      checkAndAttach()
    } else {
      document.addEventListener('snipcart.ready', checkAndAttach)
    }
  })

  return { isReady }
}


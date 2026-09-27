import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Composable that bridges Vue with the Snipcart SDK.
 *
 * Snipcart exposes a global `window.Snipcart` object after it finishes loading.
 * This composable listens for the 'snipcart.ready' event (dispatched on document)
 * and keeps reactive refs in sync with the cart state.
 */

// Shared reactive state — singleton across all components that call useSnipcart()
const itemCount = ref(0)
const totalPrice = ref('0.00')
const isReady = ref(false)

// Keep track of whether we've already initialized the listeners
let initialized = false

function syncCartState() {
  const snipcart = (window as any).Snipcart
  if (!snipcart) return

  const cart = snipcart.store.getState().cart
  itemCount.value = cart?.items?.count ?? 0
  totalPrice.value = (cart?.total ?? 0).toFixed(2)
}

function initSnipcart() {
  if (initialized) return

  const snipcart = (window as any).Snipcart
  if (!snipcart) return

  initialized = true
  isReady.value = true
  syncCartState()

  // Follow every change of Snipcart's cart state (add/remove/quantity, and the fresh empty
  // cart Snipcart starts after a completed checkout), not just a few individual events
  snipcart.store.subscribe(syncCartState)

  // Snipcart v3 fires 'cart.confirmed' once an order is paid ('order.completed' was v2)
  snipcart.events.on('cart.confirmed', () => {
    itemCount.value = 0
    totalPrice.value = '0.00'
  })
}

function onSnipcartReady() {
  initSnipcart()
}

export function useSnipcart() {
  onMounted(() => {
    // Snipcart may already be loaded
    if ((window as any).Snipcart) {
      initSnipcart()
    } else {
      // Wait for Snipcart to finish loading
      document.addEventListener('snipcart.ready', onSnipcartReady)
    }
  })

  onUnmounted(() => {
    document.removeEventListener('snipcart.ready', onSnipcartReady)
  })

  /** Programmatically open the Snipcart cart drawer */
  function openCart() {
    const snipcart = (window as any).Snipcart
    if (snipcart) {
      snipcart.api.theme.cart.open()
    }
  }

  /** Programmatically close the Snipcart cart drawer */
  function closeCart() {
    const snipcart = (window as any).Snipcart
    if (snipcart) {
      snipcart.api.theme.cart.close()
    }
  }

  /** Add an item to the cart programmatically */
  function addItem(item: {
    id: string
    name: string
    price: number
    url: string
    description?: string
    image?: string
    quantity?: number
  }) {
    const snipcart = (window as any).Snipcart
    if (snipcart) {
      snipcart.api.cart.items.add({
        id: item.id,
        name: item.name,
        price: item.price,
        url: item.url,
        description: item.description || '',
        image: item.image || '',
        quantity: item.quantity || 1,
      })
    }
  }

  return {
    itemCount,
    totalPrice,
    isReady,
    openCart,
    closeCart,
    addItem,
  }
}


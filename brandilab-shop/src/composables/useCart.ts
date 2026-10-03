import { ref, computed, watch } from 'vue'
import type { Product } from '@/types'
import { urlFor } from '@/sanity'

/**
 * Cart item stored in state and localStorage.
 * We store the image URL string (not the Sanity source object) so it serializes to JSON.
 */
export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
}

const STORAGE_KEY = 'brandilab-cart'

// ── Singleton state shared across all components ──
const items = ref<CartItem[]>(loadFromStorage())
const isOpen = ref(false)

function loadFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value))
  } catch {
    // Storage blocked — cart just won't persist
  }
}

// Persist on every change
watch(items, saveToStorage, { deep: true })

// ── Composable ──
export function useCart() {
  const itemCount = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0),
  )

  const total = computed(() =>
    items.value.reduce((sum, item) => sum + item.price * item.quantity, 0),
  )

  /**
   * Add a product to the cart. If it's already there, increase the quantity.
   * Accepts a full Product object from Sanity and an optional quantity.
   */
  function addItem(product: Product, quantity = 1) {
    const existing = items.value.find((i) => i.id === product._id)
    if (existing) {
      existing.quantity += quantity
    } else {
      items.value.push({
        id: product._id,
        name: product.title,
        price: product.price,
        quantity,
        image: product.image ? urlFor(product.image).width(100).url() : '',
      })
    }
  }

  function removeItem(id: string) {
    items.value = items.value.filter((i) => i.id !== id)
  }

  function updateQuantity(id: string, quantity: number) {
    const item = items.value.find((i) => i.id === id)
    if (!item) return
    if (quantity <= 0) {
      removeItem(id)
    } else {
      item.quantity = quantity
    }
  }

  function clearCart() {
    items.value = []
  }

  function openCart() {
    isOpen.value = true
  }

  function closeCart() {
    isOpen.value = false
  }

  function toggleCart() {
    isOpen.value = !isOpen.value
  }

  return {
    items,
    itemCount,
    total,
    isOpen,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    openCart,
    closeCart,
    toggleCart,
  }
}

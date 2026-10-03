<script setup lang="ts">
import { ref } from 'vue'
import { useCart } from '@/composables/useCart'
import { useI18n } from 'vue-i18n'

const { items, itemCount, total, isOpen, closeCart, removeItem, updateQuantity, clearCart } = useCart()
const { t, n } = useI18n()

const API_BASE = import.meta.env.VITE_API_URL || ''

const checkoutLoading = ref(false)
const checkoutError = ref('')

async function checkout() {
  if (items.value.length === 0) return

  checkoutLoading.value = true
  checkoutError.value = ''

  try {
    const res = await fetch(`${API_BASE}/api/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.value.map((i) => ({ id: i.id, quantity: i.quantity })),
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[checkout] Status: ${res.status}, Body: ${body}`)
      throw new Error('checkout_failed')
    }

    const { url } = await res.json()
    // Redirect to Stripe Checkout
    window.location.href = url
  } catch (err: any) {
    console.error('Checkout error:', err.message || err)
    checkoutError.value = t('cart.checkoutError', 'Errore durante il checkout. Riprova.')
    checkoutLoading.value = false
  }
}
</script>

<template>
  <!-- Backdrop -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="cart-backdrop" @click="closeCart"></div>
    </Transition>

    <Transition name="slide">
      <aside v-if="isOpen" class="cart-drawer" role="dialog" aria-modal="true">
        <!-- Header -->
        <div class="cart-header">
          <h2 class="cart-title">{{ t('cart.title', 'Il tuo carrello') }}</h2>
          <button class="close-btn" @click="closeCart" aria-label="Chiudi carrello">&times;</button>
        </div>

        <!-- Empty state -->
        <div v-if="items.length === 0" class="cart-empty">
          <p>{{ t('cart.empty', 'Il carrello è vuoto.') }}</p>
        </div>

        <!-- Items list -->
        <div v-else class="cart-items">
          <div v-for="item in items" :key="item.id" class="cart-item">
            <img v-if="item.image" :src="item.image" :alt="item.name" class="item-image" />
            <div class="item-details">
              <p class="item-name">{{ item.name }}</p>
              <p class="item-price">{{ n(item.price, 'currency') }}</p>
              <div class="item-quantity">
                <button class="qty-btn" @click="updateQuantity(item.id, item.quantity - 1)">−</button>
                <span class="qty-value">{{ item.quantity }}</span>
                <button class="qty-btn" @click="updateQuantity(item.id, item.quantity + 1)">+</button>
              </div>
            </div>
            <button class="remove-btn" @click="removeItem(item.id)" :aria-label="t('cart.remove', 'Rimuovi')">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div v-if="items.length > 0" class="cart-footer">
          <button class="clear-btn" @click="clearCart">{{ t('cart.clear', 'Svuota carrello') }}</button>
          <div class="cart-total">
            <span class="total-label">{{ t('cart.total', 'Totale') }}:</span>
            <span class="total-value">{{ n(total, 'currency') }}</span>
          </div>
          <p v-if="checkoutError" class="checkout-error">{{ checkoutError }}</p>
          <button class="checkout-btn" :disabled="checkoutLoading" @click="checkout">
            <span v-if="checkoutLoading" class="spinner"></span>
            {{ checkoutLoading ? t('cart.processing', 'Elaborazione...') : t('cart.checkout', 'Procedi al checkout') }}
          </button>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Backdrop */
.cart-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1100;
}

/* Drawer */
.cart-drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 100%;
  max-width: 420px;
  height: 100vh;
  height: 100dvh;
  background: var(--color-surface);
  z-index: 1101;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
}

/* Header */
.cart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.cart-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.75rem;
  color: var(--color-text);
  cursor: pointer;
  line-height: 1;
  padding: 0;
}

/* Empty */
.cart-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  font-size: 1rem;
  padding: 2rem;
}

/* Items */
.cart-items {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.5rem;
}

.cart-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid var(--color-border);
}

.cart-item:last-child {
  border-bottom: none;
}

.item-image {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  flex-shrink: 0;
}

.item-details {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-text);
  margin: 0 0 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-price {
  font-size: 0.9rem;
  color: var(--color-accent);
  font-weight: 700;
  margin: 0 0 0.5rem;
}

.item-quantity {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.qty-btn {
  background: var(--color-bg);
  border: none;
  font-size: 1rem;
  padding: 0.2rem 0.6rem;
  cursor: pointer;
  color: var(--color-text);
}

.qty-btn:hover {
  background: var(--color-border);
}

.qty-value {
  padding: 0 0.75rem;
  font-weight: 600;
  font-size: 0.9rem;
}

.remove-btn {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0.25rem;
  flex-shrink: 0;
}

.remove-btn:hover {
  color: var(--color-danger);
}

/* Footer */
.cart-footer {
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--color-border);
}

.clear-btn {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
  margin-bottom: 1rem;
}

.clear-btn:hover {
  color: var(--color-danger);
}

.cart-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.total-label {
  font-weight: 600;
  font-size: 1.05rem;
  color: var(--color-text);
}

.total-value {
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--color-primary);
}

.checkout-error {
  color: var(--color-danger);
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
}

.checkout-btn {
  width: 100%;
  padding: 0.85rem;
  background: var(--color-accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.checkout-btn:hover:not(:disabled) {
  background: var(--color-accent-hover);
}

.checkout-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>

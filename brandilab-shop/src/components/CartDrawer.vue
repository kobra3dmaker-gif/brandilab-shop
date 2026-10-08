<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCart } from '@/composables/useCart'
import { useProducts } from '@/composables/useProducts'
import { useCatalog } from '@/composables/useCatalog'

const { items, itemCount, total, isOpen, closeCart, removeItem, updateQuantity, clearCart } = useCart()
const { getProductById } = useProducts()
const { fieldOf } = useCatalog()
const { t, n } = useI18n()

const API_BASE = import.meta.env.VITE_API_URL || ''

const checkoutLoading = ref(false)
const checkoutError = ref('')
const panel = ref<HTMLElement | null>(null)
let lastFocus: HTMLElement | null = null

function fieldFor(id: string) {
  const product = getProductById(id)
  return product ? fieldOf(product) : 'light'
}

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
    window.location.href = url
  } catch (err: unknown) {
    console.error('Checkout error:', err instanceof Error ? err.message : err)
    checkoutError.value = t('cart.checkoutError')
    checkoutLoading.value = false
  }
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') closeCart()
}

watch(isOpen, async (open) => {
  if (open) {
    lastFocus = document.activeElement as HTMLElement | null
    document.documentElement.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    await nextTick()
    panel.value?.focus()
  } else {
    document.documentElement.style.overflow = ''
    window.removeEventListener('keydown', onKey)
    lastFocus?.focus?.()
  }
})

onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <Transition name="backdrop">
      <div v-if="isOpen" class="backdrop" @click="closeCart" />
    </Transition>

    <Transition name="drawer">
      <aside
        v-if="isOpen"
        ref="panel"
        class="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        tabindex="-1"
      >
        <header class="head">
          <h2 id="cart-title" class="title display">{{ t('cart.title') }}</h2>
          <span class="count tabular">{{ t('cart.items', itemCount) }}</span>
          <button class="close" :aria-label="t('cart.close')" @click="closeCart">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="square" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
          </button>
        </header>

        <div v-if="items.length === 0" class="empty">
          <p>{{ t('cart.empty') }}</p>
          <RouterLink :to="{ path: '/', hash: '#catalogo' }" class="btn btn-ink" @click="closeCart">
            {{ t('cart.emptyCta') }}
          </RouterLink>
        </div>

        <TransitionGroup v-else tag="ul" name="line" class="lines">
          <li v-for="item in items" :key="item.id" class="line">
            <RouterLink :to="`/product/${item.id}`" class="thumb" :class="`f-${fieldFor(item.id)}`" @click="closeCart">
              <img v-if="item.image" :src="item.image" :alt="item.name" width="72" height="90" />
            </RouterLink>
            <div class="line-body">
              <RouterLink :to="`/product/${item.id}`" class="line-name" @click="closeCart">{{ item.name }}</RouterLink>
              <div class="line-row">
                <div class="qty" role="group" :aria-label="item.name">
                  <button :aria-label="t('product.decrease')" @click="updateQuantity(item.id, item.quantity - 1)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="square" aria-hidden="true"><path d="M5 12h14" /></svg>
                  </button>
                  <output class="tabular">{{ item.quantity }}</output>
                  <button :aria-label="t('product.increase')" @click="updateQuantity(item.id, item.quantity + 1)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="square" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                  </button>
                </div>
                <span class="line-price tabular">{{ n(item.price * item.quantity, 'currency') }}</span>
              </div>
            </div>
            <button class="remove" :aria-label="t('cart.remove', { name: item.name })" @click="removeItem(item.id)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="square" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </li>
        </TransitionGroup>

        <footer v-if="items.length > 0" class="foot">
          <div class="sum">
            <span>{{ t('cart.total') }}</span>
            <span class="sum-value tabular">{{ n(total, 'currency') }}</span>
          </div>
          <p class="note">{{ t('cart.note') }}</p>
          <p v-if="checkoutError" class="error" role="alert">{{ checkoutError }}</p>
          <button class="btn btn-blue checkout" :disabled="checkoutLoading" @click="checkout">
            <span v-if="checkoutLoading" class="spinner" aria-hidden="true" />
            {{ checkoutLoading ? t('cart.processing') : t('cart.checkout') }}
            <svg v-if="!checkoutLoading" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
          <button class="clear" @click="clearCart">{{ t('cart.clear') }}</button>
        </footer>
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgba(20, 20, 20, 0.45);
}

.drawer {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 1101;
  width: 100%;
  max-width: 440px;
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--paper);
  color: var(--ink);
  border-left: 2px solid var(--rule);
  outline: none;
}

.head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: var(--paper-2);
  color: var(--ink);
}

.title {
  font-size: 1.9rem;
}

.count {
  font-weight: 600;
}

.close {
  margin-left: auto;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  transition: transform 160ms var(--ease-out);
}

.close:active {
  transform: scale(0.92);
}

.empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 1.25rem;
  padding: 2rem 1.25rem;
  font-size: 1.15rem;
  font-weight: 600;
}

.lines {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0 1.25rem;
}

.line {
  display: grid;
  grid-template-columns: 72px 1fr auto;
  gap: 0.9rem;
  padding: 1rem 0;
  border-bottom: 1px solid var(--rule-soft);
}

.thumb {
  display: block;
  padding: 5px;
  background: var(--tile-light);
}

.thumb.f-dark {
  background: var(--tile-dark);
}

.thumb img {
  width: 100%;
  aspect-ratio: 4 / 5;
  height: auto;
  object-fit: cover;
}

.line-body {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.6rem;
  min-width: 0;
}

.line-name {
  font-weight: 700;
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.qty {
  display: flex;
  border: 2px solid var(--ink);
}

.qty button {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
}

.qty output {
  min-width: 2rem;
  display: grid;
  place-items: center;
  font-weight: 800;
}

.line-price {
  font-weight: 800;
  font-stretch: var(--semi-wide);
}

.remove {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  color: var(--ink-3);
  transition: color 0.15s ease;
}

@media (hover: hover) and (pointer: fine) {
  .remove:hover {
    color: var(--danger);
  }

  .qty button:hover {
    background: var(--paper-2);
  }
}

.foot {
  padding: 1rem 1.25rem calc(1.25rem + env(safe-area-inset-bottom));
  border-top: 2px solid var(--rule);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.sum {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-weight: 700;
  font-size: 1.1rem;
}

.sum-value {
  font-stretch: var(--wide);
  font-weight: 850;
  font-size: 1.6rem;
  letter-spacing: -0.03em;
}

.note {
  font-size: 0.88rem;
  color: var(--ink-2);
}

.error {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--danger);
}

.checkout {
  width: 100%;
  min-height: 56px;
  font-size: 1.08rem;
}

.clear {
  align-self: center;
  font-size: 0.88rem;
  color: var(--ink-2);
  text-decoration: underline;
  text-underline-offset: 3px;
  min-height: 36px;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2.5px solid rgba(255, 255, 255, 0.35);
  border-top-color: var(--on-blue);
  border-radius: 50%;
  animation: spin 0.55s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Motion */
.backdrop-enter-active {
  transition: opacity 0.3s ease;
}

.backdrop-leave-active {
  transition: opacity 0.2s ease;
}

.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

.drawer-enter-active {
  transition: transform 0.38s var(--ease-drawer);
}

.drawer-leave-active {
  transition: transform 0.22s var(--ease-drawer);
}

.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(100%);
}

.line-enter-active,
.line-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s var(--ease-out);
}

.line-enter-from,
.line-leave-to {
  opacity: 0;
  transform: translateX(16px);
}

.line-leave-active {
  position: absolute;
  width: calc(100% - 2.5rem);
}

.line-move {
  transition: transform 0.22s var(--ease-out);
}

@media (prefers-reduced-motion: reduce) {
  .drawer-enter-active,
  .drawer-leave-active {
    transition: opacity 0.2s ease;
  }

  .drawer-enter-from,
  .drawer-leave-to {
    transform: none;
    opacity: 0;
  }

  .spinner {
    animation-duration: 1.5s;
  }
}
</style>

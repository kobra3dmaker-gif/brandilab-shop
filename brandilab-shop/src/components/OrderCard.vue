<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { CustomerOrder, OrderItemSnapshot } from '@/types'
import { useCart } from '@/composables/useCart'
import { useProducts } from '@/composables/useProducts'

defineProps<{
  order: CustomerOrder
}>()

const { t, n, locale } = useI18n()
const { items: cartItems, openCart } = useCart()
const { getProductById } = useProducts()

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(locale.value === 'en' ? 'en-GB' : 'it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function buyAgain(item: OrderItemSnapshot) {
  const catalogProduct = item.productId ? getProductById(item.productId) : undefined
  const targetId = catalogProduct?._id || item.productId || item.sku
  const existing = cartItems.value.find((i) => i.id === targetId)
  if (existing) {
    existing.quantity += 1
  } else {
    cartItems.value.push({
      id: targetId,
      name: item.title,
      price: item.unitPrice,
      quantity: 1,
      image: item.imageUrl || '',
    })
  }
  openCart()
}
</script>

<template>
  <article class="order-card">
    <!-- Top Summary Header Bar (Amazon 4-column pattern) -->
    <header class="card-head">
      <div class="head-meta">
        <div class="meta-col">
          <span class="meta-label">{{ t('portal.orderCard.placedOn') }}</span>
          <span class="meta-val tabular">{{ formatDate(order.createdAt) }}</span>
        </div>

        <div class="meta-col">
          <span class="meta-label">{{ t('portal.orderCard.total') }}</span>
          <span class="meta-val tabular">{{ n(order.total, 'currency') }}</span>
        </div>

        <div class="meta-col ship-to-col" tabindex="0">
          <span class="meta-label">{{ t('portal.orderCard.shipTo') }}</span>
          <span class="meta-val ship-trigger">
            {{ order.shippingAddress.recipientName }}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
          <!-- Address Popover on Hover / Focus -->
          <div class="address-popover" role="tooltip">
            <strong>{{ order.shippingAddress.recipientName }}</strong>
            <span>{{ order.shippingAddress.line1 }}</span>
            <span v-if="order.shippingAddress.line2">{{ order.shippingAddress.line2 }}</span>
            <span>
              {{ order.shippingAddress.postalCode }} {{ order.shippingAddress.city }}
              <template v-if="order.shippingAddress.province">({{ order.shippingAddress.province }})</template>
            </span>
          </div>
        </div>
      </div>

      <div class="head-right">
        <span class="meta-label">{{ t('portal.orderCard.orderNum') }} <strong class="tabular">{{ order.orderNumber }}</strong></span>
        <div class="head-links">
          <RouterLink :to="`/account/orders/${order.id}`" class="head-link">
            {{ t('portal.orderCard.viewDetails') }}
          </RouterLink>
          <span aria-hidden="true">·</span>
          <RouterLink :to="{ path: `/account/orders/${order.id}`, query: { print: '1' } }" class="head-link">
            {{ t('portal.orderCard.receipt') }}
          </RouterLink>
        </div>
      </div>
    </header>

    <!-- Card Body -->
    <div class="card-body">
      <div class="body-main">
        <!-- Prominent Status Banner -->
        <div class="status-banner">
          <span class="status-dot" :class="`dot-${order.status.toLowerCase()}`" aria-hidden="true" />
          <div>
            <h3 class="status-headline">
              {{ t(`portal.timeline.steps.${order.status}`) }}
            </h3>
            <p v-if="order.statusHistory.length > 0" class="status-sub">
              {{ order.statusHistory[order.statusHistory.length - 1]?.description }}
            </p>
          </div>
        </div>

        <!-- Purchased Line Items -->
        <ul class="item-list">
          <li v-for="item in order.items" :key="item.id" class="item-row">
            <div class="item-thumb">
              <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.title" width="68" height="68" loading="lazy" />
              <div v-else class="cube-placeholder" aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
            </div>

            <div class="item-details">
              <RouterLink
                v-if="item.productId"
                :to="`/product/${item.productId}`"
                class="item-title link-hover"
              >
                {{ item.title }}
              </RouterLink>
              <span v-else class="item-title">{{ item.title }}</span>

              <div class="item-meta">
                <span class="sku-tag tabular">{{ item.sku }}</span>
                <span>{{ t('portal.orderCard.qty', { n: item.quantity }) }}</span>
                <strong class="tabular">{{ n(item.unitPrice, 'currency') }}</strong>
              </div>

              <div class="item-inline-actions">
                <button type="button" class="btn-inline" @click="buyAgain(item)">
                  ↻ {{ t('portal.orderCard.buyAgain') }}
                </button>
              </div>
            </div>
          </li>
        </ul>
      </div>

      <!-- Right Action Stack (Amazon CTA column) -->
      <aside class="body-actions">
        <RouterLink :to="`/account/orders/${order.id}`" class="btn btn-blue btn-block">
          {{ t('portal.orderCard.trackPackage') }}
        </RouterLink>
        <RouterLink :to="`/account/orders/${order.id}`" class="btn btn-line btn-block">
          {{ t('portal.orderCard.viewDetails') }}
        </RouterLink>
        <RouterLink
          :to="{ path: '/contact', query: { type: 'order', order: order.orderNumber } }"
          class="help-link"
        >
          {{ t('portal.orderCard.needHelp') }}
        </RouterLink>
      </aside>
    </div>
  </article>
</template>

<style scoped>
.order-card {
  border: 2px solid var(--rule);
  background: var(--paper);
}

.card-head {
  background: var(--paper-2);
  border-bottom: 1.5px solid var(--rule-soft);
  padding: 0.9rem 1.25rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 1rem 2rem;
}

.head-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 2.25rem;
}

.meta-col {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.meta-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ink-3);
  font-weight: 700;
}

.meta-val {
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--ink);
}

.ship-to-col {
  position: relative;
  cursor: pointer;
}

.ship-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--link);
}

.address-popover {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 20;
  min-width: 230px;
  padding: 0.75rem 0.9rem;
  background: var(--paper);
  border: 2px solid var(--ink);
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  font-size: 0.84rem;
  opacity: 0;
  pointer-events: none;
  transform: translateY(4px);
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.ship-to-col:hover .address-popover,
.ship-to-col:focus-within .address-popover {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

.head-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.15rem;
}

.head-links {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.88rem;
  font-weight: 700;
}

.head-link {
  color: var(--link);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.card-body {
  padding: 1.25rem;
  display: grid;
  grid-template-columns: 1fr 230px;
  gap: 1.75rem;
  align-items: start;
}

.status-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  margin-bottom: 1.25rem;
}

.status-dot {
  width: 12px;
  height: 12px;
  margin-top: 0.35rem;
  flex-shrink: 0;
  background: var(--blue);
}

.dot-consegnato {
  background: var(--color-success);
}

.dot-annullato,
.dot-problema_consegna {
  background: var(--danger);
}

.status-headline {
  font-stretch: var(--semi-wide);
  font-weight: 850;
  font-size: 1.15rem;
}

.status-sub {
  font-size: 0.88rem;
  color: var(--ink-2);
  margin-top: 0.15rem;
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.item-row {
  display: grid;
  grid-template-columns: 68px 1fr;
  gap: 1rem;
  align-items: center;
  padding-top: 0.85rem;
  border-top: 1px solid var(--rule-soft);
}

.item-thumb {
  width: 68px;
  height: 68px;
  background: var(--paper-2);
  border: 1px solid var(--rule-soft);
  display: grid;
  place-items: center;
  overflow: hidden;
}

.item-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cube-placeholder {
  color: var(--ink-3);
}

.item-details {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.item-title {
  font-weight: 750;
  line-height: 1.3;
}

.link-hover:hover {
  color: var(--link);
  text-decoration: underline;
}

.item-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.85rem;
  color: var(--ink-2);
}

.sku-tag {
  padding: 0.1rem 0.45rem;
  background: var(--paper-2);
  border: 1px solid var(--rule-soft);
  font-size: 0.75rem;
  font-weight: 700;
}

.btn-inline {
  margin-top: 0.2rem;
  font-size: 0.84rem;
  font-weight: 700;
  color: var(--link);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.body-actions {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.btn-block {
  width: 100%;
  min-height: 42px;
  padding: 0.6rem 1rem;
  font-size: 0.9rem;
}

.help-link {
  margin-top: 0.25rem;
  text-align: center;
  font-size: 0.83rem;
  font-weight: 600;
  color: var(--ink-2);
  text-decoration: underline;
  text-underline-offset: 3px;
}

@media (max-width: 780px) {
  .head-right {
    align-items: flex-start;
  }

  .card-body {
    grid-template-columns: 1fr;
  }
}
</style>

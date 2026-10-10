<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import { useOrders } from '@/composables/useOrders'
import { useCart } from '@/composables/useCart'
import type { OrderItemSnapshot } from '@/types'
import OrderTimeline from '@/components/OrderTimeline.vue'

const route = useRoute()
const { t, n, locale } = useI18n()
const { user } = useAuth()
const { currentOrder: order, loading, fetchOrderById, simulateNextOrderStatus } = useOrders()
const { items: cartItems, openCart } = useCart()

async function loadOrder() {
  const id = String(route.params.id || '')
  if (!id) return
  await fetchOrderById(id)
  if (route.query.print === '1' && order.value) {
    setTimeout(() => {
      window.print()
    }, 350)
  }
}

// Revalidate automatically when user focuses the browser tab (Smart Focus Revalidation)
function onWindowFocus() {
  const id = String(route.params.id || '')
  if (id && !user.value?.isDemo) {
    fetchOrderById(id)
  }
}

onMounted(() => {
  loadOrder()
  window.addEventListener('focus', onWindowFocus)
})

onUnmounted(() => {
  window.removeEventListener('focus', onWindowFocus)
})

watch(
  () => route.params.id,
  () => loadOrder(),
)

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

function printReceipt() {
  window.print()
}

function buyAgain(item: OrderItemSnapshot) {
  const targetId = item.productId || item.sku
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
  <main class="detail-page">
    <div class="container">
      <!-- Top Breadcrumb -->
      <nav class="breadcrumb no-print" aria-label="Breadcrumb">
        <RouterLink to="/account" class="back-link">
          ← {{ t('portal.detail.backToOrders') }}
        </RouterLink>
      </nav>

      <!-- Loading -->
      <div v-if="loading" class="state-box">
        <p>Caricamento dettagli ordine…</p>
      </div>

      <!-- Not Found / Zero-Trust 404 State -->
      <div v-else-if="!order" class="state-box">
        <h1 class="display state-title">{{ t('portal.detail.notFoundTitle') }}</h1>
        <p>{{ t('portal.detail.notFoundText') }}</p>
        <RouterLink to="/account" class="btn btn-ink">
          {{ t('portal.detail.backToOrders') }}
        </RouterLink>
      </div>

      <!-- Order Detail Content -->
      <template v-else>
        <!-- Interactive Demo Simulator Banner (Allows live testing of the FSM & Timeline) -->
        <aside v-if="user?.isDemo" class="demo-sim-bar no-print">
          <p>{{ t('portal.detail.demoSimulateBar') }}</p>
          <div style="display: flex; flex-wrap: wrap; gap: 0.6rem;">
            <RouterLink to="/admin" class="btn btn-line btn-sm">
              ⚙️ Apri Pannello Admin (/admin)
            </RouterLink>
            <button
              type="button"
              class="btn btn-ink btn-sm"
              @click="simulateNextOrderStatus(order.id)"
            >
              {{ t('portal.detail.demoAdvanceBtn') }}
            </button>
          </div>
        </aside>

        <!-- Printable Fiscal Receipt Header (Visible when printing) -->
        <header class="print-only-header">
          <div>
            <strong>BrandiLab — Studio di Stampa 3D</strong>
            <p>P.IVA IT04260600368 · 41026 Pavullo nel Frignano (MO)</p>
          </div>
          <div class="print-doc-meta">
            <strong>RICEVUTA D’ACQUISTO</strong>
            <p class="tabular">{{ order.receiptNumber || `RIC-${order.orderNumber}` }}</p>
          </div>
        </header>

        <!-- Main Title Row -->
        <header class="detail-head">
          <div>
            <h1 class="detail-title display">{{ t('portal.detail.title') }}</h1>
            <p class="detail-sub">
              {{ t('portal.detail.placedOn', { date: formatDate(order.createdAt) }) }} ·
              {{ t('portal.orderCard.orderNum') }} <strong class="tabular">{{ order.orderNumber }}</strong>
            </p>
          </div>

          <button type="button" class="btn btn-line no-print" @click="printReceipt">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square" aria-hidden="true">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            {{ t('portal.detail.printReceipt') }}
          </button>
        </header>

        <!-- Amazon-style 3-Column Summary Grid (Shipping Snapshot, Payment & Receipt, Totals) -->
        <section class="summary-grid">
          <!-- Column 1: Historical Shipping Snapshot -->
          <div class="summary-col">
            <h2 class="col-heading">{{ t('portal.detail.shippingAddressTitle') }}</h2>
            <address class="addr-lines">
              <strong>{{ order.shippingAddress.recipientName }}</strong>
              <span>{{ order.shippingAddress.line1 }}</span>
              <span v-if="order.shippingAddress.line2">{{ order.shippingAddress.line2 }}</span>
              <span>
                {{ order.shippingAddress.postalCode }} {{ order.shippingAddress.city }}
                <template v-if="order.shippingAddress.province">({{ order.shippingAddress.province }})</template>
              </span>
              <span>{{ order.shippingAddress.country }}</span>
              <span v-if="order.shippingAddress.phone">{{ order.shippingAddress.phone }}</span>
            </address>
          </div>

          <!-- Column 2: Payment & Fiscal Receipt Info -->
          <div class="summary-col">
            <h2 class="col-heading">{{ t('portal.detail.paymentMethodTitle') }}</h2>
            <p class="pay-method">{{ order.paymentMethodSummary }}</p>

            <div class="doc-block">
              <span class="doc-label">{{ t('portal.detail.fiscalDocLabel') }}</span>
              <strong class="tabular">{{ order.receiptNumber || `RIC-${order.orderNumber}` }}</strong>
            </div>
          </div>

          <!-- Column 3: Financial Breakdown -->
          <div class="summary-col">
            <h2 class="col-heading">{{ t('portal.detail.summaryTitle') }}</h2>
            <dl class="cost-list tabular">
              <div class="cost-row">
                <dt>{{ t('portal.detail.subtotal') }}:</dt>
                <dd>{{ n(order.subtotal, 'currency') }}</dd>
              </div>
              <div class="cost-row">
                <dt>{{ t('portal.detail.shipping') }}:</dt>
                <dd>{{ order.shippingCost === 0 ? t('portal.detail.freeShipping') : n(order.shippingCost, 'currency') }}</dd>
              </div>
              <div v-if="order.discount > 0" class="cost-row">
                <dt>{{ t('portal.detail.discount') }}:</dt>
                <dd>-{{ n(order.discount, 'currency') }}</dd>
              </div>
              <div class="cost-row muted">
                <dt>{{ t('portal.detail.vatIncluded') }}:</dt>
                <dd>{{ n(order.tax, 'currency') }}</dd>
              </div>
              <div class="cost-row total-row">
                <dt>{{ t('portal.detail.orderTotal') }}:</dt>
                <dd>{{ n(order.total, 'currency') }}</dd>
              </div>
            </dl>
          </div>
        </section>

        <!-- Dynamic Visual Timeline Stepper -->
        <div class="timeline-section no-print">
          <OrderTimeline :order="order" />
        </div>

        <!-- Purchased Products List -->
        <section class="items-panel">
          <h2 class="panel-title">{{ t('portal.detail.itemsTitle') }}</h2>
          <ul class="detail-items">
            <li v-for="item in order.items" :key="item.id" class="detail-item">
              <div class="item-info">
                <span class="sku-badge tabular">{{ item.sku }}</span>
                <h3 class="item-name">{{ item.title }}</h3>
                <p class="item-qty tabular">
                  {{ t('portal.orderCard.qty', { n: item.quantity }) }} × {{ n(item.unitPrice, 'currency') }}
                </p>
              </div>

              <div class="item-right">
                <strong class="item-total tabular">{{ n(item.totalPrice, 'currency') }}</strong>
                <button type="button" class="btn btn-line btn-sm no-print" @click="buyAgain(item)">
                  ↻ {{ t('portal.orderCard.buyAgain') }}
                </button>
              </div>
            </li>
          </ul>
        </section>
      </template>
    </div>
  </main>
</template>

<style scoped>
.detail-page {
  padding: clamp(2rem, 4vw, 3rem) 0 clamp(4rem, 7vw, 6rem);
}

.breadcrumb {
  margin-bottom: 1.25rem;
}

.back-link {
  font-weight: 750;
  color: var(--link);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.demo-sim-bar {
  margin-bottom: 1.5rem;
  padding: 0.9rem 1.25rem;
  background: var(--paper-2);
  border: 2px dashed var(--blue);
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  font-size: 0.9rem;
  font-weight: 700;
}

.btn-sm {
  min-height: 38px;
  padding: 0.45rem 0.95rem;
  font-size: 0.86rem;
}

.detail-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.detail-title {
  font-size: clamp(2rem, 4.5vw, 3rem);
}

.detail-sub {
  margin-top: 0.4rem;
  color: var(--ink-2);
  font-size: 0.98rem;
}

.summary-grid {
  border: 2px solid var(--rule);
  background: var(--paper);
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-bottom: 1.75rem;
}

.summary-col {
  padding: 1.35rem 1.5rem;
  border-right: 1.5px solid var(--rule-soft);
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.summary-col:last-child {
  border-right: none;
}

.col-heading {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ink-3);
  font-weight: 800;
}

.addr-lines {
  font-style: normal;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  font-size: 0.94rem;
}

.pay-method {
  font-weight: 750;
}

.doc-block {
  margin-top: 0.5rem;
  padding-top: 0.65rem;
  border-top: 1px solid var(--rule-soft);
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.doc-label {
  font-size: 0.78rem;
  color: var(--ink-3);
  font-weight: 700;
}

.cost-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.92rem;
}

.cost-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.cost-row.muted {
  color: var(--ink-3);
  font-size: 0.84rem;
}

.cost-row.total-row {
  margin-top: 0.35rem;
  padding-top: 0.55rem;
  border-top: 2px solid var(--ink);
  font-weight: 850;
  font-size: 1.08rem;
}

.timeline-section {
  margin-bottom: 1.75rem;
}

.items-panel {
  border: 2px solid var(--rule);
  background: var(--paper);
  padding: 1.5rem;
}

.panel-title {
  font-stretch: var(--semi-wide);
  font-weight: 850;
  font-size: 1.25rem;
  margin-bottom: 1rem;
}

.detail-items {
  display: flex;
  flex-direction: column;
}

.detail-item {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
  border-top: 1px solid var(--rule-soft);
}

.sku-badge {
  display: inline-block;
  padding: 0.1rem 0.45rem;
  background: var(--paper-2);
  border: 1px solid var(--rule-soft);
  font-size: 0.75rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.item-name {
  font-weight: 750;
  font-size: 1.02rem;
}

.item-qty {
  font-size: 0.88rem;
  color: var(--ink-2);
  margin-top: 0.15rem;
}

.item-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.item-total {
  font-stretch: var(--semi-wide);
  font-weight: 850;
  font-size: 1.15rem;
}

.state-box {
  border: 2px solid var(--rule);
  padding: 3rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
}

.state-title {
  font-size: 2.25rem;
}

.print-only-header {
  display: none;
}

@media (max-width: 820px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .summary-col {
    border-right: none;
    border-bottom: 1.5px solid var(--rule-soft);
  }

  .summary-col:last-child {
    border-bottom: none;
  }
}

@media print {
  .no-print {
    display: none !important;
  }

  .print-only-header {
    display: flex;
    justify-content: space-between;
    padding-bottom: 1rem;
    margin-bottom: 1.5rem;
    border-bottom: 2px solid #000;
  }

  .print-doc-meta {
    text-align: right;
  }
}
</style>


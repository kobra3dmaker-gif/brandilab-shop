<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { CustomerOrder, OrderStatus } from '@/types'
import { useOrders } from '@/composables/useOrders'

const { n } = useI18n()
const {
  adminOrders,
  loading,
  adminKey,
  setAdminKey,
  fetchAdminOrders,
  adminUpdateOrderStatus,
  adminCreateOrder,
  adminDeleteOrder,
} = useOrders()

const keyInput = ref(adminKey.value || 'brandilab2026')
const isUnlocked = ref(Boolean(adminKey.value))
const authError = ref(false)
const isLocalPreview = ref(false)

const searchQuery = ref('')
const statusFilter = ref<'ALL' | OrderStatus>('ALL')
const copiedAddressId = ref<string | null>(null)
const savedOrderId = ref<string | null>(null)
const savingOrderId = ref<string | null>(null)

const CARRIERS = [
  'BRT / DPD Express',
  'Poste Delivery / SDA',
  'DHL Express',
  'GLS Italy',
  'InPost',
  'UPS',
]

const STATUS_OPTIONS: Array<{ value: OrderStatus; label: string }> = [
  { value: 'RICEVUTO', label: '1. Ricevuto (Da stampare)' },
  { value: 'IN_LAVORAZIONE', label: '2. In lavorazione (In stampa 3D)' },
  { value: 'SPEDITO', label: '3. Spedito con tracking' },
  { value: 'IN_CONSEGNA', label: '4. In consegna oggi' },
  { value: 'CONSEGNATO', label: '5. Consegnato' },
  { value: 'PROBLEMA_CONSEGNA', label: '⚠️ Problema con la consegna' },
  { value: 'ANNULLATO', label: '✕ Annullato' },
]

interface OrderDraft {
  status: OrderStatus
  carrierName: string
  trackingNumber: string
  estimatedDeliveryDate: string
  customNote: string
}

const drafts = reactive<Record<string, OrderDraft>>({})

function syncDrafts(list: CustomerOrder[]) {
  for (const ord of list) {
    const existing = drafts[ord.id]
    const isoDate = ord.estimatedDelivery ? ord.estimatedDelivery.slice(0, 10) : ''
    drafts[ord.id] = {
      status: ord.status,
      carrierName: ord.carrierName || existing?.carrierName || 'BRT / DPD Express',
      trackingNumber: ord.trackingNumber || '',
      estimatedDeliveryDate: isoDate,
      customNote: '',
    }
  }
}

async function unlockAdmin() {
  authError.value = false
  setAdminKey(keyInput.value || 'brandilab2026')
  const res = await fetchAdminOrders()
  if (!res.ok) {
    authError.value = true
    isUnlocked.value = false
    return
  }
  isLocalPreview.value = Boolean(res.isLocalFallback)
  isUnlocked.value = true
  syncDrafts(adminOrders.value)
}

function lockAdmin() {
  setAdminKey('')
  isUnlocked.value = false
}

onMounted(async () => {
  if (isUnlocked.value) {
    const res = await fetchAdminOrders()
    if (res.ok) {
      isLocalPreview.value = Boolean(res.isLocalFallback)
      syncDrafts(adminOrders.value)
    } else {
      isUnlocked.value = false
    }
  }
})

// Stats counters
const countByStatus = computed(() => {
  const counts: Record<string, number> = {
    ALL: adminOrders.value.length,
    RICEVUTO: 0,
    IN_LAVORAZIONE: 0,
    SPEDITO: 0,
    IN_CONSEGNA: 0,
    CONSEGNATO: 0,
  }
  for (const o of adminOrders.value) {
    counts[o.status] = (counts[o.status] || 0) + 1
  }
  return counts
})

const filteredOrders = computed(() => {
  let list = [...adminOrders.value]
  if (statusFilter.value !== 'ALL') {
    list = list.filter((o) => o.status === statusFilter.value)
  }
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        (o.customerEmail && o.customerEmail.toLowerCase().includes(q)) ||
        o.shippingAddress.recipientName.toLowerCase().includes(q) ||
        o.shippingAddress.city.toLowerCase().includes(q) ||
        (o.trackingNumber && o.trackingNumber.toLowerCase().includes(q)) ||
        o.items.some((i) => i.title.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)),
    )
  }
  return list
})

async function handleSaveOrder(order: CustomerOrder) {
  const draft = drafts[order.id]
  if (!draft) return

  savingOrderId.value = order.id
  const estimatedIso = draft.estimatedDeliveryDate
    ? new Date(`${draft.estimatedDeliveryDate}T18:00:00Z`).toISOString()
    : null

  const res = await adminUpdateOrderStatus(order.id, {
    status: draft.status,
    carrierName: draft.carrierName || null,
    trackingNumber: draft.trackingNumber || null,
    estimatedDelivery: estimatedIso,
    description: draft.customNote.trim() || undefined,
  })

  savingOrderId.value = null
  if (res.ok) {
    draft.customNote = ''
    savedOrderId.value = order.id
    setTimeout(() => {
      if (savedOrderId.value === order.id) savedOrderId.value = null
    }, 2500)
  }
}

async function copyShippingAddress(order: CustomerOrder) {
  const a = order.shippingAddress
  const lines = [
    a.recipientName,
    a.line1,
    a.line2 || '',
    `${a.postalCode} ${a.city} ${a.province ? `(${a.province})` : ''}`.trim(),
    a.country,
    a.phone ? `Tel: ${a.phone}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  try {
    await navigator.clipboard.writeText(lines)
    copiedAddressId.value = order.id
    setTimeout(() => {
      if (copiedAddressId.value === order.id) copiedAddressId.value = null
    }, 2000)
  } catch {
    // Ignore clipboard error
  }
}

// ── New Order Modal / Drawer ──
const showNewOrderForm = ref(false)
const newOrderForm = reactive({
  customerEmail: 'cliente@brandilab.it',
  recipientName: 'Marco Rossi',
  line1: 'Via Emilia Centro 142',
  city: 'Modena',
  postalCode: '41121',
  province: 'MO',
  phone: '+39 348 123 4567',
  sku: 'BL-CUSTOM-3D',
  productTitle: '',
  quantity: 1,
  unitPrice: 29,
  shippingCost: 0,
  status: 'RICEVUTO' as OrderStatus,
})

async function handleCreateOrder() {
  if (!newOrderForm.customerEmail.trim() || !newOrderForm.productTitle.trim()) return

  const res = await adminCreateOrder({
    customerEmail: newOrderForm.customerEmail,
    shippingAddress: {
      recipientName: newOrderForm.recipientName,
      line1: newOrderForm.line1,
      city: newOrderForm.city,
      postalCode: newOrderForm.postalCode,
      province: newOrderForm.province,
      country: 'IT',
      phone: newOrderForm.phone,
    },
    items: [
      {
        sku: newOrderForm.sku,
        title: newOrderForm.productTitle,
        quantity: Number(newOrderForm.quantity) || 1,
        unitPrice: Number(newOrderForm.unitPrice) || 0,
      },
    ],
    shippingCost: Number(newOrderForm.shippingCost) || 0,
    status: newOrderForm.status,
  })

  if (res.ok) {
    syncDrafts(adminOrders.value)
    showNewOrderForm.value = false
    newOrderForm.productTitle = ''
  }
}

async function handleDeleteOrder(order: CustomerOrder) {
  if (!confirm(`Eliminare definitivamente l'ordine ${order.orderNumber}?`)) return
  await adminDeleteOrder(order.id)
}

function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}
</script>

<template>
  <main class="admin-page">
    <div class="container">
      <!-- 1. LOCK SCREEN -->
      <section v-if="!isUnlocked" class="unlock-card">
        <p class="eyebrow">BrandiLab — Gestione Operativa</p>
        <h1 class="display unlock-title">Pannello Ordini & Tracking</h1>
        <p class="unlock-sub">
          Inserisci la chiave amministratore (<code>ADMIN_SECRET</code>) per gestire gli stati di stampa 3D e inserire i codici di tracciamento dei corrieri.
        </p>

        <form class="unlock-form" @submit.prevent="unlockAdmin">
          <input
            v-model="keyInput"
            type="password"
            placeholder="Chiave Admin (default locale: brandilab2026)"
            class="input"
          />
          <button type="submit" class="btn btn-blue">Accedi al Pannello</button>
        </form>
        <p v-if="authError" class="err-msg">Chiave amministratore non valida.</p>
      </section>

      <!-- 2. UNLOCKED ADMIN PANEL -->
      <template v-else>
        <!-- Top Header -->
        <header class="admin-head">
          <div>
            <div class="head-badges">
              <span class="badge-ink">ADMIN</span>
              <span v-if="isLocalPreview" class="badge-blue">
                Sincronizzato con Portale Clienti Locale / Demo
              </span>
            </div>
            <h1 class="display admin-title">Gestione Ordini & Spedizioni</h1>
            <p class="admin-sub">
              Ogni modifica salvata qui aggiorna istantaneamente la Timeline e il Tracking nell’Area Clienti.
            </p>
          </div>

          <div class="head-actions">
            <button
              type="button"
              class="btn btn-blue"
              @click="showNewOrderForm = !showNewOrderForm"
            >
              {{ showNewOrderForm ? '✕ Chiudi form' : '+ Nuovo Ordine Cliente' }}
            </button>
            <RouterLink to="/account" class="btn btn-line">
              Vedi Area Clienti ↗
            </RouterLink>
            <button type="button" class="btn btn-line" @click="lockAdmin">
              Esci
            </button>
          </div>
        </header>

        <!-- New Order Form (For custom 3D prints or manual orders) -->
        <form v-if="showNewOrderForm" class="new-order-box" @submit.prevent="handleCreateOrder">
          <h2 class="box-title">Crea un nuovo ordine (visibile nell’Area Clienti dell’acquirente)</h2>
          <div class="form-grid-3">
            <label class="field">
              <span class="field-label">Email Cliente (lega l’ordine all’account) *</span>
              <input v-model="newOrderForm.customerEmail" type="email" required class="input" />
            </label>
            <label class="field">
              <span class="field-label">Nome e Cognome Destinatario *</span>
              <input v-model="newOrderForm.recipientName" type="text" required class="input" />
            </label>
            <label class="field">
              <span class="field-label">Telefono (per corriere)</span>
              <input v-model="newOrderForm.phone" type="tel" class="input" />
            </label>
            <label class="field">
              <span class="field-label">Indirizzo e Civico *</span>
              <input v-model="newOrderForm.line1" type="text" required class="input" />
            </label>
            <label class="field">
              <span class="field-label">Città *</span>
              <input v-model="newOrderForm.city" type="text" required class="input" />
            </label>
            <div class="row-2-tight">
              <label class="field">
                <span class="field-label">CAP *</span>
                <input v-model="newOrderForm.postalCode" type="text" required class="input" />
              </label>
              <label class="field">
                <span class="field-label">Prov.</span>
                <input v-model="newOrderForm.province" type="text" maxlength="4" class="input" />
              </label>
            </div>
            <label class="field">
              <span class="field-label">Nome Prodotto / Stampa su misura *</span>
              <input
                v-model="newOrderForm.productTitle"
                type="text"
                placeholder="Es. Supporto Cuffie Personalizzato in PETG"
                required
                class="input"
              />
            </label>
            <div class="row-2-tight">
              <label class="field">
                <span class="field-label">SKU</span>
                <input v-model="newOrderForm.sku" type="text" class="input" />
              </label>
              <label class="field">
                <span class="field-label">Quantità</span>
                <input v-model.number="newOrderForm.quantity" type="number" min="1" class="input" />
              </label>
            </div>
            <div class="row-2-tight">
              <label class="field">
                <span class="field-label">Prezzo Unit. (€)</span>
                <input v-model.number="newOrderForm.unitPrice" type="number" step="0.1" class="input" />
              </label>
              <label class="field">
                <span class="field-label">Spedizione (€)</span>
                <input v-model.number="newOrderForm.shippingCost" type="number" step="0.1" class="input" />
              </label>
            </div>
          </div>

          <div class="new-order-foot">
            <button type="submit" class="btn btn-blue">Crea Ordine e Inizializza Timeline</button>
          </div>
        </form>

        <!-- Quick Status Filter Bar -->
        <section class="stats-bar">
          <button
            type="button"
            class="stat-tab"
            :class="{ active: statusFilter === 'ALL' }"
            @click="statusFilter = 'ALL'"
          >
            Tutti <span class=" tabular">{{ countByStatus.ALL }}</span>
          </button>
          <button
            type="button"
            class="stat-tab"
            :class="{ active: statusFilter === 'RICEVUTO' }"
            @click="statusFilter = 'RICEVUTO'"
          >
            Da Stampare (Ricevuti) <span class="tabular">{{ countByStatus.RICEVUTO || 0 }}</span>
          </button>
          <button
            type="button"
            class="stat-tab"
            :class="{ active: statusFilter === 'IN_LAVORAZIONE' }"
            @click="statusFilter = 'IN_LAVORAZIONE'"
          >
            In Stampa 3D <span class="tabular">{{ countByStatus.IN_LAVORAZIONE || 0 }}</span>
          </button>
          <button
            type="button"
            class="stat-tab"
            :class="{ active: statusFilter === 'SPEDITO' }"
            @click="statusFilter = 'SPEDITO'"
          >
            Spediti <span class="tabular">{{ countByStatus.SPEDITO || 0 }}</span>
          </button>
          <button
            type="button"
            class="stat-tab"
            :class="{ active: statusFilter === 'CONSEGNATO' }"
            @click="statusFilter = 'CONSEGNATO'"
          >
            Consegnati <span class="tabular">{{ countByStatus.CONSEGNATO || 0 }}</span>
          </button>
        </section>

        <!-- Search Box -->
        <div class="search-bar">
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Cerca per # ordine, email cliente, nome destinatario, città, prodotto o codice tracking…"
            class="input search-input"
          />
        </div>

        <!-- Orders List -->
        <div v-if="loading" class="empty-state">Caricamento ordini…</div>
        <div v-else-if="filteredOrders.length === 0" class="empty-state">
          Nessun ordine trovato per questo filtro.
        </div>

        <div v-else class="admin-orders-list">
          <article v-for="ord in filteredOrders" :key="ord.id" class="admin-order-card">
            <!-- Order Top Bar -->
            <header class="ord-top">
              <div class="ord-top-left">
                <strong class="ord-number tabular">{{ ord.orderNumber }}</strong>
                <span class="ord-date tabular">{{ formatDateTime(ord.createdAt) }}</span>
                <span v-if="ord.customerEmail" class="ord-email">{{ ord.customerEmail }}</span>
              </div>

              <div class="ord-top-right">
                <span class="ord-total tabular">{{ n(ord.total, 'currency') }}</span>
                <RouterLink :to="`/account/orders/${ord.id}`" class="preview-link">
                  👁️ Vedi Timeline Cliente ↗
                </RouterLink>
                <button type="button" class="del-btn" title="Elimina ordine" @click="handleDeleteOrder(ord)">
                  ✕
                </button>
              </div>
            </header>

            <!-- 2-Column Operational Body: Left = Info & Items to print, Right = Status & Tracking Editor -->
            <div class="ord-grid">
              <!-- Left Column: Items to 3D print + Shipping Address -->
              <div class="ord-info-col">
                <div class="info-block">
                  <div class="block-head">
                    <span class="block-label">Articoli da stampare / preparare</span>
                  </div>
                  <ul class="print-items">
                    <li v-for="item in ord.items" :key="item.id" class="print-item">
                      <span class="qty-badge tabular">{{ item.quantity }}×</span>
                      <div>
                        <strong>{{ item.title }}</strong>
                        <span class="sku-inline tabular">{{ item.sku }}</span>
                      </div>
                    </li>
                  </ul>
                </div>

                <div class="info-block">
                  <div class="block-head">
                    <span class="block-label">Indirizzo per Etichetta Corriere</span>
                    <button type="button" class="copy-addr-btn" @click="copyShippingAddress(ord)">
                      {{ copiedAddressId === ord.id ? '✓ Indirizzo copiato!' : '📋 Copia per corriere' }}
                    </button>
                  </div>
                  <p class="addr-text">
                    <strong>{{ ord.shippingAddress.recipientName }}</strong> —
                    {{ ord.shippingAddress.line1 }}
                    <template v-if="ord.shippingAddress.line2">, {{ ord.shippingAddress.line2 }}</template>,
                    {{ ord.shippingAddress.postalCode }} {{ ord.shippingAddress.city }}
                    <template v-if="ord.shippingAddress.province">({{ ord.shippingAddress.province }})</template>
                    <template v-if="ord.shippingAddress.phone"> · Tel: {{ ord.shippingAddress.phone }}</template>
                  </p>
                </div>
              </div>

              <!-- Right Column: Status & Tracking Control Panel -->
              <form
                v-if="drafts[ord.id]"
                class="ord-control-col"
                @submit.prevent="handleSaveOrder(ord)"
              >
                <div class="control-row-2">
                  <label class="field">
                    <span class="field-label">Stato Avanzamento Ordine</span>
                    <select v-model="drafts[ord.id]!.status" class="input select-status">
                      <option v-for="opt in STATUS_OPTIONS" :key="opt.value" :value="opt.value">
                        {{ opt.label }}
                      </option>
                    </select>
                  </label>

                  <label class="field">
                    <span class="field-label">Consegna Prevista</span>
                    <input
                      v-model="drafts[ord.id]!.estimatedDeliveryDate"
                      type="date"
                      class="input tabular"
                    />
                  </label>
                </div>

                <div class="control-row-2">
                  <label class="field">
                    <span class="field-label">Corriere (genera link automatico)</span>
                    <input
                      v-model="drafts[ord.id]!.carrierName"
                      list="carriers-list"
                      placeholder="Es. BRT / DPD Express, Poste, DHL…"
                      class="input"
                    />
                  </label>

                  <label class="field">
                    <span class="field-label">Codice di Tracking</span>
                    <input
                      v-model="drafts[ord.id]!.trackingNumber"
                      type="text"
                      placeholder="Incolla qui il numero di tracking…"
                      class="input tabular"
                    />
                  </label>
                </div>

                <label class="field">
                  <span class="field-label">
                    Messaggio per la Timeline del cliente (opzionale — se vuoto usa il testo automatico)
                  </span>
                  <input
                    v-model="drafts[ord.id]!.customNote"
                    type="text"
                    placeholder="Es. Pezzo stampato e verificato, affidato al corriere…"
                    class="input"
                  />
                </label>

                <div class="control-foot">
                  <button
                    type="submit"
                    class="btn btn-blue save-btn"
                    :disabled="savingOrderId === ord.id"
                  >
                    {{
                      savingOrderId === ord.id
                        ? 'Salvataggio…'
                        : 'Salva e Aggiorna Timeline Cliente'
                    }}
                  </button>

                  <span v-if="savedOrderId === ord.id" class="saved-pill">
                    ✓ Stato e tracking aggiornati!
                  </span>
                </div>
              </form>
            </div>
          </article>
        </div>

        <datalist id="carriers-list">
          <option v-for="c in CARRIERS" :key="c" :value="c" />
        </datalist>
      </template>
    </div>
  </main>
</template>

<style scoped>
.admin-page {
  padding: clamp(2rem, 4vw, 3.5rem) 0 clamp(4rem, 7vw, 6rem);
  background: var(--paper-2);
  min-height: calc(100vh - var(--navbar-height));
}

.unlock-card {
  max-width: 540px;
  margin: 2rem auto;
  background: var(--paper);
  border: 2px solid var(--rule);
  padding: 2.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.eyebrow {
  font-size: 0.76rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--blue);
}

.unlock-title {
  font-size: 2.2rem;
}

.unlock-sub {
  color: var(--ink-2);
  font-size: 0.94rem;
}

.unlock-form {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.err-msg {
  color: var(--danger);
  font-weight: 700;
  font-size: 0.9rem;
}

/* Header */
.admin-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1.5rem;
  margin-bottom: 1.75rem;
}

.head-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.badge-ink {
  padding: 0.18rem 0.55rem;
  background: var(--ink);
  color: var(--paper);
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0.05em;
}

.badge-blue {
  padding: 0.18rem 0.55rem;
  background: var(--blue);
  color: var(--on-blue);
  font-size: 0.72rem;
  font-weight: 800;
}

.admin-title {
  font-size: clamp(2rem, 4vw, 2.85rem);
}

.admin-sub {
  margin-top: 0.35rem;
  color: var(--ink-2);
}

.head-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

/* New Order Form */
.new-order-box {
  background: var(--paper);
  border: 2px solid var(--rule);
  padding: 1.5rem;
  margin-bottom: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.box-title {
  font-stretch: var(--semi-wide);
  font-weight: 850;
  font-size: 1.2rem;
}

.form-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.row-2-tight {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
}

.new-order-foot {
  display: flex;
  justify-content: flex-end;
}

/* Filter Tabs */
.stats-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.stat-tab {
  padding: 0.55rem 1rem;
  background: var(--paper);
  border: 1.5px solid var(--rule-soft);
  font-weight: 750;
  font-size: 0.88rem;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.stat-tab.active {
  background: var(--ink);
  color: var(--paper);
  border-color: var(--ink);
}

.search-bar {
  margin-bottom: 1.5rem;
}

.input {
  width: 100%;
  min-height: 42px;
  padding: 0.55rem 0.8rem;
  background: var(--paper);
  border: 2px solid var(--ink);
  font-size: 0.94rem;
}

.search-input {
  min-height: 48px;
}

.admin-orders-list {
  display: flex;
  flex-direction: column;
  gap: 1.35rem;
}

.admin-order-card {
  background: var(--paper);
  border: 2px solid var(--rule);
}

.ord-top {
  padding: 0.85rem 1.25rem;
  background: var(--paper-2);
  border-bottom: 1.5px solid var(--rule-soft);
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.ord-top-left,
.ord-top-right {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
}

.ord-number {
  font-size: 1.05rem;
  font-weight: 850;
}

.ord-date {
  font-size: 0.85rem;
  color: var(--ink-2);
}

.ord-email {
  padding: 0.15rem 0.55rem;
  background: var(--paper);
  border: 1px solid var(--rule-soft);
  font-size: 0.82rem;
  font-weight: 700;
}

.ord-total {
  font-weight: 850;
  font-size: 1.05rem;
}

.preview-link {
  font-size: 0.86rem;
  font-weight: 750;
  color: var(--link);
  text-decoration: underline;
}

.del-btn {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  color: var(--ink-3);
}

.del-btn:hover {
  color: var(--danger);
}

.ord-grid {
  display: grid;
  grid-template-columns: 1fr 1.15fr;
}

.ord-info-col {
  padding: 1.25rem;
  border-right: 1.5px solid var(--rule-soft);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1.25rem;
}

.block-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.block-label {
  font-size: 0.74rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ink-3);
  font-weight: 800;
}

.print-items {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.print-item {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  font-size: 0.95rem;
}

.qty-badge {
  padding: 0.1rem 0.45rem;
  background: var(--ink);
  color: var(--paper);
  font-weight: 850;
  font-size: 0.8rem;
}

.sku-inline {
  margin-left: 0.5rem;
  font-size: 0.78rem;
  color: var(--ink-3);
}

.copy-addr-btn {
  font-size: 0.8rem;
  font-weight: 750;
  color: var(--link);
  text-decoration: underline;
}

.addr-text {
  font-size: 0.92rem;
  line-height: 1.45;
  color: var(--ink-2);
}

.ord-control-col {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.control-row-2 {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 0.85rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.field-label {
  font-size: 0.8rem;
  font-weight: 750;
}

.select-status {
  font-weight: 750;
}

.control-foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  margin-top: 0.25rem;
}

.save-btn {
  min-height: 44px;
  padding: 0.65rem 1.25rem;
  font-size: 0.92rem;
}

.saved-pill {
  font-size: 0.88rem;
  font-weight: 800;
  color: var(--color-success);
}

.empty-state {
  border: 2px solid var(--rule);
  background: var(--paper);
  padding: 2.5rem;
  font-weight: 700;
}

@media (max-width: 900px) {
  .ord-grid,
  .form-grid-3,
  .control-row-2 {
    grid-template-columns: 1fr;
  }

  .ord-info-col {
    border-right: none;
    border-bottom: 1.5px solid var(--rule-soft);
  }
}
</style>


<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const orders = ref<any[]>([])
const isLoading = ref(true)
const hasError = ref(false)
const searchQuery = ref('')
const statusFilter = ref('all')

const SCRIPT_ID = 'AKfycbwehSYdNkby0CX1oFUw7P3_7MmEctZw7CsxRVakYpM13HN4m8P0YwrZvMsCpChX3u-y-w'
const API_URL = `https://script.google.com/macros/s/${SCRIPT_ID}/exec`
const API_TOKEN = 'BrandiLab_Admin_99xK2pL5_2026!'

// Parse DD/MM/YYYY into a sortable timestamp
function parseDate(dateStr: string): number {
  if (!dateStr) return 0
  const parts = dateStr.split('/')
  if (parts.length === 3) {
    const [day, month, year] = parts.map(Number)
    return new Date(year, month - 1, day).getTime()
  }
  // Fallback: let Date try to parse it
  const t = new Date(dateStr).getTime()
  return isNaN(t) ? 0 : t
}

onMounted(async () => {
  try {
    const response = await fetch(`${API_URL}?token=${API_TOKEN}`)
    const data = await response.json()
    orders.value = data.sort((a: any, b: any) => {
      return parseDate(b['Data']) - parseDate(a['Data'])
    })
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    hasError.value = true
  } finally {
    isLoading.value = false
  }
})

// Stats
const totalOrders = computed(() => orders.value.length)
const shippedOrders = computed(() => orders.value.filter(o => o['Stato'] === 'Spedito').length)
const pendingOrders = computed(() => totalOrders.value - shippedOrders.value)
const platforms = computed(() => {
  const map = new Map<string, number>()
  for (const o of orders.value) {
    const p = o['Piattaforma'] || 'Unknown'
    map.set(p, (map.get(p) ?? 0) + 1)
  }
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
})

// Filtered orders
const filteredOrders = computed(() => {
  let result = orders.value

  if (statusFilter.value === 'shipped') {
    result = result.filter(o => o['Stato'] === 'Spedito')
  } else if (statusFilter.value === 'pending') {
    result = result.filter(o => o['Stato'] !== 'Spedito')
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(o =>
      (o['Prodotto'] || '').toLowerCase().includes(q) ||
      (o['Username Vinted'] || '').toLowerCase().includes(q) ||
      (o['Piattaforma'] || '').toLowerCase().includes(q)
    )
  }

  return result
})

const markAsShipped = async (order: any) => {
  order.isUpdating = true
  try {
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({
        token: API_TOKEN,
        action: 'markShipped',
        date: order['Data'],
        username: order['Username Vinted'],
      }),
    })
    order['Stato'] = 'Spedito'
  } catch (error) {
    console.error('Error updating order:', error)
    alert('Failed to update the order.')
  } finally {
    order.isUpdating = false
  }
}

function logout() {
  localStorage.removeItem('adminAuth')
  router.push('/')
}
</script>

<template>
  <main class="admin-page">
    <div class="admin-container">

      <!-- Header -->
      <header class="admin-header">
        <div class="header-left">
          <div class="header-badge">Admin</div>
          <div>
            <h1 class="header-title">Order Management</h1>
            <p class="header-sub">BrandiLab — Dashboard</p>
          </div>
        </div>
        <button class="btn-logout" @click="logout" title="Logout">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>Logout</span>
          <span class="logout-text">Logout</span>
        </button>
      </header>

      <!-- Loading State -->
      <div v-if="isLoading" class="state-card">
        <div class="spinner" />
        <p>Loading orders…</p>
      </div>

      <!-- Error State -->
      <div v-else-if="hasError" class="state-card state-error">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <p>Failed to load orders. Check your connection and reload.</p>
      </div>

      <template v-else>

        <!-- Stats Row -->
        <section class="stats-row">
          <div class="stat-card">
            <div class="stat-icon stat-icon--total">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
              </svg>
            </div>
            <div class="stat-body">
              <span class="stat-number">{{ totalOrders }}</span>
              <span class="stat-label">Total Orders</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon stat-icon--pending">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div class="stat-body">
              <span class="stat-number">{{ pendingOrders }}</span>
              <span class="stat-label">Pending</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon stat-icon--shipped">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div class="stat-body">
              <span class="stat-number">{{ shippedOrders }}</span>
              <span class="stat-label">Shipped</span>
            </div>
          </div>

          <div class="stat-card" v-for="[platform, count] in platforms.slice(0, 1)" :key="platform">
            <div class="stat-icon stat-icon--platform">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
              </svg>
            </div>
            <div class="stat-body">
              <span class="stat-number">{{ count }}</span>
              <span class="stat-label">{{ platform }}</span>
            </div>
          </div>
        </section>

        <!-- Toolbar -->
        <section class="toolbar">
          <div class="search-box">
            <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by product, buyer or platform…"
              placeholder="Search product, buyer, platform…"
              class="search-input"
            />
          </div>
          <div class="filter-tabs">
            <button
              class="filter-tab"
              :class="{ active: statusFilter === 'all' }"
              @click="statusFilter = 'all'"
            >
              All <span class="tab-count">{{ totalOrders }}</span>
            </button>
            <button
              class="filter-tab"
              :class="{ active: statusFilter === 'pending' }"
              @click="statusFilter = 'pending'"
            >
              Pending <span class="tab-count">{{ pendingOrders }}</span>
            </button>
            <button
              class="filter-tab"
              :class="{ active: statusFilter === 'shipped' }"
              @click="statusFilter = 'shipped'"
            >
              Shipped <span class="tab-count">{{ shippedOrders }}</span>
            </button>
          </div>
        </section>

        <!-- Orders Table -->
        <section class="table-panel">
        <!-- Desktop: Orders Table -->
        <section class="table-panel desktop-only">
          <div class="table-wrapper">
            <table class="orders-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Platform</th>
                  <th>Product</th>
                  <th>Buyer</th>
                  <th>Status</th>
                  <th class="th-action">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(order, index) in filteredOrders"
                  :key="index"
                  :key="'t-' + index"
                  :class="{ 'row-shipped': order['Stato'] === 'Spedito' }"
                >
                  <td class="cell-date">{{ order['Data'] }}</td>
                  <td>
                    <span class="platform-tag">{{ order['Piattaforma'] }}</span>
                  </td>
                  <td class="cell-product">{{ order['Prodotto'] }}</td>
                  <td class="cell-buyer">{{ order['Username Vinted'] }}</td>
                  <td>
                    <span
                      class="status-pill"
                      :class="order['Stato'] === 'Spedito' ? 'status-shipped' : 'status-pending'"
                    >
                      <span class="status-dot" />
                      {{ order['Stato'] || 'Da spedire' }}
                    </span>
                  </td>
                  <td>
                    <button
                      class="action-btn"
                      :class="{
                        'action-done': order['Stato'] === 'Spedito',
                        'action-loading': order.isUpdating,
                      }"
                      :disabled="order['Stato'] === 'Spedito' || order.isUpdating"
                      @click="markAsShipped(order)"
                    >
                      <template v-if="order.isUpdating">
                        <span class="btn-spinner" />
                        Updating…
                      </template>
                      <template v-else-if="order['Stato'] === 'Spedito'">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        Done
                      </template>
                      <template v-else>
                        Mark Shipped
                      </template>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

          <!-- Empty State -->
          <div v-if="filteredOrders.length === 0" class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" stroke-width="1.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <p>No orders match your filters.</p>
        <!-- Mobile: Order Cards -->
        <section class="cards-list mobile-only">
          <div
            v-for="(order, index) in filteredOrders"
            :key="'c-' + index"
            class="order-card"
            :class="{ 'card-shipped': order['Stato'] === 'Spedito' }"
          >
            <!-- Card Header -->
            <div class="card-header">
              <div class="card-header-left">
                <span class="card-product">{{ order['Prodotto'] }}</span>
                <span class="card-date">{{ order['Data'] }}</span>
              </div>
              <span
                class="status-pill"
                :class="order['Stato'] === 'Spedito' ? 'status-shipped' : 'status-pending'"
              >
                <span class="status-dot" />
                {{ order['Stato'] || 'Da spedire' }}
              </span>
            </div>

            <!-- Card Body -->
            <div class="card-details">
              <div class="card-detail">
                <span class="card-label">Platform</span>
                <span class="platform-tag">{{ order['Piattaforma'] }}</span>
              </div>
              <div class="card-detail">
                <span class="card-label">Buyer</span>
                <span class="card-value">{{ order['Username Vinted'] }}</span>
              </div>
              <div class="card-detail" v-if="order['Prezzo']">
                <span class="card-label">Price</span>
                <span class="card-value card-price">{{ order['Prezzo'] }}</span>
              </div>
            </div>

            <!-- Card Action -->
            <button
              class="action-btn card-action-btn"
              :class="{
                'action-done': order['Stato'] === 'Spedito',
                'action-loading': order.isUpdating,
              }"
              :disabled="order['Stato'] === 'Spedito' || order.isUpdating"
              @click="markAsShipped(order)"
            >
              <template v-if="order.isUpdating">
                <span class="btn-spinner" />
                Updating…
              </template>
              <template v-else-if="order['Stato'] === 'Spedito'">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Completed
              </template>
              <template v-else>
                Mark as Shipped ✓
              </template>
            </button>
          </div>
        </section>

        <!-- Empty State (shared) -->
        <div v-if="filteredOrders.length === 0" class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <p>No orders match your filters.</p>
        </div>

        <!-- Footer -->
        <footer class="admin-footer">
          <p>Showing {{ filteredOrders.length }} of {{ totalOrders }} orders</p>
        </footer>
      </template>
    </div>
  </main>
</template>

<style scoped>
/* ===== Layout ===== */
.admin-page {
  min-height: calc(100vh - var(--navbar-height));
  background: var(--color-bg);
  padding: 2rem 1rem 4rem;
}

.admin-container {
  max-width: 1100px;
  margin: 0 auto;
}

/* ===== Visibility toggles ===== */
.mobile-only {
  display: none;
}

/* ===== Header ===== */
.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.header-title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-primary);
  line-height: 1.2;
}

.header-sub {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-top: 2px;
}

.btn-logout {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1.1rem;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-light);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: 500;
  transition: var(--transition);
}

.btn-logout:hover {
  border-color: var(--color-danger);
  color: var(--color-danger);
  background: #fdf0ef;
}

/* ===== Loading / Error ===== */
.state-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 5rem 2rem;
  background: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  color: var(--color-text-light);
  font-size: var(--font-size-base);
}

.state-error p {
  color: var(--color-danger);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ===== Stats ===== */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  background: var(--color-surface);
  padding: 1.25rem 1.2rem;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: var(--transition);
}

.stat-card:hover {
  box-shadow: var(--shadow-md);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.stat-icon--total {
  background: rgba(26, 26, 46, 0.08);
  color: var(--color-primary);
}

.stat-icon--pending {
  background: #fff3e0;
  color: #e67e22;
}

.stat-icon--shipped {
  background: rgba(39, 174, 96, 0.1);
  color: var(--color-success);
}

.stat-icon--platform {
  background: var(--color-accent-light);
  color: var(--color-accent);
}

.stat-body {
  display: flex;
  flex-direction: column;
}

.stat-number {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-top: 2px;
}

/* ===== Toolbar ===== */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 220px;
  max-width: 380px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.6rem 0.75rem 0.6rem 2.4rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: var(--font-size-sm);
  transition: var(--transition-fast);
  outline: none;
}

.search-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-light);
}

.search-input::placeholder {
  color: var(--color-text-muted);
}

.filter-tabs {
  display: flex;
  gap: 4px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 3px;
}

.filter-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.9rem;
  border-radius: 4px;
  background: transparent;
  color: var(--color-text-light);
  font-size: var(--font-size-sm);
  font-weight: 500;
  transition: var(--transition-fast);
}

.filter-tab:hover {
  color: var(--color-text);
}

.filter-tab.active {
  background: var(--color-primary);
  color: white;
}

.filter-tab.active .tab-count {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.tab-count {
  font-size: 0.7rem;
  font-weight: 600;
  background: var(--color-bg);
  color: var(--color-text-light);
  padding: 1px 6px;
  border-radius: var(--radius-full);
  line-height: 1.5;
}

/* ===== Table ===== */
/* ===== Desktop Table ===== */
.table-panel {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.table-wrapper {
  overflow-x: auto;
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
}

.orders-table th {
  text-align: left;
  padding: 0.85rem 1rem;
  font-size: var(--font-size-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}

.th-action {
  text-align: center;
}

.orders-table td {
  padding: 0.85rem 1rem;
  font-size: var(--font-size-sm);
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border-light);
  vertical-align: middle;
}

.orders-table tbody tr {
  transition: var(--transition-fast);
}

.orders-table tbody tr:hover {
  background: var(--color-bg);
}

.orders-table tbody tr:last-child td {
  border-bottom: none;
}

.row-shipped {
  opacity: 0.55;
}

.row-shipped:hover {
  opacity: 0.75;
}

.cell-date {
  white-space: nowrap;
  color: var(--color-text-light);
  font-variant-numeric: tabular-nums;
}

.cell-product {
  font-weight: 500;
  color: var(--color-primary);
}

.cell-buyer {
  color: var(--color-text-light);
}

.platform-tag {
  display: inline-block;
  padding: 3px 10px;
  background: var(--color-bg);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--color-text-light);
  white-space: nowrap;
}

/* Status */
/* ===== Status Pill (shared desktop + mobile) ===== */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
  white-space: nowrap;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.status-pending {
  background: #fff3e0;
  color: #bf6c00;
}

.status-pending .status-dot {
  background: #e67e22;
}

.status-shipped {
  background: rgba(39, 174, 96, 0.1);
  color: #1e8449;
}

.status-shipped .status-dot {
  background: var(--color-success);
}

/* Action Button */
/* ===== Action Button (shared) ===== */
.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.4rem 1rem;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
  background: var(--color-accent);
  color: white;
  transition: var(--transition-fast);
  white-space: nowrap;
}

.action-btn:hover:not(:disabled) {
  background: var(--color-accent-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.action-btn:disabled {
  cursor: default;
}

.action-done {
  background: var(--color-bg);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border-light);
}

.action-loading {
  background: var(--color-bg);
  color: var(--color-text-light);
}

.btn-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

/* Empty */
/* ===== Mobile Order Cards ===== */
.cards-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.order-card {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  padding: 1rem 1.1rem;
  transition: var(--transition-fast);
}

.card-shipped {
  opacity: 0.55;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.card-header-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.card-product {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-primary);
  line-height: 1.3;
  word-break: break-word;
}

.card-date {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

.card-details {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  margin-bottom: 0.85rem;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid var(--color-border-light);
}

.card-detail {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.card-label {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
}

.card-value {
  font-size: var(--font-size-sm);
  color: var(--color-text);
}

.card-price {
  font-weight: 600;
  color: var(--color-primary);
}

.card-action-btn {
  width: 100%;
  padding: 0.65rem 1rem;
  font-size: var(--font-size-sm);
  border-radius: var(--radius-sm);
}

/* ===== Empty ===== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3.5rem 2rem;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

/* Footer */
/* ===== Footer ===== */
.admin-footer {
  text-align: center;
  padding: 1.25rem 0 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

/* ===== Responsive ===== */
@media (max-width: 900px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
@media (max-width: 680px) {
  /* Switch from table to cards */
  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: flex;
  }

  .admin-page {
    padding: 1.25rem 0.75rem 3rem;
    padding: 1rem 0.75rem 3rem;
  }

  .admin-header {
    margin-bottom: 1.25rem;
  }

  .header-badge {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-sm);
    font-size: 0.6rem;
  }

  .header-title {
    font-size: var(--font-size-lg);
  }

  .header-sub {
    font-size: var(--font-size-xs);
  }

  .btn-logout {
    padding: 0.5rem;
    border-radius: var(--radius-sm);
  }

  .logout-text {
    display: none;
  }

  /* Stats: compact 2x2 */
  .stats-row {
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    gap: 0.6rem;
    margin-bottom: 1rem;
  }

  .stat-card {
    padding: 1rem;
    padding: 0.85rem;
    gap: 0.65rem;
  }

  .stat-icon {
    width: 36px;
    height: 36px;
  }

  .stat-icon svg {
    width: 18px;
    height: 18px;
  }

  .stat-number {
    font-size: var(--font-size-lg);
  }

  /* Toolbar: stack vertically */
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 0.6rem;
    margin-bottom: 0.75rem;
  }

  .search-box {
    max-width: 100%;
    min-width: 0;
  }

  .search-input {
    padding: 0.7rem 0.75rem 0.7rem 2.4rem;
    font-size: var(--font-size-base);
  }

  .filter-tabs {
    justify-content: stretch;
  }

  .filter-tab {
    flex: 1;
    justify-content: center;
    padding: 0.5rem 0.4rem;
    font-size: var(--font-size-xs);
  }
}

  .orders-table th,
  .orders-table td {
    padding: 0.7rem 0.65rem;
@media (max-width: 380px) {
  .stats-row {
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }

  .header-badge {
    display: none;
  .stat-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.4rem;
    padding: 0.75rem;
  }

  .stat-icon {
    width: 30px;
    height: 30px;
  }

  .stat-icon svg {
    width: 16px;
    height: 16px;
  }
}
</style>

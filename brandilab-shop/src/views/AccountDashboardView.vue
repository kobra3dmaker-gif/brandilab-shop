<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import { useOrders } from '@/composables/useOrders'
import OrderCard from '@/components/OrderCard.vue'

type DashboardTab = 'orders' | 'addresses' | 'security'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const {
  user,
  addresses,
  fullName,
  initials,
  logout,
  fetchProfile,
  updateProfile,
  addAddress,
  setDefaultAddress,
  deleteAddress,
} = useAuth()
const { orders, loading: ordersLoading, fetchMyOrders } = useOrders()

const activeTab = ref<DashboardTab>(
  (route.query.tab as DashboardTab) || 'orders',
)

// Orders filtering state
const searchQuery = ref('')
const statusFilter = ref<'all' | 'active' | 'delivered' | 'cancelled'>('all')
const periodFilter = ref<'all' | 'last3months' | '2026' | '2025'>('all')

// Address modal / form state
const showAddressForm = ref(false)
const addrForm = ref({
  label: 'Casa',
  recipientName: '',
  line1: '',
  line2: '',
  city: '',
  postalCode: '',
  province: '',
  country: 'IT',
  phone: '',
  isDefault: true,
})

// Profile & Security form state
const profileFirstName = ref(user.value?.firstName || '')
const profileLastName = ref(user.value?.lastName || '')
const profilePhone = ref(user.value?.phone || '')
const currentPassword = ref('')
const newPassword = ref('')
const profileSaved = ref(false)
const profileError = ref('')

onMounted(async () => {
  await fetchProfile()
  if (user.value) {
    profileFirstName.value = user.value.firstName
    profileLastName.value = user.value.lastName
    profilePhone.value = user.value.phone
    addrForm.value.recipientName = `${user.value.firstName} ${user.value.lastName}`.trim()
    addrForm.value.phone = user.value.phone
  }
  await fetchMyOrders()
})

const filteredOrders = computed(() => {
  let list = [...orders.value]

  if (statusFilter.value === 'active') {
    list = list.filter((o) =>
      ['RICEVUTO', 'IN_LAVORAZIONE', 'SPEDITO', 'IN_CONSEGNA', 'PROBLEMA_CONSEGNA'].includes(o.status),
    )
  } else if (statusFilter.value === 'delivered') {
    list = list.filter((o) => o.status === 'CONSEGNATO')
  } else if (statusFilter.value === 'cancelled') {
    list = list.filter((o) => o.status === 'ANNULLATO')
  }

  if (periodFilter.value === 'last3months') {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    list = list.filter((o) => o.createdAt >= cutoff)
  } else if (periodFilter.value === '2026' || periodFilter.value === '2025') {
    list = list.filter((o) => o.createdAt.startsWith(periodFilter.value))
  }

  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        (o.trackingNumber && o.trackingNumber.toLowerCase().includes(q)) ||
        o.items.some(
          (item) =>
            item.title.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q),
        ),
    )
  }

  return list
})

async function handleSaveAddress() {
  if (!addrForm.value.recipientName || !addrForm.value.line1 || !addrForm.value.city || !addrForm.value.postalCode) {
    return
  }
  const res = await addAddress({ ...addrForm.value })
  if (res.ok) {
    showAddressForm.value = false
    addrForm.value.line1 = ''
    addrForm.value.line2 = ''
    addrForm.value.city = ''
    addrForm.value.postalCode = ''
    addrForm.value.province = ''
  }
}

async function handleSaveProfile() {
  profileSaved.value = false
  profileError.value = ''
  const res = await updateProfile({
    firstName: profileFirstName.value,
    lastName: profileLastName.value,
    phone: profilePhone.value,
    ...(newPassword.value
      ? { currentPassword: currentPassword.value, newPassword: newPassword.value }
      : {}),
  })
  if (res.ok) {
    profileSaved.value = true
    currentPassword.value = ''
    newPassword.value = ''
  } else {
    profileError.value = res.error || 'Errore salvataggio'
  }
}

async function handleLogout() {
  await logout()
  router.push('/login')
}
</script>

<template>
  <main class="portal-page">
    <!-- Top Account Hero Bar -->
    <section class="portal-hero">
      <div class="container hero-row">
        <div class="user-identity">
          <div class="avatar" aria-hidden="true">{{ initials }}</div>
          <div>
            <div class="welcome-row">
              <p class="welcome">{{ t('portal.dashboard.welcome', { name: fullName }) }}</p>
              <span v-if="user?.isDemo" class="demo-chip">{{ t('portal.dashboard.demoBadge') }}</span>
            </div>
            <h1 class="hero-title display">{{ t('portal.dashboard.title') }}</h1>
          </div>
        </div>

        <button type="button" class="btn btn-line logout-btn" @click="handleLogout">
          {{ t('portal.dashboard.logout') }}
        </button>
      </div>

      <!-- Navigation Tabs -->
      <div class="container">
        <nav class="portal-tabs" aria-label="Sezioni account">
          <button
            type="button"
            class="tab-btn"
            :class="{ 'is-active': activeTab === 'orders' }"
            @click="activeTab = 'orders'"
          >
            {{ t('portal.dashboard.tabs.orders') }}
            <span class="tab-badge tabular">{{ orders.length }}</span>
          </button>

          <button
            type="button"
            class="tab-btn"
            :class="{ 'is-active': activeTab === 'addresses' }"
            @click="activeTab = 'addresses'"
          >
            {{ t('portal.dashboard.tabs.addresses') }}
            <span class="tab-badge tabular">{{ addresses.length }}</span>
          </button>

          <button
            type="button"
            class="tab-btn"
            :class="{ 'is-active': activeTab === 'security' }"
            @click="activeTab = 'security'"
          >
            {{ t('portal.dashboard.tabs.security') }}
          </button>
        </nav>
      </div>
    </section>

    <div class="container portal-body">
      <!-- ==================== TAB 1: I MIEI ORDINI ==================== -->
      <section v-if="activeTab === 'orders'" class="orders-section">
        <!-- Amazon-style Search & Filter Toolbar -->
        <div class="orders-toolbar">
          <div class="search-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
              <circle cx="11" cy="11" r="7.5" />
              <path d="M20 20l-3.8-3.8" />
            </svg>
            <input
              v-model="searchQuery"
              type="search"
              :placeholder="t('portal.dashboard.searchPlaceholder')"
              class="search-input"
            />
          </div>

          <select v-model="periodFilter" class="period-select" aria-label="Periodo ordini">
            <option value="all">{{ t('portal.dashboard.filterPeriod.all') }}</option>
            <option value="last3months">{{ t('portal.dashboard.filterPeriod.last3months') }}</option>
            <option value="2026">{{ t('portal.dashboard.filterPeriod.y2026') }}</option>
            <option value="2025">{{ t('portal.dashboard.filterPeriod.y2025') }}</option>
          </select>
        </div>

        <!-- Status Filter Pills -->
        <div class="status-pills" role="group">
          <button
            type="button"
            class="filter-pill"
            :class="{ 'is-on': statusFilter === 'all' }"
            @click="statusFilter = 'all'"
          >
            {{ t('portal.dashboard.filterStatus.all') }}
          </button>
          <button
            type="button"
            class="filter-pill"
            :class="{ 'is-on': statusFilter === 'active' }"
            @click="statusFilter = 'active'"
          >
            {{ t('portal.dashboard.filterStatus.active') }}
          </button>
          <button
            type="button"
            class="filter-pill"
            :class="{ 'is-on': statusFilter === 'delivered' }"
            @click="statusFilter = 'delivered'"
          >
            {{ t('portal.dashboard.filterStatus.delivered') }}
          </button>
          <button
            type="button"
            class="filter-pill"
            :class="{ 'is-on': statusFilter === 'cancelled' }"
            @click="statusFilter = 'cancelled'"
          >
            {{ t('portal.dashboard.filterStatus.cancelled') }}
          </button>
        </div>

        <!-- Orders List -->
        <div v-if="ordersLoading" class="empty-box">
          <p>Caricamento ordini…</p>
        </div>

        <div v-else-if="filteredOrders.length === 0" class="empty-box">
          <p>{{ t('portal.dashboard.emptyOrders') }}</p>
          <RouterLink :to="{ path: '/', hash: '#catalogo' }" class="btn btn-ink">
            {{ t('portal.dashboard.emptyOrdersCta') }}
          </RouterLink>
        </div>

        <div v-else class="orders-stack">
          <OrderCard v-for="ord in filteredOrders" :key="ord.id" :order="ord" />
        </div>
      </section>

      <!-- ==================== TAB 2: INDIRIZZI DI SPEDIZIONE ==================== -->
      <section v-else-if="activeTab === 'addresses'" class="addresses-section">
        <div class="section-head">
          <div>
            <h2 class="section-title">{{ t('portal.addresses.title') }}</h2>
            <p class="section-note">{{ t('portal.addresses.immutabilityNote') }}</p>
          </div>
          <button
            v-if="!showAddressForm"
            type="button"
            class="btn btn-blue"
            @click="showAddressForm = true"
          >
            + {{ t('portal.addresses.addNew') }}
          </button>
        </div>

        <!-- Add New Address Form -->
        <form v-if="showAddressForm" class="address-form" @submit.prevent="handleSaveAddress">
          <div class="form-grid">
            <label class="field">
              <span class="field-label">{{ t('portal.addresses.labelField') }}</span>
              <input v-model="addrForm.label" type="text" required class="input" />
            </label>
            <label class="field">
              <span class="field-label">{{ t('portal.addresses.recipientField') }} *</span>
              <input v-model="addrForm.recipientName" type="text" required class="input" />
            </label>
            <label class="field span-2">
              <span class="field-label">{{ t('portal.addresses.line1Field') }} *</span>
              <input v-model="addrForm.line1" type="text" required class="input" />
            </label>
            <label class="field span-2">
              <span class="field-label">{{ t('portal.addresses.line2Field') }}</span>
              <input v-model="addrForm.line2" type="text" class="input" />
            </label>
            <label class="field">
              <span class="field-label">{{ t('portal.addresses.cityField') }} *</span>
              <input v-model="addrForm.city" type="text" required class="input" />
            </label>
            <label class="field">
              <span class="field-label">{{ t('portal.addresses.postalCodeField') }} *</span>
              <input v-model="addrForm.postalCode" type="text" required class="input" />
            </label>
            <label class="field">
              <span class="field-label">{{ t('portal.addresses.provinceField') }}</span>
              <input v-model="addrForm.province" type="text" maxlength="4" class="input" />
            </label>
            <label class="field">
              <span class="field-label">{{ t('portal.auth.phone') }}</span>
              <input v-model="addrForm.phone" type="tel" class="input" />
            </label>
          </div>

          <label class="checkbox-row">
            <input v-model="addrForm.isDefault" type="checkbox" />
            <span>{{ t('portal.addresses.makeDefaultField') }}</span>
          </label>

          <div class="form-actions">
            <button type="submit" class="btn btn-blue">{{ t('portal.addresses.saveBtn') }}</button>
            <button type="button" class="btn btn-line" @click="showAddressForm = false">
              {{ t('portal.addresses.cancelBtn') }}
            </button>
          </div>
        </form>

        <!-- Address Cards Grid -->
        <div class="address-grid">
          <article v-for="addr in addresses" :key="addr.id" class="addr-card">
            <div class="addr-top">
              <span class="addr-label">{{ addr.label }}</span>
              <span v-if="addr.isDefault" class="default-tag">
                {{ t('portal.addresses.defaultBadge') }}
              </span>
            </div>
            <div class="addr-body">
              <strong>{{ addr.recipientName }}</strong>
              <span>{{ addr.line1 }}</span>
              <span v-if="addr.line2">{{ addr.line2 }}</span>
              <span>{{ addr.postalCode }} {{ addr.city }} ({{ addr.province }}) — {{ addr.country }}</span>
              <span v-if="addr.phone" class="addr-phone">{{ addr.phone }}</span>
            </div>
            <div class="addr-actions">
              <button
                v-if="!addr.isDefault"
                type="button"
                class="text-link"
                @click="setDefaultAddress(addr.id)"
              >
                {{ t('portal.addresses.setDefault') }}
              </button>
              <button type="button" class="text-link danger-link" @click="deleteAddress(addr.id)">
                {{ t('portal.addresses.delete') }}
              </button>
            </div>
          </article>
        </div>
      </section>

      <!-- ==================== TAB 3: ACCESSO E SICUREZZA ==================== -->
      <section v-else class="security-section">
        <form class="security-card" @submit.prevent="handleSaveProfile">
          <h2 class="section-title">{{ t('portal.security.title') }}</h2>

          <div class="form-grid">
            <label class="field">
              <span class="field-label">{{ t('portal.auth.firstName') }}</span>
              <input v-model="profileFirstName" type="text" required class="input" />
            </label>
            <label class="field">
              <span class="field-label">{{ t('portal.auth.lastName') }}</span>
              <input v-model="profileLastName" type="text" required class="input" />
            </label>
            <label class="field">
              <span class="field-label">{{ t('portal.auth.email') }}</span>
              <input :value="user?.email" type="email" disabled class="input input-disabled" />
            </label>
            <label class="field">
              <span class="field-label">{{ t('portal.auth.phone') }}</span>
              <input v-model="profilePhone" type="tel" class="input" />
            </label>
          </div>

          <hr class="divider" />

          <h3 class="sub-heading">{{ t('portal.security.passwordSection') }}</h3>
          <div class="form-grid">
            <label class="field">
              <span class="field-label">{{ t('portal.security.currentPassword') }}</span>
              <input v-model="currentPassword" type="password" autocomplete="current-password" class="input" />
            </label>
            <label class="field">
              <span class="field-label">{{ t('portal.security.newPassword') }}</span>
              <input v-model="newPassword" type="password" autocomplete="new-password" class="input" />
            </label>
          </div>

          <p v-if="profileSaved" class="saved-banner">{{ t('portal.security.savedSuccess') }}</p>
          <p v-if="profileError" class="error-banner">{{ profileError }}</p>

          <button type="submit" class="btn btn-blue">
            {{ t('portal.security.saveProfile') }}
          </button>
        </form>
      </section>
    </div>
  </main>
</template>

<style scoped>
.portal-hero {
  background: var(--paper-2);
  border-bottom: 2px solid var(--rule);
  padding-top: clamp(2rem, 5vw, 3.5rem);
}

.hero-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  padding-bottom: 1.75rem;
}

.user-identity {
  display: flex;
  align-items: center;
  gap: 1.15rem;
}

.avatar {
  width: 60px;
  height: 60px;
  background: var(--ink);
  color: var(--paper);
  display: grid;
  place-items: center;
  font-stretch: var(--wide);
  font-weight: 850;
  font-size: 1.35rem;
}

.welcome-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
}

.welcome {
  font-weight: 700;
  color: var(--ink-2);
}

.demo-chip {
  padding: 0.15rem 0.55rem;
  background: var(--blue);
  color: var(--on-blue);
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.hero-title {
  font-size: clamp(2.1rem, 4.5vw, 3.25rem);
  margin-top: 0.15rem;
}

.portal-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.tab-btn {
  padding: 0.85rem 1.35rem;
  font-weight: 800;
  font-size: 0.95rem;
  color: var(--ink-2);
  border-bottom: 3px solid transparent;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition:
    color 0.15s ease,
    border-color 0.15s ease;
}

.tab-btn.is-active {
  color: var(--ink);
  border-bottom-color: var(--blue);
  background: var(--paper);
}

.tab-badge {
  padding: 0.1rem 0.45rem;
  background: var(--paper-2);
  border: 1px solid var(--rule-soft);
  font-size: 0.78rem;
}

.portal-body {
  padding-top: 2rem;
  padding-bottom: clamp(4rem, 7vw, 6rem);
}

/* Orders Toolbar */
.orders-toolbar {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1rem;
  margin-bottom: 1rem;
}

.search-wrap {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0 0.9rem;
  border: 2px solid var(--ink);
  background: var(--paper);
}

.search-input {
  width: 100%;
  min-height: 46px;
  border: none;
  background: transparent;
  outline: none;
}

.period-select {
  min-height: 50px;
  padding: 0 1rem;
  border: 2px solid var(--ink);
  background: var(--paper);
  font-weight: 700;
}

.status-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.75rem;
}

.filter-pill {
  padding: 0.5rem 1rem;
  border: 1.5px solid var(--rule-soft);
  font-size: 0.88rem;
  font-weight: 750;
  color: var(--ink-2);
}

.filter-pill.is-on {
  background: var(--ink);
  color: var(--paper);
  border-color: var(--ink);
}

.orders-stack {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.empty-box {
  border: 2px solid var(--rule);
  padding: 2.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
  font-weight: 700;
}

/* Addresses Section */
.section-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.section-title {
  font-stretch: var(--semi-wide);
  font-weight: 850;
  font-size: 1.5rem;
}

.section-note {
  margin-top: 0.35rem;
  max-width: 65ch;
  color: var(--ink-2);
  font-size: 0.92rem;
}

.address-form,
.security-card {
  border: 2px solid var(--rule);
  background: var(--paper);
  padding: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.span-2 {
  grid-column: 1 / -1;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field-label {
  font-size: 0.85rem;
  font-weight: 750;
}

.input {
  min-height: 44px;
  padding: 0.6rem 0.8rem;
  border: 2px solid var(--ink);
  background: var(--paper);
}

.input-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.checkbox-row {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  font-weight: 700;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
}

.address-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.25rem;
}

.addr-card {
  border: 2px solid var(--rule);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1rem;
}

.addr-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.addr-label {
  font-weight: 850;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ink-2);
}

.default-tag {
  padding: 0.15rem 0.5rem;
  background: var(--ink);
  color: var(--paper);
  font-size: 0.72rem;
  font-weight: 800;
}

.addr-body {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.94rem;
}

.addr-phone {
  margin-top: 0.3rem;
  color: var(--ink-2);
  font-size: 0.85rem;
}

.addr-actions {
  display: flex;
  gap: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--rule-soft);
}

.text-link {
  font-size: 0.86rem;
  font-weight: 750;
  color: var(--link);
  text-decoration: underline;
}

.danger-link {
  color: var(--danger);
}

.divider {
  border: none;
  border-top: 1px solid var(--rule-soft);
}

.sub-heading {
  font-weight: 800;
  font-size: 1.1rem;
}

.saved-banner {
  padding: 0.75rem 1rem;
  border: 1.5px solid var(--color-success);
  color: var(--color-success);
  font-weight: 750;
}

.error-banner {
  padding: 0.75rem 1rem;
  border: 1.5px solid var(--danger);
  color: var(--danger);
  font-weight: 750;
}

@media (max-width: 720px) {
  .orders-toolbar,
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>


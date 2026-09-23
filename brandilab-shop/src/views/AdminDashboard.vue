<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

interface Order {
  [key: string]: any
}

const router = useRouter()

const orders = ref<Order[]>([])
const isLoading = ref(true)
const hasError = ref(false)
const searchQuery = ref('')
const statusFilter = ref('all')

const SCRIPT_ID = 'AKfycbwehSYdNkby0CX1oFUw7P3_7MmEctZw7CsxRVakYpM13HN4m8P0YwrZvMsCpChX3u-y-w'
const API_URL = `https://script.google.com/macros/s/${SCRIPT_ID}/exec`
const API_TOKEN = 'BrandiLab_Admin_99xK2pL5_2026!'

// Stato per il modale di inserimento manuale
const showAddModal = ref(false)
const newOrder = ref({
  piattaforma: 'Vinted Pro',
  prodotto: '',
  prezzo: '',
  username: '',
  indirizzo: '',
  email: '',
  assegnato: ''
})

// Modifica al volo di un campo testuale (es. Prodotto, Prezzo, Acquirente)
const editOrderField = async (order: Order, fieldName: string, event: Event) => {
  const target = event.target as HTMLInputElement;
  const newValue = target.value;
  const originalValue = order[fieldName];

  // Salviamo le chiavi originali nel caso in cui stessimo modificando proprio l'username o la data
  const oldDate = order['Data'];
  const oldUsername = order['Username Vinted'];

  order[fieldName] = newValue;
  order.isUpdating = true;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        token: API_TOKEN,
        action: 'editOrderField',
        oldDate: oldDate,
        oldUsername: oldUsername,
        field: fieldName,
        value: newValue
      })
    });
    const result = await response.json();
    if (!result.success) {
      alert("Errore di modifica: " + result.error);
      order[fieldName] = originalValue; // Ripristina in caso di errore
    }
  } catch (error) {
    console.error("Errore modifica campo:", error);
    order[fieldName] = originalValue;
  } finally {
    order.isUpdating = false;
  }
};

// Funzione per creare un ordine manuale
const submitNewOrder = async () => {
  if (!newOrder.value.prodotto || !newOrder.value.username) {
    alert("Inserisci almeno il nome del prodotto e l'username dell'acquirente.");
    return;
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        token: API_TOKEN,
        action: 'addOrder',
        ...newOrder.value
      })
    });
    const result = await response.json();
    if (result.success) {
      showAddModal.value = false;
      // Ricarica la pagina o rinfresca la lista degli ordini per vedere il nuovo inserito
      window.location.reload(); 
    } else {
      alert("Errore inserimento: " + result.error);
    }
  } catch (err) {
    console.error(err);
    alert("Impossibile comunicare con il server.");
  }
};

// Parse DD/MM/YYYY into a sortable timestamp
function parseDate(dateStr: string): number {
  if (!dateStr) return 0
  const parts = dateStr.split('/')
  if (parts.length === 3) {
    const [day, month, year] = parts.map(Number) as [number, number, number]
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
    orders.value = data.sort((a: Order, b: Order) => {
      return parseDate(String(b['Data'] ?? '')) - parseDate(String(a['Data'] ?? ''))
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
const printedOrders = computed(() => orders.value.filter(o => o['Stato'] === 'Stampato').length)
const pendingOrders = computed(() => orders.value.filter(o => o['Stato'] === 'Da Spedire').length)
const toPrintOrders = computed(() => orders.value.filter(o => !o['Stato'] || o['Stato'] === 'Da Stampare').length)
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
  } else if (statusFilter.value === 'printed') {
    result = result.filter(o => o['Stato'] === 'Stampato')
  } else if (statusFilter.value === 'pending') {
    result = result.filter(o => o['Stato'] === 'Da Spedire')
  } else if (statusFilter.value === 'toprint') {
    result = result.filter(o => !o['Stato'] || o['Stato'] === 'Da Stampare')
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(o =>
      (o['Prodotto'] || '').toLowerCase().includes(q) ||
      (o['Username Vinted'] || '').toLowerCase().includes(q) ||
      (o['Piattaforma'] || '').toLowerCase().includes(q) ||
      (o['Assegnato a'] || '').toLowerCase().includes(q)
    )
  }

  return result
})

const updateField = async (order: Order, fieldName: string, event: Event) => {
  const target = event.target as HTMLSelectElement | HTMLInputElement
  const newValue = target.value
  const originalValue = order[fieldName]

  if (newValue === originalValue) return

  const oldDate = fieldName === 'Data' ? originalValue : order['Data']
  const oldUsername = fieldName === 'Username Vinted' ? originalValue : order['Username Vinted']

  order[fieldName] = newValue
  order.isUpdating = true

  const isDropdown = fieldName === 'Stato' || fieldName === 'Assegnato a'
  const actionName = isDropdown ? 'updateField' : 'editOrderField'

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        token: API_TOKEN,
        action: actionName,
        date: oldDate,
        username: oldUsername,
        oldDate: oldDate,
        oldUsername: oldUsername,
        field: fieldName,
        value: newValue,
      }),
    })
    
    const result = await response.json()
    if (result && result.success === false) {
      alert("Errore di modifica: " + result.error)
      order[fieldName] = originalValue
    }
  } catch (error) {
    console.error(`Errore aggiornamento ${fieldName}:`, error)
    alert('Impossibile aggiornare. Riprova.')
    order[fieldName] = originalValue
  } finally {
    order.isUpdating = false
  }
}

const deleteOrder = async (order: Order) => {
  if (!confirm(`Sei sicuro di voler eliminare l'ordine di ${order['Username Vinted']}? L'azione è irreversibile.`)) {
    return
  }

  order.isDeleting = true

  try {
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({
        token: API_TOKEN,
        action: 'deleteOrder',
        date: order['Data'],
        username: order['Username Vinted'],
      }),
    })

    orders.value = orders.value.filter(o => o !== order)
  } catch (error) {
    console.error('Errore durante l\'eliminazione dell\'ordine:', error)
    alert('Impossibile eliminare l\'ordine.')
    order.isDeleting = false
  }
}

// Simula il click sull'input nascosto per aprire la finestra di scelta file
const triggerUpload = (index: number) => {
  const input = document.getElementById(`upload-${index}`) as HTMLInputElement;
  if (input) input.click();
};

const triggerUploadMobile = (index: number) => {
  const input = document.getElementById(`upload-mobile-${index}`) as HTMLInputElement;
  if (input) input.click();
};

const uploadPDF = (order: Order, event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file || file.type !== "application/pdf") {
    alert("Seleziona un file PDF valido.");
    return;
  }

  order.isUploadingPDF = true;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64Data = (e.target?.result as string).split(',')[1];
    const fileName = `Ordine_${order['Username Vinted']}_${Date.now()}.pdf`;

    try {
      // Tolto mode: 'no-cors' in modo da poter leggere il fileId o i veri messaggi di errore
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          token: API_TOKEN,
          action: 'uploadPDF',
          date: order['Data'],
          username: order['Username Vinted'],
          fileName: fileName,
          base64Data: base64Data
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        order['PDF'] = result.fileId; // Aggiorna UI istantaneamente
      } else {
        // Mostra il VERO motivo per cui Google ha rifiutato l'operazione
        alert("Errore dal server: " + result.error);
        console.error("Dettaglio errore:", result.error);
      }
      
    } catch (error) {
      console.error("Errore di rete durante la fetch:", error);
      alert("Caricamento fallito. Controlla la console.");
    } finally {
      order.isUploadingPDF = false;
      target.value = ""; // Resetta l'input
    }
  };
  
  reader.readAsDataURL(file);
};

const deletePDF = async (order: Order) => {
  if (!confirm("Rimuovere il PDF allegato?")) return;
  
  order.isDeletingPDF = true;
  try {
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({
        token: API_TOKEN,
        action: 'deletePDF',
        date: order['Data'],
        username: order['Username Vinted']
      })
    });
    order['PDF'] = ""; 
  } catch (error) {
    console.error("Errore rimozione:", error);
    alert("Rimozione fallita.");
  } finally {
    order.isDeletingPDF = false;
  }
};

// ===== Multi-select =====
const selectedOrders = ref<Set<Order>>(new Set())
const isBulkProcessing = ref(false)

const isAllSelected = computed(() => {
  return filteredOrders.value.length > 0 && filteredOrders.value.every(o => selectedOrders.value.has(o))
})

function toggleSelectAll() {
  if (isAllSelected.value) {
    // Deselect all visible
    for (const o of filteredOrders.value) {
      selectedOrders.value.delete(o)
    }
  } else {
    // Select all visible
    for (const o of filteredOrders.value) {
      selectedOrders.value.add(o)
    }
  }
  // Trigger reactivity
  selectedOrders.value = new Set(selectedOrders.value)
}

function toggleOrder(order: Order) {
  if (selectedOrders.value.has(order)) {
    selectedOrders.value.delete(order)
  } else {
    selectedOrders.value.add(order)
  }
  selectedOrders.value = new Set(selectedOrders.value)
}

function clearSelection() {
  selectedOrders.value = new Set()
}

const bulkMarkAsShipped = async () => {
  const toShip = [...selectedOrders.value].filter(o => o['Stato'] !== 'Spedito')
  if (toShip.length === 0) {
    alert('Tutti gli ordini selezionati sono già spediti.')
    return
  }
  if (!confirm(`Segnare ${toShip.length} ordini come spediti?`)) return

  isBulkProcessing.value = true
  try {
    for (const order of toShip) {
      order.isUpdating = true
      await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          token: API_TOKEN,
          action: 'updateField',
          date: order['Data'],
          username: order['Username Vinted'],
          field: 'Stato',
          value: 'Spedito',
        }),
      })
      order['Stato'] = 'Spedito'
      order.isUpdating = false
    }
    clearSelection()
  } catch (error) {
    console.error('Errore bulk shipped:', error)
    alert('Errore durante l\'aggiornamento di alcuni ordini.')
  } finally {
    isBulkProcessing.value = false
  }
}

const bulkDeleteOrders = async () => {
  const toDelete = [...selectedOrders.value]
  if (toDelete.length === 0) return
  if (!confirm(`Sei sicuro di voler eliminare ${toDelete.length} ordini? L'azione è irreversibile.`)) return

  isBulkProcessing.value = true
  try {
    for (const order of toDelete) {
      order.isDeleting = true
      await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          token: API_TOKEN,
          action: 'deleteOrder',
          date: order['Data'],
          username: order['Username Vinted'],
        }),
      })
    }
    orders.value = orders.value.filter(o => !toDelete.includes(o))
    clearSelection()
  } catch (error) {
    console.error('Errore bulk delete:', error)
    alert('Errore durante l\'eliminazione di alcuni ordini.')
  } finally {
    isBulkProcessing.value = false
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
            <h1 class="header-title">Gestione Ordini</h1>
            <p class="header-sub">BrandiLab — Dashboard</p>
          </div>
        </div>
        <button class="btn-logout" @click="logout" title="Esci">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span class="logout-text">Esci</span>
        </button>
      </header>

      <!-- Loading State -->
      <div v-if="isLoading" class="state-card">
        <div class="spinner" />
        <p>Caricamento ordini…</p>
      </div>

      <!-- Error State -->
      <div v-else-if="hasError" class="state-card state-error">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <p>Impossibile caricare gli ordini. Controlla la tua connessione e ricarica.</p>
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
              <span class="stat-label">Ordini Totali</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon stat-icon--toprint">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
            </div>
            <div class="stat-body">
              <span class="stat-number">{{ toPrintOrders }}</span>
              <span class="stat-label">Da Stampare</span>
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
              <span class="stat-label">Da Spedire</span>
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
              <span class="stat-label">Spediti</span>
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
              placeholder="Cerca prodotto, acquirente, piattaforma…"
              class="search-input"
            />
          </div>
          <button class="action-btn" @click="showAddModal = true" style="background: var(--color-primary); color: white; padding: 8px 16px; border-radius: 6px; font-weight: 500;">
  ➕ Nuovo Ordine
</button>
          <div class="filter-tabs">
            <button
              class="filter-tab"
              :class="{ active: statusFilter === 'all' }"
              @click="statusFilter = 'all'"
            >
              Tutti <span class="tab-count">{{ totalOrders }}</span>
            </button>
            <button
              class="filter-tab"
              :class="{ active: statusFilter === 'toprint' }"
              @click="statusFilter = 'toprint'"
            >
              Da Stampare <span class="tab-count">{{ toPrintOrders }}</span>
            </button>
            <button
              class="filter-tab"
              :class="{ active: statusFilter === 'pending' }"
              @click="statusFilter = 'pending'"
            >
              Da Spedire <span class="tab-count">{{ pendingOrders }}</span>
            </button>
            <button
              class="filter-tab"
              :class="{ active: statusFilter === 'printed' }"
              @click="statusFilter = 'printed'"
            >
              Stampati <span class="tab-count">{{ printedOrders }}</span>
            </button>
            <button
              class="filter-tab"
              :class="{ active: statusFilter === 'shipped' }"
              @click="statusFilter = 'shipped'"
            >
              Spediti <span class="tab-count">{{ shippedOrders }}</span>
            </button>
          </div>
        </section>

        <!-- Bulk Action Bar -->
        <transition name="bulk-bar">
          <section v-if="selectedOrders.size > 0" class="bulk-bar">
            <div class="bulk-bar-left">
              <span class="bulk-count">{{ selectedOrders.size }} selezionati</span>
              <button class="bulk-clear-btn" @click="clearSelection">✕ Deseleziona</button>
            </div>
            <div class="bulk-bar-right">
              <button
                class="action-btn bulk-action-shipped"
                :disabled="isBulkProcessing"
                @click="bulkMarkAsShipped"
              >
                <span v-if="isBulkProcessing" class="btn-spinner" />
                <span v-else>Segna Spediti ✓</span>
              </button>
              <button
                class="action-btn delete-btn"
                :disabled="isBulkProcessing"
                @click="bulkDeleteOrders"
              >
                <span v-if="isBulkProcessing" class="btn-spinner" />
                <span v-else>Elimina 🗑️</span>
              </button>
            </div>
          </section>
        </transition>

        <!-- Desktop: Orders Table -->
        <section class="table-panel desktop-only">
          <div class="table-wrapper">
            <table class="orders-table">
              <thead>
                <tr>
                  <th class="th-checkbox">
                    <input
                      type="checkbox"
                      class="order-checkbox"
                      :checked="isAllSelected"
                      @change="toggleSelectAll"
                    />
                  </th>
                  <th>Data</th>
                  <th>Piattaforma</th>
                  <th>Prodotto</th>
                  <th>Prezzo</th>
                  <th>Acquirente</th>
                  <th>Assegnato a</th>
                  <th>Stato</th>
                  <th>Documenti</th>
                  <th class="th-action">Azione</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(order, index) in filteredOrders"
                  :key="'t-' + index"
                  :class="{
                    'row-to-print': !order['Stato'] || order['Stato'] === 'Da Stampare',
                    'row-pending': order['Stato'] === 'Da Spedire',
                    'row-shipped': order['Stato'] === 'Spedito',
                    'row-printed': order['Stato'] === 'Stampato',
                    'row-selected': selectedOrders.has(order),
                  }"
                >
                  <td class="cell-checkbox">
                    <input
                      type="checkbox"
                      class="order-checkbox"
                      :checked="selectedOrders.has(order)"
                      @change="toggleOrder(order)"
                    />
                  </td>
                  <td class="cell-date">{{ order['Data'] }}</td>
                  <td>
                    <span class="platform-tag" style="padding: 0; display: inline-flex; border: none;">
                      <input 
                        type="text" 
                        class="editable-input text-center"
                        :value="order['Piattaforma']" 
                        @blur="updateField(order, 'Piattaforma', $event)" 
                        title="Clicca fuori per salvare"
                      />
                    </span>
                  </td>
                  <td class="cell-product">
                    <input 
                      type="text" 
                      class="editable-input"
                      :value="order['Prodotto']" 
                      @blur="updateField(order, 'Prodotto', $event)" 
                      title="Clicca fuori per salvare la modifica"
                    />
                  </td>
                  <td class="cell-price">
                    <input 
                      type="text" 
                      class="editable-input"
                      :value="order['Prezzo'] || ''" 
                      @blur="updateField(order, 'Prezzo', $event)" 
                      title="Clicca fuori per salvare la modifica"
                    />
                  </td>
                  <td class="cell-buyer">
                    <input 
                      type="text" 
                      class="editable-input"
                      :value="order['Username Vinted']" 
                      @blur="updateField(order, 'Username Vinted', $event)" 
                      title="Clicca fuori per salvare"
                    />
                  </td>
                  <!-- Dropdown Assegnato a -->
                  <td>
                    <select
                      class="field-select assign-select"
                      :value="order['Assegnato a'] || ''"
                      @change="updateField(order, 'Assegnato a', $event)"
                      :disabled="order.isUpdating"
                      :class="{
                        'assign-stefano': order['Assegnato a'] === 'Stefano',
                        'assign-gianluca': order['Assegnato a'] === 'Gianluca',
                      }"
                    >
                      <option value="" disabled>Seleziona...</option>
                      <option value="Stefano">Stefano</option>
                      <option value="Gianluca">Gianluca</option>
                    </select>
                  </td>
                  <!-- Dropdown Stato -->
                  <td>
                    <div class="status-cell">
                      <select
                        class="field-select status-select"
                        :value="order['Stato'] || 'Da Stampare'"
                        @change="updateField(order, 'Stato', $event)"
                        :disabled="order.isUpdating"
                        :class="{
                          'select-to-print': !order['Stato'] || order['Stato'] === 'Da Stampare',
                          'select-pending': order['Stato'] === 'Da Spedire',
                          'select-printed': order['Stato'] === 'Stampato',
                          'select-shipped': order['Stato'] === 'Spedito',
                        }"
                      >
                        <option value="Da Stampare">Da Stampare</option>
                        <option value="Da Spedire">Da Spedire</option>
                        <option value="Stampato">Stampato</option>
                        <option value="Spedito">Spedito</option>
                      </select>
                      <span v-if="order.isUpdating" class="loading-spinner">⏳</span>
                    </div>
                  </td>
                  <!-- Documenti -->
                  <td class="cell-pdf">
                    <!-- Se c'è già un PDF allegato -->
                    <div v-if="order['PDF']" class="pdf-actions">
                      <a 
                        :href="'https://drive.google.com/file/d/' + order['PDF'] + '/view'" 
                        target="_blank" 
                        class="action-btn view-btn"
                      >
                        📄 Apri
                      </a>
                      <button 
                        @click="deletePDF(order)" 
                        :disabled="order.isDeletingPDF" 
                        class="action-btn delete-btn"
                      >
                        <span v-if="order.isDeletingPDF">⏳</span>
                        <span v-else>✕</span>
                      </button>
                    </div>

                    <!-- Se non c'è ancora un PDF allegato -->
                    <div v-else class="pdf-upload">
                      <input 
                        type="file" 
                        accept="application/pdf" 
                        style="display: none;" 
                        :id="'upload-' + index" 
                        @change="uploadPDF(order, $event)"
                      >
                      <button 
                        @click="triggerUpload(index)" 
                        :disabled="order.isUploadingPDF" 
                        class="action-btn upload-btn"
                      >
                        <span v-if="order.isUploadingPDF">Caricamento...</span>
                        <span v-else>➕ Allega</span>
                      </button>
                    </div>
                  </td>
                  <!-- Azione -->
                  <td class="action-buttons">
                    <button
                      class="action-btn delete-btn"
                      :disabled="order.isDeleting"
                      @click="deleteOrder(order)"
                    >
                      <template v-if="order.isDeleting">
                        <span class="btn-spinner" />
                        Eliminazione…
                      </template>
                      <template v-else>
                        Elimina 🗑️
                      </template>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Mobile: Order Cards -->
        <section class="cards-list mobile-only">
          <div
            v-for="(order, index) in filteredOrders"
            :key="'c-' + index"
            class="order-card"
            :class="{
              'card-to-print': !order['Stato'] || order['Stato'] === 'Da Stampare',
              'card-pending': order['Stato'] === 'Da Spedire',
              'card-shipped': order['Stato'] === 'Spedito',
              'card-printed': order['Stato'] === 'Stampato',
              'card-selected': selectedOrders.has(order),
            }"
          >
            <!-- Card Header -->
            <div class="card-header">
              <div class="card-header-left">
                <input
                  type="checkbox"
                  class="order-checkbox"
                  :checked="selectedOrders.has(order)"
                  @change="toggleOrder(order)"
                />
                <div class="card-header-text">
                  <input 
                    type="text" 
                    class="card-product editable-input"
                    :value="order['Prodotto']" 
                    @blur="updateField(order, 'Prodotto', $event)" 
                    title="Clicca fuori per salvare"
                  />
                  <span class="card-date">{{ order['Data'] }}</span>
                </div>
              </div>
              <select
                class="field-select status-select"
                :value="order['Stato'] || 'Da Stampare'"
                @change="updateField(order, 'Stato', $event)"
                :disabled="order.isUpdating"
                :class="{
                  'select-to-print': !order['Stato'] || order['Stato'] === 'Da Stampare',
                  'select-pending': order['Stato'] === 'Da Spedire',
                  'select-printed': order['Stato'] === 'Stampato',
                  'select-shipped': order['Stato'] === 'Spedito',
                }"
              >
                <option value="Da Stampare">Da Stampare</option>
                <option value="Da Spedire">Da Spedire</option>
                <option value="Stampato">Stampato</option>
                <option value="Spedito">Spedito</option>
              </select>
            </div>

            <!-- Card Body -->
            <div class="card-details">
              <div class="card-detail">
                <span class="card-label">Piattaforma</span>
                <span class="platform-tag" style="padding: 0; display: inline-flex; border: none;">
                  <input 
                    type="text" 
                    class="editable-input text-center"
                    :value="order['Piattaforma']" 
                    @blur="updateField(order, 'Piattaforma', $event)" 
                    title="Clicca fuori per salvare"
                  />
                </span>
              </div>
              <div class="card-detail">
                <span class="card-label">Acquirente</span>
                <input 
                  type="text" 
                  class="card-value editable-input"
                  :value="order['Username Vinted']" 
                  @blur="updateField(order, 'Username Vinted', $event)" 
                  title="Clicca fuori per salvare"
                />
              </div>
              <div class="card-detail">
                <span class="card-label">Assegnato a</span>
                <select
                  class="field-select assign-select"
                  :value="order['Assegnato a'] || ''"
                  @change="updateField(order, 'Assegnato a', $event)"
                  :disabled="order.isUpdating"
                  :class="{
                    'assign-stefano': order['Assegnato a'] === 'Stefano',
                    'assign-gianluca': order['Assegnato a'] === 'Gianluca',
                  }"
                >
                  <option value="" disabled>Seleziona...</option>
                  <option value="Stefano">Stefano</option>
                  <option value="Gianluca">Gianluca</option>
                </select>
              </div>
              <div class="card-detail">
                <span class="card-label">Prezzo</span>
                <input 
                  type="text" 
                  class="card-value card-price editable-input text-right"
                  :value="order['Prezzo'] || ''" 
                  @blur="updateField(order, 'Prezzo', $event)" 
                  title="Clicca fuori per salvare"
                />
              </div>
              
              <!-- Documenti -->
              <div class="card-detail" style="flex-direction: column; align-items: flex-start;">
                <span class="card-label" style="margin-bottom: 0.5rem;">Documenti</span>
              <!-- Se c'è già un PDF allegato -->
              <div v-if="order['PDF']" class="pdf-actions" style="display: flex; gap: 0.5rem;">
                <a 
                  :href="'https://drive.google.com/file/d/' + order['PDF'] + '/view'" 
                  target="_blank" 
                  class="action-btn view-btn"
                >
                  📄 Apri
                </a>
                <button 
                  @click="deletePDF(order)" 
                  :disabled="order.isDeletingPDF" 
                  class="action-btn delete-btn"
                >
                  <span v-if="order.isDeletingPDF">⏳</span>
                  <span v-else>✕</span>
                </button>
              </div>

              <!-- Se non c'è ancora un PDF allegato -->
              <div v-else class="pdf-upload">
                <input 
                  type="file" 
                  accept="application/pdf" 
                  style="display: none;" 
                  :id="'upload-mobile-' + index" 
                  @change="uploadPDF(order, $event)"
                >
                <button 
                  @click="triggerUploadMobile(index)" 
                  :disabled="order.isUploadingPDF" 
                  class="action-btn upload-btn"
                >
                  <span v-if="order.isUploadingPDF">Caricamento...</span>
                  <span v-else>➕ Allega</span>
                </button>
              </div>
            </div>
            </div>

            <!-- Card Actions -->
            <div class="card-actions">
              <button
                class="action-btn card-action-btn delete-btn"
                :disabled="order.isDeleting"
                @click="deleteOrder(order)"
              >
                <template v-if="order.isDeleting">
                  <span class="btn-spinner" />
                  Eliminazione…
                </template>
                <template v-else>
                  Elimina 🗑️
                </template>
              </button>
            </div>
          </div>
        </section>

        <!-- Empty State (shared) -->
        <div v-if="filteredOrders.length === 0" class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <p>Nessun ordine corrisponde ai tuoi filtri.</p>
        </div>

        <!-- Footer -->
        <footer class="admin-footer">
          <p>Mostrati {{ filteredOrders.length }} di {{ totalOrders }} ordini</p>
        </footer>
      </template>
    </div>
  </main>
  <!-- MODALE NUOVO ORDINE -->
<div v-if="showAddModal" class="modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
  <div class="modal-content" style="background: white; padding: 24px; border-radius: 12px; width: 400px; max-width: 90%;">
    <h3 style="margin-bottom: 16px;">Aggiungi Nuovo Ordine</h3>
    
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <label>Piattaforma</label>
      <select v-model="newOrder.piattaforma" class="field-select" style="width:100%; padding:8px;">
        <option value="Vinted Pro">Vinted Pro</option>
        <option value="TikTok Shop">TikTok Shop</option>
        <option value="eBay">eBay</option>
      </select>

      <label>Prodotto</label>
      <input v-model="newOrder.prodotto" type="text" placeholder="Es. Cactus Tech Stand" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" />

      <label>Prezzo</label>
      <input v-model="newOrder.prezzo" type="text" placeholder="Es. €14.90" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" />

      <label>Username Acquirente</label>
      <input v-model="newOrder.username" type="text" placeholder="Es. mades10" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" />

      <label>Indirizzo di Spedizione</label>
      <input v-model="newOrder.indirizzo" type="text" placeholder="Via Roma 1, Napoli" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" />

      <label>Assegnato a</label>
      <select v-model="newOrder.assegnato" class="field-select" style="width:100%; padding:8px;">
        <option value="">Nessuno</option>
        <option value="Stefano">Stefano</option>
        <option value="Gianluca">Gianluca</option>
      </select>
    </div>

    <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
      <button @click="showAddModal = false" style="padding: 8px 16px; background: #ccc; border: none; border-radius: 4px; cursor: pointer;">Annulla</button>
      <button @click="submitNewOrder" style="padding: 8px 16px; background: #2e7d32; color: white; border: none; border-radius: 4px; cursor: pointer;">Salva Ordine</button>
    </div>
  </div>
</div>
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

.stat-icon--toprint {
  background: #ffebee;
  color: #c62828;
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

.row-shipped .delete-btn,
.row-shipped:hover .delete-btn {
  opacity: 1;
}

.row-to-print {
  background-color: #fffafb;
}

.row-to-print:hover {
  background-color: #ffebee;
}

.row-pending {
  background-color: #fffdfa;
}

.row-pending:hover {
  background-color: #fff3e0;
}

.row-printed {
  background-color: #fffde7;
}

.row-printed:hover {
  background-color: #fff9c4;
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

.cell-price {
  font-weight: 500;
}

/* ===== Editable Inputs ===== */
.editable-input {
  border: 1px solid transparent;
  background: transparent;
  width: 100%;
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  color: inherit;
  padding: 4px 6px;
  border-radius: 4px;
  outline: none;
  transition: all 0.2s ease;
}

.editable-input:hover {
  background: rgba(0,0,0,0.03);
  border-color: rgba(0,0,0,0.1);
}

.editable-input:focus {
  background: #fff;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-accent-light);
}

.editable-input.text-center {
  text-align: center;
}

.editable-input.text-right {
  text-align: right;
}

/* ===== Checkboxes & Selection ===== */
.th-checkbox,
.cell-checkbox {
  width: 40px;
  text-align: center;
  padding-left: 0.75rem;
  padding-right: 0;
}

.order-checkbox {
  width: 16px;
  height: 16px;
  accent-color: var(--color-accent);
  cursor: pointer;
}

.row-selected {
  background: var(--color-accent-light) !important;
}

.card-selected {
  outline: 2px solid var(--color-accent);
  background: var(--color-accent-light) !important;
}

.card-header-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

/* ===== Bulk Action Bar ===== */
.bulk-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.75rem 1.2rem;
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
  box-shadow: var(--shadow-md);
}

.bulk-bar-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.bulk-count {
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.bulk-clear-btn {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: none;
  padding: 0.3rem 0.7rem;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-fast);
}

.bulk-clear-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.bulk-bar-right {
  display: flex;
  gap: 0.5rem;
}

.bulk-action-shipped {
  background: var(--color-success) !important;
}

.bulk-action-shipped:hover:not(:disabled) {
  background: #1e8449 !important;
}

/* Bulk bar transition */
.bulk-bar-enter-active,
.bulk-bar-leave-active {
  transition: all 0.25s ease;
}

.bulk-bar-enter-from,
.bulk-bar-leave-to {
  opacity: 0;
  transform: translateY(-8px);
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
  opacity: 0.6;
}

/* ===== PDF Actions ===== */
.pdf-actions, .pdf-upload {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.view-btn {
  color: #1976d2;
  background-color: #e3f2fd;
  border-color: #bbdefb;
  text-decoration: none;
}

.view-btn:hover:not(:disabled) {
  background-color: #bbdefb;
}

.upload-btn {
  color: #388e3c;
  background-color: #e8f5e9;
  border-color: #c8e6c9;
}

.upload-btn:hover:not(:disabled) {
  background-color: #c8e6c9;
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

/* ===== Delete Button ===== */
.delete-btn {
  background: #e74c3c !important;
  color: white !important;
  border: none !important;
}

.delete-btn:hover:not(:disabled) {
  background: #c0392b !important;
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.delete-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

/* ===== Action Buttons Container (Desktop) ===== */
.action-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}

/* ===== Card Actions Container (Mobile) ===== */
.card-actions {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

/* Empty */
/* ===== Mobile Order Cards ===== */
.cards-list {
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

.card-shipped .delete-btn {
  opacity: 1;
}

.card-to-print {
  background-color: #fffafb;
}

.card-pending {
  background-color: #fffdfa;
}

.card-printed {
  background-color: #fffde7;
}

/* ===== Field Select Dropdowns ===== */
.field-select {
  padding: 0.35rem 0.5rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: var(--font-size-xs);
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-fast);
  outline: none;
  min-width: 0;
}

.field-select:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-light);
}

.field-select:disabled {
  opacity: 0.6;
  cursor: default;
}
.status-select.select-to-print {
  background: #ffebee;
  color: #c62828;
  border-color: #ef9a9a;
}

.status-select.select-pending {
  background: #fff3e0;
  color: #bf6c00;
  border-color: #ffcc80;
}

.status-select.select-printed {
  background: #fffde7;
  color: #f57f17;
  border-color: #fff176;
}

.status-select.select-shipped {
  background: rgba(39, 174, 96, 0.1);
  color: #1e8449;
  border-color: #a9dfbf;
}

.assign-select {
  min-width: 100px;
}

.assign-select.assign-stefano {
  background: #e3f2fd;
  color: #1565c0;
  border-color: #90caf9;
}

.assign-select.assign-gianluca {
  background: #fce4ec;
  color: #c2185b;
  border-color: #f48fb1;
}

.status-cell {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.loading-spinner {
  font-size: 0.8em;
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
  flex-direction: row;
  align-items: center;
  gap: 0.6rem;
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
  min-width: 120px;
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

@media (max-width: 680px) {
  /* Switch from table to cards */
  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: flex;
  }

  .admin-page {
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
    gap: 0.6rem;
    margin-bottom: 1rem;
  }

  .stat-card {
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

@media (max-width: 380px) {
  .stats-row {
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }

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

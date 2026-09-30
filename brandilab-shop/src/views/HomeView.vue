<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProducts, type SortOption } from '@/composables/useProducts'
import { useI18n } from 'vue-i18n'
import TheHero from '@/components/TheHero.vue'
import ProductGrid from '@/components/ProductGrid.vue'

const { products, loading, materials, categories, colors, filterProducts, sortProducts, searchQuery } = useProducts()
const { t } = useI18n()

const isMobileFilterOpen = ref(false)

const filters = ref({
  material: 'All',
  category: 'All',
  color: 'All'
})
const sortBy = ref<SortOption>('default')

// Amazon-style filter state
const selectedCategories = ref<string[]>([])
const priceMin = ref(0)
const priceMax = ref(9999)
const priceMinInput = ref<number | ''>('')
const priceMaxInput = ref<number | ''>('')

const selectedColors = ref<string[]>([])

// Expand/collapse state for filter sections
const expandedSections = ref({
  categories: true,
  price: true,
  color: true
})

const toggleSection = (section: keyof typeof expandedSections.value) => {
  expandedSections.value[section] = !expandedSections.value[section]
}

// Categories handling
const sampleCategories = ['Supporti Controller', 'Lampade', 'Arredamento', 'Accessori Gaming', 'Maschere', 'Action Figures']
const displayCategories = computed(() => {
  const all = new Set([...sampleCategories, ...categories.value.filter(c => c !== 'All')])
  return Array.from(all)
})

// Color map for swatches
const colorMap: Record<string, string> = {
  'Bianco': '#ffffff', 'White': '#ffffff',
  'Nero': '#1a1a1a', 'Black': '#1a1a1a',
  'Rosso': '#e74c3c', 'Red': '#e74c3c',
  'Blu': '#3498db', 'Blue': '#3498db',
  'Verde': '#27ae60', 'Green': '#27ae60',
  'Grigio': '#95a5a6', 'Gray': '#95a5a6',
  'Rosa': '#e91e63', 'Pink': '#e91e63',
  'Viola': '#9b59b6', 'Purple': '#9b59b6',
  'Giallo': '#f1c40f', 'Yellow': '#f1c40f',
  'Arancione': '#e67e22', 'Orange': '#e67e22',
  'Marrone': '#8d6e63', 'Brown': '#8d6e63'
}

const defaultColors = ['Bianco', 'Nero', 'Grigio', 'Rosso', 'Blu', 'Verde', 'Giallo', 'Arancione']
const displayColors = computed(() => {
  const all = new Set([...defaultColors, ...colors.value.filter(c => c !== 'All')])
  return Array.from(all)
})

const getSwatchColor = (colorName: string): string => {
  return colorMap[colorName] || '#888888'
}

const toggleCategory = (cat: string) => {
  const idx = selectedCategories.value.indexOf(cat)
  if (idx === -1) selectedCategories.value.push(cat)
  else selectedCategories.value.splice(idx, 1)
}

const toggleColor = (col: string) => {
  const idx = selectedColors.value.indexOf(col)
  if (idx === -1) selectedColors.value.push(col)
  else selectedColors.value.splice(idx, 1)
}

const filteredAndSortedProducts = computed(() => {
  let result = products.value

  // Text search filter
  if (searchQuery.value && searchQuery.value.trim() !== '') {
    const q = searchQuery.value.trim().toLowerCase()
    result = result.filter(p => 
      (p.title && p.title.toLowerCase().includes(q)) || 
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    )
  }

  // Category filter (checkboxes)
  if (selectedCategories.value.length > 0) {
    result = result.filter(p => p.category && selectedCategories.value.includes(p.category.trim()))
  }

  // Price range filter
  result = result.filter(p => p.price >= priceMin.value && p.price <= priceMax.value)

  // Color filter (swatches)
  if (selectedColors.value.length > 0) {
    result = result.filter(p => p.color && selectedColors.value.includes(p.color.trim()))
  }

  // Apply legacy filter fallback
  result = filterProducts(result, filters.value)

  return sortProducts(result, sortBy.value)
})

// Recommended products: last 4 products not in the main filtered view
const recommendedProducts = computed(() => {
  const mainIds = new Set(filteredAndSortedProducts.value.map(p => p._id))
  const others = products.value.filter(p => !mainIds.has(p._id))
  return others.length >= 4 ? others.slice(0, 4) : products.value.slice(-4)
})

const setQuickPriceRange = (min: number, max: number) => {
  priceMin.value = min
  priceMax.value = max
  priceMinInput.value = min === 0 ? '' : min
  priceMaxInput.value = max === 9999 ? '' : max
}

const applyPriceInputs = () => {
  priceMin.value = priceMinInput.value !== '' ? Number(priceMinInput.value) : 0
  priceMax.value = priceMaxInput.value !== '' ? Number(priceMaxInput.value) : 9999
}
</script>

<template>
  <main class="home-view">
    <TheHero />

    <section id="shop" class="shop-section">
      <div class="container">
        
        <div class="shop-layout">
          <!-- Amazon-style Sidebar Filters -->
          <div class="mobile-filter-overlay" v-if="isMobileFilterOpen" @click="isMobileFilterOpen = false"></div>
          
          <aside class="shop-sidebar" :class="{ 'is-open': isMobileFilterOpen }">
            <div class="mobile-filter-header">
              <h3>{{ t('shop.filtersTitle') }}</h3>
              <button class="close-filter-btn" @click="isMobileFilterOpen = false">&times;</button>
            </div>

            <!-- Categories with checkboxes -->
            <div class="filter-section">
              <button class="filter-header" @click="toggleSection('categories')">
                <h3 class="filter-title">{{ t('shop.categoriesTitle') }}</h3>
                <svg :class="{ rotated: !expandedSections.categories }" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div v-show="expandedSections.categories" class="filter-body">
                <label
                  v-for="cat in displayCategories"
                  :key="cat"
                  class="checkbox-label"
                >
                  <input
                    type="checkbox"
                    :checked="selectedCategories.includes(cat)"
                    @change="toggleCategory(cat)"
                    class="filter-checkbox"
                  />
                  <span class="checkbox-text">{{ cat }}</span>
                </label>
              </div>
            </div>

            <!-- Price Range -->
            <div class="filter-section">
              <button class="filter-header" @click="toggleSection('price')">
                <h3 class="filter-title">{{ t('shop.priceTitle') }}</h3>
                <svg :class="{ rotated: !expandedSections.price }" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div v-show="expandedSections.price" class="filter-body">
                <div class="price-links">
                  <button class="text-link" :class="{active: priceMin === 0 && priceMax === 15}" @click="setQuickPriceRange(0, 15)">Fino a 15 €</button>
                  <button class="text-link" :class="{active: priceMin === 15 && priceMax === 30}" @click="setQuickPriceRange(15, 30)">15 € - 30 €</button>
                  <button class="text-link" :class="{active: priceMin === 30 && priceMax === 50}" @click="setQuickPriceRange(30, 50)">30 € - 50 €</button>
                  <button class="text-link" :class="{active: priceMin === 50 && priceMax === 9999}" @click="setQuickPriceRange(50, 9999)">Oltre 50 €</button>
                  <button class="text-link" :class="{active: priceMin === 0 && priceMax === 9999}" @click="setQuickPriceRange(0, 9999)">Qualsiasi prezzo</button>
                </div>
                <div class="price-inputs">
                  <input type="number" v-model="priceMinInput" placeholder="Min" class="price-input" min="0" @keyup.enter="applyPriceInputs" />
                  <span class="price-separator">-</span>
                  <input type="number" v-model="priceMaxInput" placeholder="Max" class="price-input" min="0" @keyup.enter="applyPriceInputs" />
                  <button class="price-go-btn" @click="applyPriceInputs">Vai</button>
                </div>
              </div>
            </div>

            <!-- Color Swatches -->
            <div class="filter-section">
              <button class="filter-header" @click="toggleSection('color')">
                <h3 class="filter-title">{{ t('shop.colorTitle') }}</h3>
                <svg :class="{ rotated: !expandedSections.color }" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div v-show="expandedSections.color" class="filter-body">
                <div class="color-swatches">
                  <button
                    v-for="col in displayColors"
                    :key="col"
                    class="color-swatch"
                    :class="{ selected: selectedColors.includes(col) }"
                    :style="{ backgroundColor: getSwatchColor(col) }"
                    :title="col"
                    @click="toggleColor(col)"
                  >
                    <svg v-if="selectedColors.includes(col)" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </aside>

          <!-- Main Shop Content -->
          <div class="shop-main">
            <div class="shop-header">
              <h2 class="section-title">{{ t('home.ourProducts') }}</h2>
              <div class="sort-filter-actions">
                <button class="btn btn-outline mobile-filter-btn" @click="isMobileFilterOpen = true">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                  {{ t('shop.filtersTitle') }}
                </button>
                <div class="sort-filter">
                <select v-model="sortBy" class="sort-select" :aria-label="t('shop.sortLabel')">
                  <option value="default">{{ t('shop.sortDefault') }}</option>
                  <option value="price-asc">{{ t('shop.sortPriceAsc') }}</option>
                  <option value="price-desc">{{ t('shop.sortPriceDesc') }}</option>
                  <option value="name-asc">{{ t('shop.sortNameAsc') }}</option>
                </select>
              </div>
              </div>
            </div>
            
            <ProductGrid :products="filteredAndSortedProducts" :loading="loading" />
          </div>
        </div>

      </div>
    </section>

    <!-- Recommended for you -->
    <section class="recommended-section" v-if="recommendedProducts.length > 0">
      <div class="container">
        <h2 class="section-title">{{ t('home.recommendedTitle') }}</h2>
        <ProductGrid :products="recommendedProducts" :horizontal-on-mobile="true" />
      </div>
    </section>

    <!-- Why Section -->
    <section class="section why-section">
      <div class="container">
        <h2 class="section-title">{{ t('home.whyTitle') }}</h2>
        <div class="values-grid">
          <div class="value-card">
            <div class="value-icon">🎯</div>
            <h3>{{ t('home.precisionTitle') }}</h3>
            <p>{{ t('home.precisionText') }}</p>
          </div>
          <div class="value-card">
            <div class="value-icon">🎨</div>
            <h3>{{ t('home.customTitle') }}</h3>
            <p>{{ t('home.customText') }}</p>
          </div>
          <div class="value-card">
            <div class="value-icon">🌱</div>
            <h3>{{ t('home.ecoTitle') }}</h3>
            <p>{{ t('home.ecoText') }}</p>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.home-view {
  display: flex;
  flex-direction: column;
}

.shop-section {
  padding: 2rem 1rem;
  background-color: var(--color-bg);
}

.container {
  max-width: 1440px;
  margin: 0 auto;
}

.shop-layout {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: relative;
}

/* Mobile Sidebar (Drawer) */
.shop-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 280px;
  height: 100vh;
  background: var(--color-surface);
  z-index: 1000;
  overflow-y: auto;
  padding: 1.5rem;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  box-shadow: var(--shadow-lg);
}

.shop-sidebar.is-open {
  transform: translateX(0);
}

.mobile-filter-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.mobile-filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.mobile-filter-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--color-primary);
}

.close-filter-btn {
  background: none;
  border: none;
  font-size: 1.75rem;
  color: var(--color-text);
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

/* Mobile Filter Button */
.sort-filter-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
  width: 100%;
}
.mobile-filter-btn {
  display: flex;
  white-space: nowrap;
}
.sort-filter {
  flex-grow: 1;
}

@media (min-width: 768px) {
  .shop-layout {
    flex-direction: row;
    align-items: flex-start;
  }

  .shop-sidebar {
    width: 230px;
    flex-shrink: 0;
    position: sticky;
    top: calc(var(--navbar-height) + 1rem);
    height: auto;
    transform: none;
    padding: 0;
    box-shadow: none;
    z-index: 1;
  }

  .mobile-filter-overlay,
  .mobile-filter-header,
  .mobile-filter-btn {
    display: none;
  }

  .shop-main {
    flex-grow: 1;
    min-width: 0;
  }
}

/* Filter Sidebar Styles */
.filter-section {
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.75rem;
  margin-bottom: 0.75rem;
}

.filter-section:last-child {
  border-bottom: none;
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: none;
  border: none;
  padding: 0.5rem 0;
  cursor: pointer;
  color: var(--color-text);
}

.filter-header svg {
  color: var(--color-text-light);
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.filter-header svg.rotated {
  transform: rotate(-90deg);
}

.filter-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-primary);
  margin: 0;
}

.filter-body {
  padding: 0.5rem 0;
}

/* Checkbox labels */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--color-text);
  transition: color 0.15s ease;
}

.checkbox-label:hover {
  color: var(--color-accent);
}

.filter-checkbox {
  width: 16px;
  height: 16px;
  accent-color: var(--color-accent);
  cursor: pointer;
  flex-shrink: 0;
}

.checkbox-text {
  flex-grow: 1;
}

/* Price links and inputs (Amazon style) */
.price-links {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
  margin-bottom: 0.75rem;
}

.text-link {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: var(--color-text);
  font-size: 0.9rem;
  transition: color 0.15s ease;
  text-align: left;
}

.text-link:hover {
  color: var(--color-accent);
  text-decoration: underline;
}

.text-link.active {
  color: var(--color-accent);
  font-weight: 600;
}

.price-inputs {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.price-input {
  width: 50px;
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.85rem;
  outline: none;
  transition: border-color 0.15s ease;
}

.price-input:focus {
  border-color: var(--color-accent);
}

.price-input::-webkit-outer-spin-button,
.price-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.price-input[type=number] {
  -moz-appearance: textfield;
}

.price-separator {
  color: var(--color-text-muted);
}

.price-go-btn {
  padding: 0.35rem 0.6rem;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.85rem;
  transition: var(--transition-fast);
  margin-left: 0.25rem;
}

.price-go-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

/* Color swatches */
.color-swatches {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding: 0.25rem 0;
}

.color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  cursor: pointer;
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.color-swatch:hover {
  transform: scale(1.15);
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}

.color-swatch.selected {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent);
}

.color-swatch svg {
  color: #fff;
  filter: drop-shadow(0 1px 1px rgba(0,0,0,0.3));
}

/* Shop Header */
.shop-header {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  align-items: flex-start;
}

@media (min-width: 640px) {
  .shop-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.section {
  padding: 5rem 1rem;
}

.section-title {
  font-size: 1.5rem;
  color: var(--color-primary);
  margin: 0;
}

@media (min-width: 640px) {
  .shop-header .section-title {
    text-align: left;
    margin-bottom: 0;
  }
}

.sort-select {
  padding: 0.5rem 2rem 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
  color: var(--color-text);
  font-size: 0.85rem;
  cursor: pointer;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%232d3436%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
  background-repeat: no-repeat;
  background-position: right 0.7rem top 50%;
  background-size: 0.55rem auto;
}

:root[data-theme='dark'] .sort-select {
  background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23e4e6eb%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
}

/* Recommended section */
.recommended-section {
  padding: 2.5rem 1rem;
  background-color: var(--color-bg);
  border-top: 1px solid var(--color-border);
}

.recommended-section .section-title {
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

/* Why section */
.why-section {
  background-color: var(--color-surface);
}

.values-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.value-card {
  background: var(--color-bg);
  padding: 2rem;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  text-align: center;
  transition: var(--transition);
}

.value-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-5px);
}

.value-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.value-card h3 {
  margin-bottom: 1rem;
  color: var(--color-primary);
}

.value-card p {
  color: var(--color-text-light);
  line-height: 1.6;
}
</style>

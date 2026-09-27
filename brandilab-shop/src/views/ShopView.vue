<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useProducts, type SortOption } from '@/composables/useProducts'
import ProductGrid from '@/components/ProductGrid.vue'

const { products, loading, materials, filterByMaterial, sortProducts } = useProducts()
const { t } = useI18n()

const selectedMaterial = ref<string>('All')
const sortBy = ref<SortOption>('default')

const filteredAndSortedProducts = computed(() =>
  sortProducts(filterByMaterial(products.value, selectedMaterial.value), sortBy.value),
)
</script>

<template>
  <main class="shop-view">
    <div class="container">
      <header class="page-header">
        <nav class="breadcrumb">
          <RouterLink to="/">{{ t('nav.home') }}</RouterLink>
          <span class="separator">/</span>
          <span class="current">{{ t('nav.shop') }}</span>
        </nav>
        <h1 class="title">{{ t('shop.title') }}</h1>
        <p class="subtitle">{{ t('shop.subtitle') }}</p>
      </header>

      <div class="filters-row">
        <!-- Only worth showing once products actually have materials -->
        <div class="material-filters" v-if="materials.length > 1">
          <button
            v-for="material in materials" 
            :key="material"
            class="filter-btn"
            :class="{ active: selectedMaterial === material }"
            @click="selectedMaterial = material"
          >
            {{ material === 'All' ? t('shop.all') : material }}
          </button>
        </div>

        <div class="sort-filter">
          <select v-model="sortBy" class="sort-select" :aria-label="t('shop.sortLabel')">
            <option value="default">{{ t('shop.sortDefault') }}</option>
            <option value="price-asc">{{ t('shop.sortPriceAsc') }}</option>
            <option value="price-desc">{{ t('shop.sortPriceDesc') }}</option>
            <option value="name-asc">{{ t('shop.sortNameAsc') }}</option>
          </select>
        </div>
      </div>

      <ProductGrid :products="filteredAndSortedProducts" :loading="loading" />
    </div>
  </main>
</template>

<style scoped>
.shop-view {
  padding: 3rem 1rem 5rem;
  background-color: var(--color-bg);
  min-height: calc(100vh - var(--navbar-height));
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 3rem;
  text-align: center;
}

.breadcrumb {
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  color: var(--color-text-light);
}

.breadcrumb a {
  color: var(--color-text-light);
  text-decoration: none;
  transition: var(--transition);
}

.breadcrumb a:hover {
  color: var(--color-accent);
}

.separator {
  margin: 0 0.5rem;
}

.current {
  color: var(--color-text);
  font-weight: 500;
}

.title {
  font-size: 2.5rem;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--color-text-light);
  font-size: 1.1rem;
}

.filters-row {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 3rem;
  align-items: center;
}

@media (min-width: 768px) {
  .filters-row {
    flex-direction: row;
    justify-content: space-between;
  }

  .sort-filter {
    margin-left: auto;
  }
}

.material-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

.filter-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-size: 0.9rem;
  transition: var(--transition);
}

.filter-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.filter-btn.active {
  background: var(--color-accent);
  color: white;
  border-color: var(--color-accent);
}

.sort-select {
  padding: 0.6rem 2rem 0.6rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
  color: var(--color-text);
  font-size: 0.95rem;
  cursor: pointer;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%232d3436%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
  background-repeat: no-repeat;
  background-position: right 0.7rem top 50%;
  background-size: 0.65rem auto;
}

/* Same arrow as above, light-colored for dark mode */
:root[data-theme='dark'] .sort-select {
  background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23e4e6eb%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
}

.sort-select:focus {
  border-color: var(--color-accent);
}
</style>

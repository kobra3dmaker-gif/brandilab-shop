<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProducts, type SortOption } from '@/composables/useProducts'
import ProductGrid from '@/components/ProductGrid.vue'
import ScrollWords from '@/components/ScrollWords.vue'

const { products, loading, error, categories, sortProducts, searchQuery, fetchProducts } = useProducts()
const { t } = useI18n()

const sortBy = ref<SortOption>('default')
const category = ref('All')

const visibleProducts = computed(() => {
  let list = products.value
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q),
    )
  }
  if (category.value !== 'All') {
    list = list.filter((p) => p.category?.trim() === category.value)
  }
  return sortProducts(list, sortBy.value)
})

const isFiltered = computed(() => searchQuery.value.trim() !== '' || category.value !== 'All')

function showAll() {
  searchQuery.value = ''
  category.value = 'All'
}
</script>

<template>
  <main class="home">
    <section class="cover container" aria-labelledby="cover-title">
      <h1 id="cover-title" class="cover-title display">
        <span>{{ t('home.coverLine1') }}</span>
        <span class="cover-accent">{{ t('home.coverLine2') }}</span>
      </h1>

      <div class="cover-side">
        <p class="cover-intro">{{ t('home.coverIntro') }}</p>
        <ol class="steps" :aria-label="t('home.processLabel')">
          <li>{{ t('home.stepOrder') }}</li>
          <li>{{ t('home.stepPrint') }}</li>
          <li>{{ t('home.stepDeliver') }}</li>
        </ol>
      </div>
    </section>

    <section id="catalogo" class="catalogue" aria-labelledby="catalogue-title">
      <div class="toolbar container">
        <div class="toolbar-title">
          <h2 id="catalogue-title" class="catalogue-title display">{{ t('home.catalogueTitle') }}</h2>
          <span v-if="!loading && !error" class="count tabular">{{ t('home.count', visibleProducts.length) }}</span>
        </div>

        <div class="controls">
          <label class="search">
            <span class="visually-hidden">{{ t('shop.searchLabel') }}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="square" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="M15.5 15.5L21 21" />
            </svg>
            <input v-model="searchQuery" type="search" :placeholder="t('shop.searchPlaceholder')" enterkeyhint="search" />
          </label>

          <label class="sort">
            <span class="sort-label">{{ t('shop.sortLabel') }}</span>
            <select v-model="sortBy">
              <option value="default">{{ t('shop.sortDefault') }}</option>
              <option value="price-asc">{{ t('shop.sortPriceAsc') }}</option>
              <option value="price-desc">{{ t('shop.sortPriceDesc') }}</option>
              <option value="name-asc">{{ t('shop.sortNameAsc') }}</option>
            </select>
          </label>
        </div>

        <div v-if="categories.length > 2" class="chips" role="group" :aria-label="t('shop.categoriesLabel')">
          <button
            v-for="c in categories"
            :key="c"
            class="chip"
            :class="{ 'is-on': category === c }"
            :aria-pressed="category === c"
            @click="category = c"
          >
            {{ c === 'All' ? t('shop.all') : c }}
          </button>
        </div>
      </div>

      <div class="sheet-wrap">
        <div v-if="error && !loading" class="state container">
          <p>{{ t('shop.loadError') }}</p>
          <button class="btn btn-ink" @click="fetchProducts()">{{ t('shop.retry') }}</button>
        </div>

        <div v-else-if="!loading && visibleProducts.length === 0" class="state container">
          <p>{{ t('shop.noResults', { q: searchQuery.trim() }) }}</p>
          <button class="btn btn-ink" @click="showAll">{{ t('shop.showAll') }}</button>
        </div>

        <ProductGrid
          v-else
          :products="visibleProducts"
          :loading="loading"
          :show-custom="!isFiltered"
        />
      </div>
    </section>

    <section class="how container" aria-labelledby="how-title">
      <ScrollWords id="how-title" :key="t('home.statement')" tag="h2" class="statement" :text="t('home.statement')" />
      <RouterLink to="/about" class="btn btn-line how-link">
        {{ t('footer.ourStory') }}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </RouterLink>
    </section>
  </main>
</template>

<style scoped>
/* Cover */
.cover {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem 3rem;
  align-items: end;
  padding-top: clamp(1.5rem, 4vw, 3rem);
  padding-bottom: clamp(1.5rem, 3vw, 2.5rem);
}

.cover-title {
  display: flex;
  flex-direction: column;
  font-size: clamp(2.6rem, 7.6vw, 6rem);
}

.cover-accent {
  color: var(--ink-2);
}

.cover-title > span {
  animation: rise-blur 1.1s var(--ease-apple) both;
}

.cover-title > span:nth-child(2) {
  animation-delay: 110ms;
}

.cover-side > * {
  animation: rise 1s var(--ease-apple) both;
  animation-delay: 260ms;
}

.cover-side > .steps {
  animation-delay: 360ms;
}

.toolbar {
  animation: rise 1s var(--ease-apple) 420ms both;
}

/* As the catalogue slides over it, the cover recedes */
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .cover {
      animation: recede linear both;
      animation-timeline: view();
      animation-range: exit 0% exit 100%;
      transform-origin: 0% 100%;
    }
  }
}

@keyframes recede {
  to {
    opacity: 0.15;
    scale: 0.92;
    translate: 0 6%;
  }
}

.cover-side {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  max-width: 44ch;
}

.cover-intro {
  font-size: clamp(1rem, 1.25vw, 1.125rem);
  color: var(--ink-2);
  line-height: 1.5;
}

.steps {
  display: flex;
  flex-direction: column;
  border-top: 2px solid var(--rule);
}

.steps li {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 0;
  font-weight: 700;
  border-bottom: 2px solid var(--rule);
}

.steps li::before {
  content: '';
  width: 0.7rem;
  height: 0.7rem;
  flex-shrink: 0;
  background: var(--blue);
}

@media (min-width: 960px) {
  .cover {
    grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
  }

  .cover-side {
    padding-bottom: 0.4rem;
  }
}

/* Catalogue */
.catalogue {
  padding-bottom: clamp(3rem, 6vw, 5rem);
}

.toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
  align-items: end;
  padding-top: 1.25rem;
  padding-bottom: 1.25rem;
  border-top: 2px solid var(--rule);
}

.toolbar-title {
  display: flex;
  align-items: baseline;
  gap: 1rem;
}

.catalogue-title {
  font-size: clamp(1.75rem, 3vw, 2.5rem);
}

.count {
  font-weight: 600;
  color: var(--ink-2);
}

.controls {
  display: flex;
  gap: 0.75rem;
}

@media (max-width: 559px) {
  .controls {
    gap: 0.5rem;
  }

  .search {
    flex: 1 1 0;
  }

  .sort {
    padding-left: 0;
  }

  .sort-label {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }

  .sort select {
    max-width: 9.5rem;
    padding-left: 0.7rem;
  }

  .cover {
    padding-top: 1rem;
    padding-bottom: 1rem;
    gap: 0.9rem;
  }

  .cover-intro {
    display: none;
  }

  .steps {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.15rem 0.9rem;
    border-top: none;
  }

  .steps li {
    padding: 0;
    border-bottom: none;
    font-size: 0.82rem;
    gap: 0.35rem;
  }

  .steps li::before {
    width: 0.5rem;
    height: 0.5rem;
  }

  .toolbar {
    padding-top: 0.9rem;
    padding-bottom: 0.9rem;
    gap: 0.75rem;
  }
}

.search {
  flex: 1 1 220px;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-height: 48px;
  padding: 0 0.9rem;
  border: 2px solid var(--ink);
  background: var(--paper);
}

.search:focus-within {
  outline: 3px solid var(--focus);
  outline-offset: 2px;
}

.search input {
  flex: 1;
  width: 100%;
  min-width: 0;
  border: none;
  background: transparent;
  outline: none;
  font-size: 1rem;
  min-height: 44px;
}

.search input::placeholder {
  color: var(--ink-3);
}

.sort {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-height: 48px;
  padding-left: 0.9rem;
  border: 2px solid var(--ink);
}

.sort:focus-within {
  outline: 3px solid var(--focus);
  outline-offset: 2px;
}

.sort-label {
  font-weight: 700;
  font-size: 0.9rem;
}

.sort select {
  appearance: none;
  border: none;
  outline: none;
  background: transparent
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%23888' stroke-width='2'/%3E%3C/svg%3E")
    no-repeat right 0.8rem center;
  padding: 0 2.2rem 0 0.25rem;
  min-height: 44px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
}

.sort select option {
  background: var(--paper);
  color: var(--ink);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip {
  min-height: 40px;
  padding: 0 1rem;
  border: 2px solid var(--ink);
  font-weight: 600;
  font-size: 0.9rem;
  transition: var(--transition-fast);
}

.chip.is-on {
  background: var(--ink);
  color: var(--paper);
}

@media (min-width: 960px) {
  .toolbar {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .controls {
    justify-content: flex-end;
  }

  .search {
    flex: 0 1 320px;
  }

  .chips {
    grid-column: 1 / -1;
  }
}

.sheet-wrap {
  max-width: var(--container-max);
  margin: 0 auto;
}

.state {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
  padding-top: 3rem;
  padding-bottom: 3rem;
  font-size: 1.15rem;
  font-weight: 600;
}

/* How we work */
.how {
  padding-bottom: clamp(3rem, 7vw, 6rem);
}

.statement {
  font-stretch: var(--semi-wide);
  font-weight: 750;
  font-size: clamp(2rem, 4.6vw, 4rem);
  line-height: 1.08;
  letter-spacing: -0.035em;
  max-width: 22ch;
  padding-top: clamp(1.5rem, 3vw, 2.5rem);
  margin-bottom: 2rem;
  border-top: 2px solid var(--rule);
  text-wrap: pretty;
}
</style>

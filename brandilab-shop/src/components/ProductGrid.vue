<template>
  <section class="product-grid-section">
    <slot name="header"></slot>

    <div v-if="loading" class="grid-container" :class="{ 'is-horizontal': horizontalOnMobile }">
      <div v-for="n in 8" :key="n" class="skeleton-card">
        <div class="skeleton-image"></div>
        <div class="skeleton-content">
          <div class="skeleton-stars"></div>
          <div class="skeleton-title"></div>
          <div class="skeleton-price"></div>
          <div class="skeleton-badge"></div>
          <div class="skeleton-swatches"></div>
          <div class="skeleton-button"></div>
        </div>
      </div>
    </div>

    <div v-else-if="products.length === 0" class="empty-state">
      <p>{{ t('product.empty') }}</p>
    </div>

    <div v-else class="grid-container" :class="{ 'is-horizontal': horizontalOnMobile }">
      <ProductCard 
        v-for="product in products" 
        :key="product._id" 
        :product="product" 
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Product } from '@/types'
import { useI18n } from 'vue-i18n'
import ProductCard from './ProductCard.vue'

const { t } = useI18n()

withDefaults(defineProps<{
  products: Product[]
  loading?: boolean
  horizontalOnMobile?: boolean
}>(), {
  loading: false,
  horizontalOnMobile: false
})
</script>

<style scoped>
.product-grid-section {
  width: 100%;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

@media (max-width: 639px) {
  .grid-container.is-horizontal {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    gap: 1rem;
    padding-bottom: 1rem;
    scrollbar-width: none; /* Firefox */
    align-items: stretch;
  }
  
  .grid-container.is-horizontal::-webkit-scrollbar {
    display: none; /* Chrome, Safari */
  }

  .grid-container.is-horizontal > * {
    flex: 0 0 75%;
    scroll-snap-align: start;
    height: auto; /* Allow stretch */
  }
}


@media (min-width: 640px) {
  .grid-container {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 768px) {
  .grid-container {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid-container {
    grid-template-columns: repeat(4, 1fr);
    gap: 1.25rem;
  }
}

@media (min-width: 1400px) {
  .grid-container {
    grid-template-columns: repeat(4, 1fr);
  }
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--color-text-light);
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

/* Skeleton Loading Animation */
.skeleton-card {
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
}

.skeleton-image {
  aspect-ratio: 1 / 1;
  background-color: var(--color-skeleton);
  animation: pulse 1.5s infinite ease-in-out;
}

.skeleton-content {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex-grow: 1;
}

.skeleton-stars {
  height: 0.875rem;
  width: 60%;
  background-color: var(--color-skeleton);
  border-radius: var(--radius-sm);
  animation: pulse 1.5s infinite ease-in-out;
}

.skeleton-title {
  height: 1rem;
  width: 80%;
  background-color: var(--color-skeleton);
  border-radius: var(--radius-sm);
  animation: pulse 1.5s infinite ease-in-out;
}

.skeleton-price {
  height: 1.25rem;
  width: 35%;
  background-color: var(--color-skeleton);
  border-radius: var(--radius-sm);
  animation: pulse 1.5s infinite ease-in-out;
}

.skeleton-badge {
  height: 1rem;
  width: 45%;
  background-color: var(--color-skeleton);
  border-radius: var(--radius-full);
  animation: pulse 1.5s infinite ease-in-out;
}

.skeleton-swatches {
  height: 1.25rem;
  width: 40%;
  background-color: var(--color-skeleton);
  border-radius: var(--radius-sm);
  animation: pulse 1.5s infinite ease-in-out;
}

.skeleton-button {
  height: 2.25rem;
  width: 100%;
  background-color: var(--color-skeleton);
  border-radius: var(--radius-sm);
  animation: pulse 1.5s infinite ease-in-out;
  margin-top: auto;
}

@keyframes pulse {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.6;
  }
}
</style>

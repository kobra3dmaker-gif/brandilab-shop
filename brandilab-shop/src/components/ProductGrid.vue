<template>
  <section class="product-grid-section">
    <slot name="header"></slot>

    <div v-if="loading" class="grid-container">
      <div v-for="n in 4" :key="n" class="skeleton-card">
        <div class="skeleton-image"></div>
        <div class="skeleton-content">
          <div class="skeleton-title"></div>
          <div class="skeleton-price"></div>
          <div class="skeleton-button"></div>
        </div>
      </div>
    </div>

    <div v-else-if="products.length === 0" class="empty-state">
      <p>No products found.</p>
    </div>

    <div v-else class="grid-container">
      <ProductCard 
        v-for="product in products" 
        :key="product.id" 
        :product="product" 
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Product } from '@/types'
import ProductCard from './ProductCard.vue'

withDefaults(defineProps<{
  products: Product[]
  loading?: boolean
}>(), {
  loading: false
})
</script>

<style scoped>
.product-grid-section {
  width: 100%;
}

.grid-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 768px) {
  .grid-container {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid-container {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1280px) {
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
  background-color: #e2e8f0;
  animation: pulse 1.5s infinite ease-in-out;
}

.skeleton-content {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex-grow: 1;
}

.skeleton-title {
  height: 1.25rem;
  width: 75%;
  background-color: #e2e8f0;
  border-radius: var(--radius-sm);
  animation: pulse 1.5s infinite ease-in-out;
}

.skeleton-price {
  height: 1.5rem;
  width: 40%;
  background-color: #e2e8f0;
  border-radius: var(--radius-sm);
  animation: pulse 1.5s infinite ease-in-out;
  margin-top: auto;
}

.skeleton-button {
  height: 2.5rem;
  width: 100%;
  background-color: #e2e8f0;
  border-radius: var(--radius-sm);
  animation: pulse 1.5s infinite ease-in-out;
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

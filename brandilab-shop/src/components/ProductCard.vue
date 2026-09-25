<template>
  <div class="product-card">
    <router-link :to="`/product/${product.id}`" class="card-link">
      <div class="image-container">
        <img :src="product.image" :alt="product.name" class="product-image" loading="lazy" />
      </div>
      <div class="card-content">
        <div class="header">
          <h3 class="product-name">{{ product.name }}</h3>
          <span class="material-tag" v-if="product.material">{{ product.material }}</span>
        </div>
        <p class="product-price">€{{ product.price.toFixed(2) }}</p>
      </div>
    </router-link>
    <div class="card-actions">
      <button
        class="snipcart-add-item add-to-cart-btn"
        :data-item-id="product.id"
        :data-item-price="product.price"
        :data-item-url="`/product/${product.id}`"
        data-item-url="/product-validation.html"
        :data-item-description="product.description"
        :data-item-image="product.image"
        :data-item-name="product.name"
      >
        Add to Cart
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Product } from '@/types'

defineProps<{
  product: Product
}>()
</script>

<style scoped>
.product-card {
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: var(--transition);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.card-link {
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.image-container {
  overflow: hidden;
  aspect-ratio: 1 / 1;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.product-card:hover .product-image {
  transform: scale(1.05);
}

.card-content {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
  gap: 0.5rem;
}

.product-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
  line-height: 1.4;
}

.material-tag {
  background-color: var(--color-bg);
  color: var(--color-text-light);
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-weight: 500;
  border: 1px solid var(--color-border);
  white-space: nowrap;
}

.product-price {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-accent);
  margin-top: auto;
}

.card-actions {
  padding: 0 1.25rem 1.25rem 1.25rem;
}

.add-to-cart-btn {
  width: 100%;
  background-color: var(--color-accent);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  padding: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}

.add-to-cart-btn:hover {
  background-color: var(--color-accent-hover);
}
</style>

<script setup lang="ts">
import type { Product } from '@/types'
import { useI18n } from 'vue-i18n'
import { urlFor } from '@/sanity'
import { useCart } from '@/composables/useCart'
import { computed } from 'vue'

const props = defineProps<{
  product: Product
}>()

const { t, n } = useI18n()
const { addItem } = useCart()

// Deterministic hash function for pseudo-random effects
const hashStr = (str: string) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

const rating = computed(() => {
  const hash = hashStr(props.product._id || '')
  return 4.0 + (hash % 11) / 10 // 4.0 to 5.0
})

const fullStars = computed(() => Math.round(rating.value))

const reviewCount = computed(() => {
  const hash = hashStr((props.product._id || '') + 'reviews')
  return 30 + (hash % 31) // 30 to 60
})

const showNewBadge = computed(() => {
  const hash = hashStr((props.product._id || '') + 'new')
  return (hash % 100) < 40 // ~40% chance
})

const swatches = computed(() => {
  const base = props.product.color?.toLowerCase()
  const defaultColors = ['#1a1a1a', '#808080', '#e6e6e6']
  if (base) {
    return [base, ...defaultColors].slice(0, 3)
  }
  return defaultColors
})
</script>

<template>
  <div class="product-card">
    <router-link :to="`/product/${product._id}`" class="image-link">
      <div class="image-container">
        <img 
          v-if="product.image"
          :src="urlFor(product.image).width(400).url()" 
          :alt="product.title"
          class="product-image"
          loading="lazy"
        />
      </div>
    </router-link>

    <div class="card-content">
      <div class="rating-container">
        <div class="stars">
          <span 
            v-for="i in 5" 
            :key="i"
            class="star"
            :class="{ filled: i <= fullStars }"
          >
            {{ i <= fullStars ? '★' : '☆' }}
          </span>
        </div>
        <span class="review-count">({{ reviewCount }})</span>
      </div>

      <router-link :to="`/product/${product._id}`" class="title-link">
        <h3 class="product-title" :title="product.title">{{ product.title }}</h3>
      </router-link>

      <div class="price">
        {{ n(product.price, 'currency') }}
      </div>

      <div class="badges">
        <span v-if="product.featured" class="badge bestseller">
          {{ t('product.bestseller') }}
        </span>
        <span v-else-if="showNewBadge" class="badge new-item">
          {{ t('product.new') }}
        </span>
      </div>

      <div class="swatches">
        <div 
          v-for="(color, index) in swatches" 
          :key="index"
          class="swatch"
          :style="{ backgroundColor: color }"
        ></div>
      </div>

      <button
        class="add-to-cart-btn"
        @click="addItem(product)"
      >
        <span class="btn-text">{{ t('product.addToCart') }}</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="cart-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9" cy="21" r="1"/>
          <circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.product-card {
  background-color: var(--color-surface, #ffffff);
  border-radius: var(--radius-md, 8px);
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.1));
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0,0,0,0.1));
}

.image-link {
  display: block;
}

.image-container {
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background-color: #f8f8f8;
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
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: 0.5rem;
}

.rating-container {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.85rem;
}

.stars {
  display: inline-flex;
}

.star {
  color: #ccc;
  line-height: 1;
}

.star.filled {
  color: #ffc107;
}

.review-count {
  color: #666;
  font-size: 0.8rem;
}

.title-link {
  text-decoration: none;
  color: inherit;
}

.product-title {
  margin: 0;
  font-weight: 500;
  font-size: 0.9rem;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.price {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-accent, #008080);
  margin-top: auto;
}

.badges {
  min-height: 1.25rem; /* Reserve space if empty */
  display: flex;
  align-items: center;
}

.badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #fff;
}

.bestseller {
  background-color: #ffc107; /* golden/amber */
}

.new-item {
  background-color: var(--color-accent, #008080); /* teal */
}

.swatches {
  display: flex;
  gap: 0.35rem;
  margin: 0.25rem 0;
}

.swatch {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid rgba(0,0,0,0.15);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);
}

.add-to-cart-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.6rem;
  background-color: var(--color-accent, #008080);
  color: #ffffff;
  border: none;
  border-radius: var(--radius-md, 8px);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-top: 0.5rem;
}

.add-to-cart-btn:hover {
  background-color: #006666;
}

.cart-icon {
  flex-shrink: 0;
}
</style>

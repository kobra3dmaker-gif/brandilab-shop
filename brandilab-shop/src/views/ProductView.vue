<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useProducts } from '@/composables/useProducts'
import ProductGrid from '@/components/ProductGrid.vue'

const route = useRoute()
const { getProductById, products } = useProducts()

const productId = route.params.id as string
const product = computed(() => getProductById(productId))

const quantity = ref(1)

const decreaseQuantity = () => {
  if (quantity.value > 1) quantity.value--
}

const increaseQuantity = () => {
  quantity.value++
}

const totalPrice = computed(() => {
  if (product.value) {
    return (product.value.price * quantity.value).toFixed(2)
  }
  return '0.00'
})

const recommendedProducts = computed(() => {
  return products.value.filter(p => p.id !== productId).slice(0, 4)
})
</script>

<template>
  <main class="product-view">
    <div class="container" v-if="product">
      <nav class="breadcrumb">
        <RouterLink to="/">Home</RouterLink>
        <span class="separator">/</span>
        <RouterLink to="/shop">Shop</RouterLink>
        <span class="separator">/</span>
        <span class="current">{{ product.name }}</span>
      </nav>

      <div class="product-layout">
        <div class="product-image-container">
          <img :src="product.image" :alt="product.name" class="product-image" />
        </div>

        <div class="product-details">
          <h1 class="product-name">{{ product.name }}</h1>
          <div class="product-material">{{ product.material }}</div>
          <div class="product-price">€{{ product.price.toFixed(2) }}</div>
          <p class="product-description">{{ product.description }}</p>

          <div class="purchase-actions">
            <div class="quantity-selector">
              <button class="qty-btn" @click="decreaseQuantity">-</button>
              <span class="qty-display">{{ quantity }}</span>
              <button class="qty-btn" @click="increaseQuantity">+</button>
            </div>
            
            <button 
              class="snipcart-add-item btn btn-add"
              :data-item-id="product.id"
              :data-item-price="product.price"
              :data-item-url="`/product/${product.id}`"
              data-item-url="/product-validation.html"
              :data-item-description="product.description"
              :data-item-image="product.image"
              :data-item-name="product.name"
              :data-item-quantity="quantity"
            >
              Add to Cart - €{{ totalPrice }}
            </button>
          </div>
        </div>
      </div>

      <section class="recommended-section" v-if="recommendedProducts.length > 0">
        <h2 class="section-title">You May Also Like</h2>
        <ProductGrid :products="recommendedProducts" />
      </section>
    </div>
    
    <div class="container not-found" v-else>
      <h2>Product not found</h2>
      <RouterLink to="/shop" class="btn btn-primary">Back to Shop</RouterLink>
    </div>
  </main>
</template>

<style scoped>
.product-view {
  padding: 3rem 1rem 5rem;
  background-color: var(--color-bg);
  min-height: calc(100vh - var(--navbar-height));
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.breadcrumb {
  margin-bottom: 2rem;
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

.product-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 3rem;
  margin-bottom: 5rem;
}

@media (min-width: 768px) {
  .product-layout {
    grid-template-columns: 1fr 1fr;
  }
}

.product-image-container {
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.product-image {
  width: 100%;
  height: auto;
  max-height: 500px;
  object-fit: contain;
}

.product-details {
  display: flex;
  flex-direction: column;
}

.product-name {
  font-size: 2.5rem;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
}

.product-material {
  display: inline-block;
  background-color: var(--color-border);
  color: var(--color-text);
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  align-self: flex-start;
}

.product-price {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-accent);
  margin-bottom: 1.5rem;
}

.product-description {
  color: var(--color-text-light);
  line-height: 1.6;
  margin-bottom: 2.5rem;
  font-size: 1.1rem;
}

.purchase-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: auto;
}

.quantity-selector {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  width: max-content;
  background-color: var(--color-surface);
}

.qty-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  color: var(--color-text);
  transition: var(--transition);
}

.qty-btn:hover {
  color: var(--color-accent);
}

.qty-display {
  padding: 0 1rem;
  font-weight: 600;
  min-width: 3rem;
  text-align: center;
}

.btn {
  display: inline-block;
  padding: 1rem 2rem;
  border-radius: var(--radius-sm);
  font-weight: 600;
  text-align: center;
  text-decoration: none;
  transition: var(--transition);
  cursor: pointer;
  border: none;
  font-size: 1.1rem;
}

.btn-add {
  background-color: var(--color-accent);
  color: white;
  width: 100%;
}

.btn-add:hover {
  background-color: var(--color-accent-hover);
}

.btn-primary {
  background-color: var(--color-accent);
  color: white;
  margin-top: 1rem;
}

.recommended-section {
  padding-top: 3rem;
  border-top: 1px solid var(--color-border);
}

.section-title {
  text-align: center;
  font-size: 2rem;
  margin-bottom: 2rem;
  color: var(--color-primary);
}

.not-found {
  text-align: center;
  padding: 5rem 0;
}

.not-found h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: var(--color-primary);
}
</style>

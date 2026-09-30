<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useProducts } from '@/composables/useProducts'
import { urlFor } from '@/sanity'
import { trackEvent } from '@/analytics'
import { SNIPCART_PRODUCTS_URL } from '@/snipcart'
import ProductGrid from '@/components/ProductGrid.vue'

const route = useRoute()
const { t, n } = useI18n()
const { getProductById, products } = useProducts()

const productId = computed(() => route.params.id as string)
const product = computed(() => getProductById(productId.value))

const quantity = ref(1)
watch(productId, () => {
  quantity.value = 1
})

watch(
  product,
  (p) => {
    if (!p) return
    trackEvent('view_item', {
      currency: 'EUR',
      value: p.price,
      items: [{ item_id: p._id, item_name: p.title, price: p.price }],
    })
  },
  { immediate: true },
)

const decreaseQuantity = () => {
  if (quantity.value > 1) quantity.value--
}

const increaseQuantity = () => {
  quantity.value++
}

const totalPrice = computed(() => (product.value ? product.value.price * quantity.value : 0))

const recommendedProducts = computed(() => {
  return products.value.filter(p => p._id !== productId.value).slice(0, 4)
})
</script>

<template>
  <main class="product-view">
    <div class="container" v-if="product">
      <nav class="breadcrumb">
        <RouterLink to="/">{{ t('nav.home') }}</RouterLink>
        <span class="separator">›</span>
        <span class="current">{{ product.title }}</span>
      </nav>

      <div class="product-layout-amazon">
        <!-- Image Column -->
        <div class="product-image-col">
          <div class="main-image-wrapper">
            <img :src="urlFor(product.image).width(600).url()" :alt="product.title" class="product-image" />
          </div>
        </div>

        <!-- Info Column -->
        <div class="product-info-col">
          <h1 class="product-name">{{ product.title }}</h1>
          <div class="brand-link">BrandiLab Store</div>
          <div class="product-rating">
            <span class="stars">⭐⭐⭐⭐⭐</span> <span class="rating-count">4.9 / 5</span>
          </div>
          <hr class="divider" />
          
          <div class="price-section">
            <span class="price-symbol">€</span>
            <span class="price-whole">{{ Math.floor(product.price) }}</span>
            <span class="price-fraction">{{ (product.price % 1).toFixed(2).substring(2) }}</span>
          </div>

          <div class="product-material" v-if="product.material">
            <strong>Materiale:</strong> {{ product.material }}
          </div>
          
          <div class="product-category" v-if="product.category">
            <strong>Categoria:</strong> {{ product.category }}
          </div>

          <div class="product-color" v-if="product.color">
            <strong>Colore:</strong> {{ product.color }}
          </div>
          
          <hr class="divider" />
          
          <h3>Informazioni su questo articolo</h3>
          <p class="product-description">{{ product.description }}</p>
        </div>

        <!-- Buy Box Column -->
        <div class="product-buy-box">
          <div class="buy-box-price">{{ n(product.price, 'currency') }}</div>
          <div class="delivery-info">
            Spedizione <strong>GRATUITA</strong> disponibile per ordini idonei.
          </div>
          <div class="stock-status">Disponibilità immediata.</div>
          
          <div class="quantity-wrapper">
            <label for="quantity">Quantità: </label>
            <div class="quantity-selector">
              <button class="qty-btn" @click="decreaseQuantity" :aria-label="t('product.decrease')">-</button>
              <span class="qty-display">{{ quantity }}</span>
              <button class="qty-btn" @click="increaseQuantity" :aria-label="t('product.increase')">+</button>
            </div>
          </div>
          
          <button 
            class="snipcart-add-item btn btn-add"
            :data-item-id="product._id"
            :data-item-price="product.price"
            :data-item-url="SNIPCART_PRODUCTS_URL"
            :data-item-description="product.description.length > 120 ? product.description.substring(0, 120) + '...' : product.description"
            :data-item-image="urlFor(product.image).width(100).url()"
            :data-item-name="product.title"
            :data-item-quantity="quantity"
          >
            Aggiungi al carrello
          </button>
          
          <div class="secure-transaction">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lock-icon"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            Transazione sicura
          </div>
          
          <div class="seller-info">
            <div class="seller-row">
              <span class="seller-label">Spedito da</span>
              <span class="seller-value">BrandiLab</span>
            </div>
            <div class="seller-row">
              <span class="seller-label">Venduto da</span>
              <span class="seller-value">BrandiLab</span>
            </div>
          </div>
        </div>
      </div>

      <section class="recommended-section" v-if="recommendedProducts.length > 0">
        <h2 class="section-title">{{ t('product.youMayAlsoLike') }}</h2>
        <ProductGrid :products="recommendedProducts" />
      </section>
    </div>
    
    <div class="container not-found" v-else>
      <h2>{{ t('product.notFound') }}</h2>
      <RouterLink to="/" class="btn btn-primary">{{ t('product.backToShop') }}</RouterLink>
    </div>
  </main>
</template>

<style scoped>
.product-view {
  padding: 2rem 1rem 5rem;
  background-color: var(--color-bg);
  min-height: calc(100vh - var(--navbar-height));
}

.container {
  max-width: 1300px;
  margin: 0 auto;
}

.breadcrumb {
  margin-bottom: 1rem;
  font-size: 0.85rem;
  color: var(--color-text-light);
}

.breadcrumb a {
  color: var(--color-text-light);
  text-decoration: none;
}

.breadcrumb a:hover {
  text-decoration: underline;
}

.separator {
  margin: 0 0.5rem;
}

.current {
  color: var(--color-text);
}

.product-layout-amazon {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-bottom: 4rem;
}

@media (min-width: 1024px) {
  .product-layout-amazon {
    flex-direction: row;
    align-items: flex-start;
  }

  .product-image-col {
    flex: 0 0 40%;
    position: sticky;
    top: calc(var(--navbar-height) + 1rem);
  }

  .product-info-col {
    flex: 1;
    min-width: 0;
  }

  .product-buy-box {
    flex: 0 0 280px;
    position: sticky;
    top: calc(var(--navbar-height) + 1rem);
  }
}

.main-image-wrapper {
  background: var(--color-surface);
  padding: 2rem;
  text-align: center;
}

.product-image {
  max-width: 100%;
  max-height: 500px;
  object-fit: contain;
  margin: 0 auto;
}

.product-name {
  font-size: 1.5rem;
  font-weight: 500;
  line-height: 1.3;
  color: var(--color-primary);
  margin-bottom: 0.25rem;
}

.brand-link {
  color: var(--color-accent);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
}

.brand-link:hover {
  text-decoration: underline;
}

.product-rating {
  font-size: 0.9rem;
  color: var(--color-text-light);
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.divider {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: 1rem 0;
}

.price-section {
  display: flex;
  align-items: flex-start;
  color: var(--color-danger);
  margin-bottom: 1rem;
}

.price-symbol {
  font-size: 1rem;
  margin-top: 0.2rem;
}

.price-whole {
  font-size: 2rem;
  font-weight: 500;
  line-height: 1;
}

.price-fraction {
  font-size: 1rem;
  margin-top: 0.2rem;
}

.product-material, .product-category, .product-color {
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
  color: var(--color-text);
}

.product-description {
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--color-text);
  white-space: pre-wrap;
}

.product-info-col h3 {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  color: var(--color-primary);
}

.product-buy-box {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 1rem;
  background: var(--color-surface);
}

.buy-box-price {
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
}

.delivery-info {
  font-size: 0.85rem;
  color: var(--color-text);
  margin-bottom: 1rem;
  line-height: 1.4;
}

.stock-status {
  color: var(--color-success);
  font-size: 1.1rem;
  font-weight: 500;
  margin-bottom: 1rem;
}

.quantity-wrapper {
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.quantity-selector {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  margin-left: 0.5rem;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.qty-btn {
  background: var(--color-bg);
  border: none;
  font-size: 1.1rem;
  padding: 0.2rem 0.6rem;
  cursor: pointer;
  color: var(--color-text);
}

.qty-btn:hover {
  background: var(--color-border);
}

.qty-display {
  padding: 0 1rem;
  font-weight: 500;
}

.btn-add {
  background-color: #ffd814;
  color: #0f1111;
  border: 1px solid #fcd200;
  border-radius: 100px;
  width: 100%;
  padding: 0.6rem;
  font-size: 0.95rem;
  font-weight: 400;
  box-shadow: 0 2px 5px rgba(213,217,217,.5);
}

.btn-add:hover {
  background-color: #f7ca00;
  border-color: #f2c200;
  transform: none;
}

/* Dark mode adjustment for buy button */
:root[data-theme='dark'] .btn-add {
  background-color: var(--color-accent);
  color: white;
  border-color: var(--color-accent);
}
:root[data-theme='dark'] .btn-add:hover {
  background-color: var(--color-accent-hover);
}

.secure-transaction {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-light);
  font-size: 0.85rem;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.seller-info {
  font-size: 0.85rem;
}

.seller-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}

.seller-label {
  color: var(--color-text-light);
}

.seller-value {
  color: var(--color-text);
  font-weight: 500;
}

.recommended-section {
  padding-top: 2rem;
  border-top: 1px solid var(--color-border);
}

.section-title {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: var(--color-primary);
}

.not-found {
  text-align: center;
  padding: 5rem 0;
}
</style>

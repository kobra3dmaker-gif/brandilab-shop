<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useProducts } from '@/composables/useProducts'
import { useCart } from '@/composables/useCart'
import { useCatalog, flyToCart, imageSrc, imageSrcset } from '@/composables/useCatalog'
import { trackEvent } from '@/analytics'
import ProductGrid from '@/components/ProductGrid.vue'
import { parseDescription } from '@/utils/description'

const route = useRoute()
const { t, n } = useI18n()
const { getProductById, products, loading } = useProducts()
const { addItem } = useCart()
const { fieldOf } = useCatalog()

const productId = computed(() => route.params.id as string)
const product = computed(() => getProductById(productId.value))
const field = computed(() => (product.value ? fieldOf(product.value) : 'light'))

const quantity = ref(1)
const isAdded = ref(false)
const plate = ref<HTMLImageElement | null>(null)
const buyButton = ref<HTMLButtonElement | null>(null)
const showBar = ref(false)
let addedTimer: ReturnType<typeof setTimeout> | undefined
let observer: IntersectionObserver | null = null

watch(productId, () => {
  quantity.value = 1
  isAdded.value = false
})

watch(
  product,
  (p) => {
    if (!p) return
    document.title = `${p.title} — BrandiLab`
    trackEvent('view_item', {
      currency: 'EUR',
      value: p.price,
      items: [{ item_id: p._id, item_name: p.title, price: p.price }],
    })
  },
  { immediate: true },
)

const description = computed(() => parseDescription(product.value?.description))

const total = computed(() => (product.value ? product.value.price * quantity.value : 0))

const moreProducts = computed(() => products.value.filter((p) => p._id !== productId.value).slice(0, 4))

function add() {
  if (!product.value) return
  addItem(product.value, quantity.value)
  flyToCart(plate.value, field.value)
  isAdded.value = true
  clearTimeout(addedTimer)
  addedTimer = setTimeout(() => (isAdded.value = false), 1600)
}

function observeBuyButton() {
  observer?.disconnect()
  if (!buyButton.value || typeof IntersectionObserver === 'undefined') return
  observer = new IntersectionObserver(([entry]) => {
    showBar.value = !!entry && !entry.isIntersecting && entry.boundingClientRect.top < 0
  })
  observer.observe(buyButton.value)
}

watch(product, async (p) => {
  if (!p) return
  await nextTick()
  observeBuyButton()
})

onMounted(() => {
  if (product.value) observeBuyButton()
})

onUnmounted(() => {
  observer?.disconnect()
  clearTimeout(addedTimer)
})
</script>

<template>
  <main class="product-page">
    <div v-if="loading && !product" class="spread" aria-busy="true">
      <div class="plate-field f-light"><div class="plate-skeleton" /></div>
      <div class="sheet"><div class="line-skeleton" /></div>
    </div>

    <template v-else-if="product">
      <article :key="productId" class="spread">
        <div class="plate-field" :class="`f-${field}`">
          <img
            ref="plate"
            class="plate"
            :src="imageSrc(product, 1200)"
            :srcset="imageSrcset(product, [600, 900, 1200, 1600, 2000])"
            sizes="(min-width: 960px) 56vw, 100vw"
            :alt="product.title"
            fetchpriority="high"
            decoding="async"
          />
        </div>

        <div class="sheet">
          <nav class="crumbs" aria-label="Breadcrumb">
            <RouterLink :to="{ path: '/', hash: '#catalogo' }">{{ t('nav.catalogue') }}</RouterLink>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{{ product.title }}</span>
          </nav>

          <h1 class="name display">{{ product.title }}</h1>
          <p class="price tabular">{{ n(product.price, 'currency') }}</p>
          <p v-if="product.featured" class="pick">{{ t('product.featured') }}</p>

          <div class="buy">
            <div class="qty" role="group" :aria-label="t('product.quantity')">
              <button :aria-label="t('product.decrease')" :disabled="quantity <= 1" @click="quantity > 1 && quantity--">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" aria-hidden="true"><path d="M5 12h14" /></svg>
              </button>
              <output class="tabular" aria-live="polite">{{ quantity }}</output>
              <button :aria-label="t('product.increase')" :disabled="quantity >= 20" @click="quantity < 20 && quantity++">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
              </button>
            </div>

            <button ref="buyButton" class="add" :class="{ 'is-added': isAdded }" :aria-label="isAdded ? undefined : t('product.addToCart')" @click="add">
              <span class="add-label" :key="String(isAdded)">
                <svg v-if="isAdded" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" aria-hidden="true"><path d="M4.5 12.5l5 5 10-11" /></svg>
                <template v-if="isAdded">{{ t('product.added') }}</template>
                <template v-else>
                  <span class="label-long">{{ t('product.addToCart') }}</span>
                  <span class="label-short" aria-hidden="true">{{ t('product.add') }}</span>
                </template>
              </span>
            </button>
          </div>
          <p v-if="quantity > 1" class="total tabular">{{ t('product.total') }}: {{ n(total, 'currency') }}</p>

          <section class="specs" :aria-label="t('product.specsTitle')">
            <h2 class="specs-title">{{ t('product.specsTitle') }}</h2>
            <dl>
              <div>
                <dt>{{ t('product.made') }}</dt>
                <dd>{{ t('product.madeValue') }}</dd>
              </div>
              <div>
                <dt>{{ t('product.delivery') }}</dt>
                <dd>{{ t('product.deliveryValue') }}</dd>
              </div>
              <div v-if="product.material">
                <dt>{{ t('product.material') }}</dt>
                <dd>{{ product.material }}</dd>
              </div>
              <div v-if="product.color">
                <dt>{{ t('product.color') }}</dt>
                <dd>{{ product.color }}</dd>
              </div>
              <div v-if="product.category">
                <dt>{{ t('product.category') }}</dt>
                <dd>{{ product.category }}</dd>
              </div>
              <div>
                <dt>{{ t('product.payment') }}</dt>
                <dd>{{ t('product.paymentValue') }}</dd>
              </div>
            </dl>
          </section>

          <p class="custom">
            {{ t('product.customNote') }}
            <RouterLink :to="{ path: '/contact', query: { type: 'custom', product: product.title } }">{{ t('product.customLink') }}</RouterLink>
          </p>

          <div v-if="description.length" class="description">
            <template v-for="(block, i) in description" :key="i">
              <p v-if="block.type === 'lead'" class="lead">{{ block.text }}</p>
              <p v-else-if="block.type === 'p'">{{ block.text }}</p>
              <h3 v-else-if="block.type === 'heading'">{{ block.text }}</h3>
              <hr v-else-if="block.type === 'rule'" />
              <ul v-else-if="block.type === 'list'">
                <li v-for="(item, j) in block.items" :key="j">
                  <strong v-if="item.label">{{ item.label }}:</strong>
                  {{ item.text }}
                </li>
              </ul>
            </template>
          </div>
        </div>
      </article>

      <section v-if="moreProducts.length" class="more" aria-labelledby="more-title">
        <h2 id="more-title" class="more-title display container">{{ t('product.youMayAlsoLike') }}</h2>
        <div class="more-sheet" :key="productId">
          <ProductGrid :products="moreProducts" variant="strip" />
        </div>
      </section>

      <Transition name="bar">
        <div v-if="showBar" class="buy-bar">
          <div class="bar-text">
            <span class="bar-name">{{ product.title }}</span>
            <span class="bar-price tabular">{{ n(total, 'currency') }}</span>
          </div>
          <button class="add" :class="{ 'is-added': isAdded }" @click="add">
            {{ isAdded ? t('product.added') : t('product.add') }}
          </button>
        </div>
      </Transition>
    </template>

    <div v-else class="missing container">
      <h1 class="display">{{ t('product.notFound') }}</h1>
      <p>{{ t('product.notFoundText') }}</p>
      <RouterLink :to="{ path: '/', hash: '#catalogo' }" class="btn btn-ink">{{ t('product.backToShop') }}</RouterLink>
    </div>
  </main>
</template>

<style scoped>
.product-page {
  --f-bg: var(--tile-light);
  --f-ink: var(--on-tile-light);
}

.f-light {
  --f-bg: var(--tile-light);
  --f-ink: var(--on-tile-light);
}

.f-dark {
  --f-bg: var(--tile-dark);
  --f-ink: var(--on-tile-dark);
}

.spread {
  max-width: var(--container-max);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
}

.plate-field {
  background: var(--f-bg);
  padding: clamp(1rem, 3vw, 2.5rem);
}

.plate {
  width: 100%;
  aspect-ratio: 4 / 5;
  object-fit: cover;
  background: color-mix(in srgb, var(--f-ink) 12%, var(--f-bg));
}

.plate-field {
  overflow: clip;
}

.plate-field .plate {
  animation: settle 1.4s var(--ease-apple) both;
}

.sheet > * {
  animation: rise 0.9s var(--ease-apple) both;
}

.sheet > :nth-child(2) {
  animation-delay: 60ms;
}

.sheet > :nth-child(3) {
  animation-delay: 120ms;
}

.sheet > :nth-child(4) {
  animation-delay: 180ms;
}

.sheet > :nth-child(5) {
  animation-delay: 240ms;
}

.sheet > :nth-child(n + 6) {
  animation-delay: 300ms;
}

.plate-skeleton {
  aspect-ratio: 4 / 5;
  background: rgba(134, 134, 139, 0.18);
}

.line-skeleton {
  height: 3rem;
  width: 70%;
  background: var(--paper-2);
}

.sheet {
  padding: clamp(1.25rem, 3vw, 2.5rem) var(--gutter) 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

@media (min-width: 960px) {
  .spread {
    grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
    align-items: start;
  }

  .plate-field {
    position: sticky;
    top: var(--navbar-height);
  }

  .plate {
    max-height: calc(100svh - var(--navbar-height) - 5rem);
  }

  .sheet {
    padding-left: clamp(1.5rem, 3.5vw, 3.5rem);
    padding-top: 2.5rem;
  }
}

.crumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--ink-2);
}

.crumbs a {
  font-weight: 600;
  color: var(--ink);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.crumbs [aria-current] {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 28ch;
}

.pick {
  align-self: flex-start;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.25rem 0.55rem;
  background: var(--paper-2);
  color: var(--ink);
}

.name {
  font-size: clamp(2.25rem, 4.6vw, 4.5rem);
  overflow-wrap: anywhere;
}

.price {
  font-stretch: var(--wide);
  font-weight: 800;
  font-size: clamp(1.75rem, 3vw, 2.6rem);
  letter-spacing: -0.03em;
}

.buy {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.qty {
  display: flex;
  align-items: stretch;
  border: 2px solid var(--ink);
  flex-shrink: 0;
}

.qty button {
  width: 48px;
  display: grid;
  place-items: center;
  transition: background-color 0.15s ease;
}

.qty button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

@media (hover: hover) and (pointer: fine) {
  .qty button:hover:not(:disabled) {
    background: var(--paper-2);
  }
}

.qty output {
  min-width: 2.5rem;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 1.1rem;
}

.add {
  flex: 1;
  min-height: 56px;
  padding: 0 1.5rem;
  background: var(--blue);
  color: var(--on-blue);
  font-weight: 800;
  font-stretch: var(--semi-wide);
  font-size: 1.08rem;
  transition:
    transform 160ms var(--ease-out),
    background-color 0.2s ease,
    color 0.2s ease;
}

@media (hover: hover) and (pointer: fine) {
  .add:hover:not(.is-added) {
    background: var(--blue-hover);
  }
}

.add:active {
  transform: scale(0.97);
}

.label-short {
  display: none;
}

@media (max-width: 479px) {
  .label-long {
    display: none;
  }

  .label-short {
    display: inline;
  }
}

.add.is-added {
  background: var(--ink);
  color: var(--paper);
}

.add-label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  animation: label-in 220ms var(--ease-out);
}

@keyframes label-in {
  from {
    opacity: 0;
    filter: blur(3px);
    transform: translateY(3px);
  }
}

.total {
  font-weight: 600;
  color: var(--ink-2);
}

.description {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 62ch;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid var(--rule);
  color: var(--ink-2);
  line-height: 1.6;
}

.description .lead {
  font-stretch: var(--semi-wide);
  font-weight: 700;
  font-size: 1.15rem;
  line-height: 1.35;
  color: var(--ink);
}

.description h3 {
  margin-top: 0.75rem;
  font-stretch: var(--semi-wide);
  font-weight: 800;
  font-size: 1.05rem;
  color: var(--ink);
}

.description hr {
  border: none;
  border-top: 1px solid var(--rule-soft);
  margin: 0.5rem 0;
}

.description ul {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding-left: 1.1rem;
  list-style: square;
}

.description li::marker {
  color: var(--blue);
}

.description strong {
  color: var(--ink);
  font-weight: 700;
}

.specs {
  margin-top: 1rem;
}

.specs-title {
  font-stretch: var(--semi-wide);
  font-weight: 800;
  font-size: 1.1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--rule);
}

.specs dl > div {
  display: grid;
  grid-template-columns: minmax(7.5rem, 0.6fr) 1fr;
  gap: 1rem;
  padding: 0.7rem 0;
  border-bottom: 1px solid var(--rule-soft);
}

.specs dt {
  font-weight: 700;
}

.specs dd {
  color: var(--ink-2);
}

.custom {
  font-size: 0.95rem;
  color: var(--ink-2);
}

.custom a {
  display: inline-block;
  font-weight: 700;
  color: var(--ink);
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 3px;
}

/* More from the catalogue */
.more {
  margin-top: clamp(2rem, 5vw, 4rem);
}

.more-title {
  font-size: clamp(1.75rem, 3.4vw, 2.75rem);
  padding-top: 1.25rem;
  padding-bottom: 1.25rem;
  border-top: 2px solid var(--rule);
}

.more-sheet {
  max-width: var(--container-max);
  margin: 0 auto;
}

/* Mobile buy bar */
.buy-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 950;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.6rem var(--gutter) calc(0.6rem + env(safe-area-inset-bottom));
  background: var(--paper);
  border-top: 2px solid var(--rule);
}

.bar-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.bar-name {
  font-weight: 700;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bar-price {
  font-weight: 800;
  font-stretch: var(--wide);
}

.buy-bar .add {
  flex: 0 0 auto;
  min-height: 48px;
}

.bar-enter-active {
  transition: transform 0.26s var(--ease-drawer);
}

.bar-leave-active {
  transition: transform 0.16s ease;
}

.bar-enter-from,
.bar-leave-to {
  transform: translateY(100%);
}

@media (min-width: 960px) {
  .buy-bar {
    display: none;
  }
}

.missing {
  padding-top: 4rem;
  padding-bottom: 6rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.25rem;
}

.missing h1 {
  font-size: clamp(2rem, 5vw, 4rem);
  max-width: 18ch;
}

.missing p {
  color: var(--ink-2);
}

@media (prefers-reduced-motion: reduce) {
  .add-label {
    animation: none;
  }
}
</style>

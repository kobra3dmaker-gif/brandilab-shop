<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Product } from '@/types'
import { useCart } from '@/composables/useCart'
import { flyToCart, imageSrc, imageSrcset, type Field } from '@/composables/useCatalog'

const props = withDefaults(
  defineProps<{
    product: Product
    field: Field
    feature?: boolean
  }>(),
  { feature: false },
)

const { t, n } = useI18n()
const { addItem } = useCart()

const plate = ref<HTMLImageElement | null>(null)
const isAdded = ref(false)
let addedTimer: ReturnType<typeof setTimeout> | undefined

const productLink = `/product/${props.product._id}`
const widths = props.feature ? [600, 900, 1200, 1600] : [400, 600, 800]
const sizes = props.feature
  ? '(min-width: 1100px) 50vw, 100vw'
  : '(min-width: 1100px) 25vw, (min-width: 700px) 33vw, 50vw'

function add() {
  addItem(props.product)
  flyToCart(plate.value, props.field)
  isAdded.value = true
  clearTimeout(addedTimer)
  addedTimer = setTimeout(() => (isAdded.value = false), 1600)
}

onUnmounted(() => clearTimeout(addedTimer))
</script>

<template>
  <article class="field" :class="[`f-${field}`, { feature }]">
    <div class="sheet">
      <RouterLink :to="productLink" class="name-link">
        <h3 class="name">{{ product.title }}</h3>
      </RouterLink>
      <p v-if="feature && product.featured" class="pick">{{ t('product.featured') }}</p>
      <p class="price tabular">{{ n(product.price, 'currency') }}</p>
    </div>

    <RouterLink :to="productLink" class="plate-link" tabindex="-1" aria-hidden="true">
      <img
        v-if="product.image"
        ref="plate"
        class="plate"
        :src="imageSrc(product, feature ? 1200 : 600)"
        :srcset="imageSrcset(product, widths)"
        :sizes="sizes"
        :alt="product.title"
        :loading="feature ? 'eager' : 'lazy'"
        :fetchpriority="feature ? 'high' : 'auto'"
        decoding="async"
      />
    </RouterLink>

    <button
      class="add"
      :class="{ 'is-added': isAdded }"
      :aria-label="t('product.addNamed', { name: product.title })"
      @click="add"
    >
      <span class="add-label" :key="String(isAdded)">
        <svg v-if="!isAdded" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" aria-hidden="true">
          <path d="M4.5 12.5l5 5 10-11" />
        </svg>
        {{ isAdded ? t('product.added') : feature ? t('product.addToCart') : t('product.add') }}
      </span>
    </button>
  </article>
</template>

<style scoped>
.field {
  --f-bg: var(--tile-light);
  --f-ink: var(--on-tile-light);
  position: relative;
  display: flex;
  flex-direction: column;
  gap: clamp(0.75rem, 1.4vw, 1.1rem);
  padding: clamp(0.85rem, 1.8vw, 1.5rem);
  background: var(--f-bg);
  color: var(--f-ink);
  min-width: 0;
}

.f-dark {
  --f-bg: var(--tile-dark);
  --f-ink: var(--on-tile-dark);
}

.sheet {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: start;
  gap: 0.25rem 1rem;
}

.name-link {
  min-width: 0;
}

.name {
  font-stretch: var(--semi-wide);
  font-weight: 750;
  font-size: clamp(1rem, 1.35vw, 1.2rem);
  line-height: 1.12;
  letter-spacing: -0.02em;
  text-wrap: balance;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (hover: hover) and (pointer: fine) {
  .name-link:hover .name {
    text-decoration: underline;
    text-decoration-thickness: 2px;
    text-underline-offset: 3px;
  }
}

.price {
  font-stretch: var(--wide);
  font-weight: 800;
  font-size: clamp(1rem, 1.35vw, 1.2rem);
  letter-spacing: -0.02em;
  white-space: nowrap;
}

.pick {
  grid-column: 1 / -1;
  justify-self: start;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  background: var(--f-ink);
  color: var(--f-bg);
}

.plate-link {
  display: block;
  overflow: clip;
  flex: 1;
  min-height: 0;
}

.plate {
  width: 100%;
  aspect-ratio: 4 / 5;
  object-fit: cover;
  background: color-mix(in srgb, var(--f-ink) 12%, var(--f-bg));
  transition: transform 500ms var(--ease-out);
}

/* Reveal: the photo uncovers bottom-up, like a print being laid down, and settles from a slight zoom */
.reveal .plate-link {
  clip-path: inset(100% 0 0 0);
}

.reveal .plate {
  scale: 1.14;
}

.reveal.is-in .plate-link {
  clip-path: inset(0 0 0 0);
  transition: clip-path 1.1s var(--ease-apple) calc(var(--reveal-delay, 0ms) + 120ms);
}

.reveal.is-in .plate {
  scale: 1;
  transition:
    scale 1.8s var(--ease-apple) calc(var(--reveal-delay, 0ms) + 120ms),
    transform 500ms var(--ease-out);
}

@media (hover: hover) and (pointer: fine) {
  .plate-link:hover .plate {
    transform: scale(1.035);
  }
}

.add {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  padding: 0.6rem 0.9rem;
  background: var(--blue);
  color: var(--on-blue);
  font-weight: 700;
  font-stretch: var(--semi-wide);
  font-size: 0.95rem;
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

.add.is-added {
  background: var(--paper);
  color: var(--ink);
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

/* Feature: the opening spread of the catalogue */
.feature .sheet {
  grid-template-columns: 1fr;
  gap: 0.6rem;
}

.feature .name {
  font-stretch: var(--wide);
  font-weight: 850;
  font-size: clamp(2rem, 3.7vw, 3.6rem);
  line-height: 0.98;
  letter-spacing: -0.04em;
  display: block;
  -webkit-line-clamp: unset;
  line-clamp: none;
  overflow: visible;
  max-width: 14ch;
}

.feature .sheet {
  padding-bottom: 0.15rem;
}

.feature .price {
  font-size: clamp(1.4rem, 2.4vw, 2.2rem);
}

.feature .plate {
  aspect-ratio: auto;
  height: 100%;
  min-height: 320px;
}

@media (max-width: 699px) {
  .field:not(.feature) .sheet {
    grid-template-columns: 1fr;
  }
}

/* The feature's action sits with its sheet, above the plate, so it lands in the first viewport */
.feature .plate-link {
  order: 1;
}

.feature .add {
  align-self: flex-start;
  min-height: 56px;
  padding: 0.8rem 1.6rem;
  font-size: 1.05rem;
}

/* Feature photo drifts against the scroll (parallax); the extra scale keeps the frame covered */
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .feature .plate {
      scale: 1.14;
      animation: drift linear both;
      animation-timeline: view();
      animation-range: cover 0% cover 100%;
    }

    .feature.reveal .plate {
      scale: 1.28;
    }

    .feature.reveal.is-in .plate {
      scale: 1.14;
    }
  }
}

@keyframes drift {
  from {
    translate: 0 -6%;
  }
  to {
    translate: 0 6%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .add-label {
    animation: none;
  }

  .plate {
    transition: none;
  }
}
</style>

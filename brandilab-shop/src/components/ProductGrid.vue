<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Product } from '@/types'
import ProductCard from './ProductCard.vue'
import { useCatalog } from '@/composables/useCatalog'

const props = withDefaults(
  defineProps<{
    products: Product[]
    loading?: boolean
    variant?: 'mosaic' | 'strip'
    showCustom?: boolean
  }>(),
  { loading: false, variant: 'mosaic', showCustom: false },
)

const { t } = useI18n()
const { fieldOf } = useCatalog()
const skeletonFields = ['light', 'dark'] as const
const skeletonCount = props.variant === 'strip' ? 4 : 7
</script>

<template>
  <div v-if="loading" class="grid" :class="variant" aria-busy="true">
    <div
      v-for="i in skeletonCount"
      :key="i"
      class="skeleton"
      :class="[`s-${skeletonFields[(i - 1) % skeletonFields.length]}`, { feature: variant === 'mosaic' && i === 1 }]"
    >
      <span class="sk-line" />
      <span class="sk-plate" />
    </div>
  </div>

  <div v-else class="grid" :class="variant">
    <ProductCard
      v-for="(product, i) in products"
      :key="product._id"
      v-reveal="(i % 4) * 90"
      :product="product"
      :field="fieldOf(product)"
      :feature="variant === 'mosaic' && i === 0"
    />

    <aside v-if="showCustom" v-reveal="180" class="custom">
      <h3 class="custom-title display">{{ t('home.customTitle') }}</h3>
      <p class="custom-text">{{ t('home.customText') }}</p>
      <RouterLink :to="{ path: '/contact', query: { type: 'custom' } }" class="btn btn-blue custom-cta">
        {{ t('home.customCta') }}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </RouterLink>
    </aside>
  </div>
</template>

<style scoped>
/* Apple-style tile grid: square tiles on white, 12px gutters */
.grid {
  display: grid;
  gap: 12px;
  padding: 0 12px;
}

@media (max-width: 699px) {
  .grid {
    gap: 8px;
    padding: 0 8px;
  }
}


.mosaic {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.mosaic > .feature {
  grid-column: 1 / -1;
}

@media (min-width: 700px) {
  .mosaic {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .mosaic > .feature {
    grid-column: span 2;
    grid-row: span 2;
  }
}

@media (min-width: 1100px) {
  .mosaic {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.strip {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (min-width: 900px) {
  .strip {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

/*
 * Tile tones follow grid position, not list order, so every layout reads as a checkerboard.
 * Light is the default; the selectors below pick the dark cells for each column count.
 */
.grid > .field {
  --f-bg: var(--tile-light);
  --f-ink: var(--on-tile-light);
}

.mosaic > .field:nth-child(4n + 5),
.mosaic > .field:nth-child(4n + 2),
.strip > .field:nth-child(4n + 2),
.strip > .field:nth-child(4n + 3) {
  --f-bg: var(--tile-dark);
  --f-ink: var(--on-tile-dark);
}

@media (min-width: 700px) {
  .mosaic > .field:nth-child(4n + 5),
  .mosaic > .field:nth-child(4n + 2) {
    --f-bg: var(--tile-light);
    --f-ink: var(--on-tile-light);
  }

  .mosaic > .field:nth-child(even) {
    --f-bg: var(--tile-dark);
    --f-ink: var(--on-tile-dark);
  }
}

@media (min-width: 900px) {
  .strip > .field:nth-child(4n + 2),
  .strip > .field:nth-child(4n + 3) {
    --f-bg: var(--tile-light);
    --f-ink: var(--on-tile-light);
  }

  .strip > .field:nth-child(even) {
    --f-bg: var(--tile-dark);
    --f-ink: var(--on-tile-dark);
  }
}

@media (min-width: 1100px) {
  .mosaic > .field:nth-child(even) {
    --f-bg: var(--tile-light);
    --f-ink: var(--on-tile-light);
  }

  .mosaic > .field:nth-child(2),
  .mosaic > .field:nth-child(5),
  .mosaic > .field:nth-child(8n + 6),
  .mosaic > .field:nth-child(8n + 8),
  .mosaic > .field:nth-child(8n + 11),
  .mosaic > .field:nth-child(8n + 13) {
    --f-bg: var(--tile-dark);
    --f-ink: var(--on-tile-dark);
  }
}

/* Custom-design tile closes the grid */
.custom {
  grid-column: span 2;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 1rem;
  padding: clamp(1.25rem, 3vw, 2.5rem);
  background: var(--tile-dark);
  color: var(--on-tile-dark);
  min-height: 280px;
}

.custom-title {
  color: var(--on-tile-dark);
  font-size: clamp(2.25rem, 4.6vw, 4.5rem);
}

.custom-text {
  max-width: 34ch;
  font-size: clamp(1rem, 1.3vw, 1.15rem);
  color: #a1a1a6;
}

.custom-cta {
  align-self: flex-start;
}

@media (max-width: 699px) {
  .custom {
    grid-column: 1 / -1;
  }
}

/* Loading: the grid is laid out in its tones before the photos arrive */
.skeleton {
  --s-bg: var(--tile-light);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: clamp(0.85rem, 1.8vw, 1.5rem);
  background: var(--s-bg);
  min-height: 340px;
}

.s-dark {
  --s-bg: var(--tile-dark);
}

.sk-line {
  height: 1.1rem;
  width: 60%;
  background: rgba(134, 134, 139, 0.3);
}

.sk-plate {
  flex: 1;
  background: rgba(134, 134, 139, 0.18);
  animation: breathe 1.4s ease-in-out infinite;
}

@keyframes breathe {
  50% {
    opacity: 0.55;
  }
}

.skeleton.feature {
  grid-column: 1 / -1;
  min-height: 460px;
}

@media (min-width: 700px) {
  .skeleton.feature {
    grid-column: span 2;
    grid-row: span 2;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sk-plate {
    animation: none;
  }
}
</style>

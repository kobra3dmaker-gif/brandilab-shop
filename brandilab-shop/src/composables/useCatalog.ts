import { ref } from 'vue'
import type { Product } from '@/types'
import { useProducts } from '@/composables/useProducts'
import { urlFor } from '@/sanity'

export type Field = 'light' | 'dark'

/**
 * Tone of the tile at a 1-based position in the desktop mosaic (2×2 feature, then 4 columns),
 * laid out as a checkerboard. The grid re-derives tones per breakpoint in CSS; this keeps the
 * product page and cart in step with the default (newest first) desktop order.
 */
function toneAt(k: number): Field {
  if (k === 2 || k === 5) return 'dark'
  if (k >= 6 && [0, 2, 5, 7].includes((k - 6) % 8)) return 'dark'
  return 'light'
}

/** The tile tone a product owns, stable across pages for a given catalogue. */
export function useCatalog() {
  const { products } = useProducts()

  function fieldOf(product: Product): Field {
    const index = products.value.findIndex((p) => p._id === product._id)
    return toneAt((index < 0 ? 0 : index) + 1)
  }

  return { fieldOf }
}

export function imageSrc(product: Product, width: number) {
  return urlFor(product.image).width(width).auto('format').quality(82).url()
}

export function imageSrcset(product: Product, widths: number[]) {
  return widths.map((w) => `${imageSrc(product, w)} ${w}w`).join(', ')
}

/** Colour the masthead cart square floods with when something lands in it. */
export const cartFlood = ref<{ field: Field; at: number } | null>(null)

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Signature interaction: the product's plate flies into the masthead cart square.
 * Purely visual — the item is already in the cart when this runs.
 */
export function flyToCart(source: HTMLElement | null | undefined, field: Field) {
  const target = document.querySelector<HTMLElement>('[data-cart-target]')
  const land = () => {
    cartFlood.value = { field, at: Date.now() }
  }

  if (!source || !target || reducedMotion()) {
    land()
    return
  }

  const from = source.getBoundingClientRect()
  const to = target.getBoundingClientRect()
  if (from.width === 0 || to.width === 0) {
    land()
    return
  }

  const ghost = source.cloneNode(true) as HTMLElement
  ghost.removeAttribute('srcset')
  Object.assign(ghost.style, {
    position: 'fixed',
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    margin: '0',
    objectFit: 'cover',
    zIndex: '2000',
    pointerEvents: 'none',
    transformOrigin: '0 0',
    clipPath: 'none',
    willChange: 'transform, opacity',
  })
  document.body.appendChild(ghost)

  const scale = Math.min(to.width / from.width, to.height / from.height)
  const dx = to.left + to.width / 2 - (from.left + (from.width * scale) / 2)
  const dy = to.top + to.height / 2 - (from.top + (from.height * scale) / 2)

  const flight = ghost.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.55}px, ${dy * 0.35}px) scale(${0.45 + scale * 0.5})`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 0.2 },
    ],
    { duration: 520, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' },
  )

  flight.onfinish = () => {
    ghost.remove()
    land()
  }
  flight.oncancel = () => {
    ghost.remove()
    land()
  }
}

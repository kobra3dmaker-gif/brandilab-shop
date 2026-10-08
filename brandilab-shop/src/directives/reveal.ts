import type { Directive } from 'vue'

/**
 * v-reveal="delayMs": the element rises into place the first time it enters the viewport.
 * The hidden state is only applied once JS knows it can reveal it again, so content is
 * visible without IntersectionObserver or with reduced motion.
 *
 * The observed element must not be clipped itself: Chromium counts a target's own
 * clip-path when computing intersection, so a fully clipped target never intersects.
 */
let observer: IntersectionObserver | null = null

function getObserver() {
  if (observer) return observer
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        observer?.unobserve(entry.target)
        entry.target.classList.add('is-in')
      }
    },
    { rootMargin: '0px 0px -6% 0px', threshold: 0.01 },
  )
  return observer
}

export const reveal: Directive<HTMLElement, number | undefined> = {
  mounted(el, binding) {
    if (typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    el.style.setProperty('--reveal-delay', `${binding.value ?? 0}ms`)
    el.classList.add('reveal')
    getObserver().observe(el)
  },
  unmounted(el) {
    observer?.unobserve(el)
  },
}

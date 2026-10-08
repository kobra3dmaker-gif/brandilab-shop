<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'

/** A statement whose words light up one after another as it scrolls through the viewport. */
const props = defineProps<{ text: string; tag?: string }>()

const root = ref<HTMLElement | null>(null)
const words = computed(() => props.text.split(/\s+/).filter(Boolean))

let frame = 0
let observer: IntersectionObserver | null = null

function update() {
  frame = 0
  const el = root.value
  if (!el) return
  const vh = window.innerHeight
  const rect = el.getBoundingClientRect()
  // Starts lighting when the top reaches 85% of the viewport, done when the bottom passes 45%
  const progress = (vh * 0.85 - rect.top) / (rect.height + vh * 0.4)
  el.style.setProperty('--p', String(Math.min(1, Math.max(0, progress))))
}

function onScroll() {
  if (!frame) frame = requestAnimationFrame(update)
}

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  if (typeof IntersectionObserver === 'undefined') return
  update()
  observer = new IntersectionObserver(([entry]) => {
    if (entry?.isIntersecting) {
      window.addEventListener('scroll', onScroll, { passive: true })
      update()
    } else {
      window.removeEventListener('scroll', onScroll)
    }
  })
  if (root.value) observer.observe(root.value)
})

onUnmounted(() => {
  observer?.disconnect()
  window.removeEventListener('scroll', onScroll)
  cancelAnimationFrame(frame)
})
</script>

<template>
  <component :is="tag ?? 'p'" ref="root" class="scroll-words" :style="{ '--n': words.length }">
    <span v-for="(word, i) in words" :key="i" class="w" :style="{ '--i': i }">{{ words.length - 1 > i ? `${word} ` : word }}</span>
  </component>
</template>

<style scoped>
.scroll-words {
  --p: 1;
}

.w {
  opacity: clamp(0.16, calc(var(--p) * (var(--n) + 3) - var(--i)), 1);
  transition: opacity 0.12s linear;
}
</style>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useCart } from '@/composables/useCart'
import { useTheme } from '@/composables/useTheme'
import { useLocale, SUPPORTED_LOCALES, LOCALE_NAMES } from '@/i18n'
import { cartFlood, type Field } from '@/composables/useCatalog'
import logo from '@/assets/logo.webp'

const { itemCount, openCart } = useCart()
const { isDark, toggleTheme } = useTheme()
const { t } = useI18n()
const { locale, setLocale } = useLocale()
const route = useRoute()

const isScrolled = ref(false)
const menuOpen = ref(false)
const flood = ref<Field | null>(null)
const bump = ref(false)
let floodTimer: ReturnType<typeof setTimeout> | undefined

const onScroll = () => {
  isScrolled.value = window.scrollY > 8
}

watch(cartFlood, (value) => {
  if (!value) return
  flood.value = value.field
  bump.value = false
  requestAnimationFrame(() => (bump.value = true))
  clearTimeout(floodTimer)
  floodTimer = setTimeout(() => {
    flood.value = null
    bump.value = false
  }, 900)
})

watch(
  () => route.fullPath,
  () => (menuOpen.value = false),
)

watch(menuOpen, (open) => {
  document.documentElement.style.overflow = open ? 'hidden' : ''
})

const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape') menuOpen.value = false
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('keydown', onKey)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('keydown', onKey)
  clearTimeout(floodTimer)
})

const links = [
  { to: { path: '/', hash: '#catalogo' }, key: 'nav.catalogue', name: 'home' },
  { to: '/about', key: 'nav.about', name: 'about' },
  { to: '/contact', key: 'nav.contact', name: 'contact' },
] as const
</script>

<template>
  <header class="masthead" :class="{ 'is-scrolled': isScrolled || menuOpen }">
    <div class="masthead-row">
      <RouterLink to="/" class="brand" aria-label="BrandiLab — Home">
        <img :src="logo" alt="" class="brand-roundel" width="40" height="40" />
        <span class="brand-word">BrandiLab</span>
      </RouterLink>

      <nav class="links desktop" :aria-label="t('nav.mainNav')">
        <RouterLink
          v-for="link in links"
          :key="link.key"
          :to="link.to"
          class="link"
          :class="{ 'is-current': route.name === link.name }"
        >
          {{ t(link.key) }}
        </RouterLink>
      </nav>

      <div class="tools">
        <div class="lang desktop" role="group" :aria-label="t('nav.language')">
          <button
            v-for="loc in SUPPORTED_LOCALES"
            :key="loc"
            class="lang-btn"
            :class="{ 'is-on': locale === loc }"
            :aria-pressed="locale === loc"
            :title="LOCALE_NAMES[loc]"
            @click="setLocale(loc)"
          >
            {{ loc.toUpperCase() }}
          </button>
        </div>

        <button
          class="icon-btn desktop"
          :aria-label="isDark ? t('nav.themeToLight') : t('nav.themeToDark')"
          @click="toggleTheme"
        >
          <svg v-if="!isDark" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true">
            <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
          </svg>
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true">
            <circle cx="12" cy="12" r="4.5" />
            <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
          </svg>
        </button>

        <button class="cart" :aria-label="t('nav.cartLabel', { count: itemCount }, itemCount)" @click="openCart">
          <span class="cart-word">{{ t('nav.cart') }}</span>
          <span
            class="cart-square tabular"
            :class="[flood ? `flood-${flood}` : '', { bump }]"
            data-cart-target
          >
            {{ itemCount }}
          </span>
        </button>

        <button
          class="icon-btn mobile"
          :aria-expanded="menuOpen"
          aria-controls="mobile-menu"
          :aria-label="menuOpen ? t('nav.closeMenu') : t('nav.openMenu')"
          @click="menuOpen = !menuOpen"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="square" aria-hidden="true">
            <path v-if="!menuOpen" d="M3 7h18M3 17h18" />
            <path v-else d="M5 5l14 14M19 5L5 19" />
          </svg>
        </button>
      </div>
    </div>

    <!-- On <body>: the masthead's backdrop-filter would make it the fixed panel's containing block -->
    <Teleport to="body">
    <Transition name="menu">
      <div v-if="menuOpen" id="mobile-menu" class="mobile-menu">
        <nav :aria-label="t('nav.mainNav')">
          <RouterLink v-for="link in links" :key="link.key" :to="link.to" class="mobile-link" @click="menuOpen = false">
            {{ t(link.key) }}
          </RouterLink>
        </nav>
        <div class="mobile-tools">
          <div class="lang" role="group" :aria-label="t('nav.language')">
            <button
              v-for="loc in SUPPORTED_LOCALES"
              :key="loc"
              class="lang-btn"
              :class="{ 'is-on': locale === loc }"
              :aria-pressed="locale === loc"
              @click="setLocale(loc)"
            >
              {{ LOCALE_NAMES[loc] }}
            </button>
          </div>
          <button class="theme-line" @click="toggleTheme">
            {{ isDark ? t('nav.themeToLight') : t('nav.themeToDark') }}
          </button>
        </div>
      </div>
    </Transition>
    </Teleport>
  </header>
</template>

<style scoped>
.masthead {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 1000;
  background: var(--masthead-bg);
  backdrop-filter: saturate(1.4) blur(10px);
  -webkit-backdrop-filter: saturate(1.4) blur(10px);
  border-bottom: 2px solid transparent;
  transition: border-color 0.2s ease;
}

.masthead.is-scrolled {
  border-bottom-color: var(--rule);
}

.masthead-row {
  height: var(--navbar-height);
  max-width: var(--container-max);
  margin: 0 auto;
  padding: 0 var(--gutter);
  display: flex;
  align-items: center;
  gap: 2rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex-shrink: 0;
}

.brand-roundel {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.brand-word {
  font-stretch: var(--wide);
  font-weight: 850;
  font-size: 1.35rem;
  letter-spacing: -0.04em;
}

.links {
  display: flex;
  gap: 1.75rem;
  margin-left: auto;
}

.link {
  position: relative;
  font-weight: 600;
  font-size: 0.98rem;
  padding: 0.4rem 0;
}

.link::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 220ms var(--ease-out);
}

.link.is-current::after {
  transform: scaleX(1);
}

@media (hover: hover) and (pointer: fine) {
  .link:hover::after {
    transform: scaleX(1);
  }
}

.tools {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: 1.5rem;
}

.lang {
  display: flex;
  border: 2px solid var(--ink);
}

.lang-btn {
  min-width: 40px;
  min-height: 36px;
  padding: 0 0.55rem;
  font-weight: 700;
  font-size: 0.8rem;
  letter-spacing: 0.04em;
  transition: var(--transition-fast);
}

.lang-btn.is-on {
  background: var(--ink);
  color: var(--paper);
}

.icon-btn {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  transition: transform 160ms var(--ease-out);
}

.icon-btn:active {
  transform: scale(0.94);
}

.cart {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-weight: 700;
  padding-left: 0.25rem;
}

.cart:active .cart-square {
  transform: scale(0.94);
}

.cart-square {
  min-width: 44px;
  height: 44px;
  padding: 0 0.6rem;
  display: grid;
  place-items: center;
  background: var(--blue);
  color: var(--on-blue);
  font-weight: 800;
  font-stretch: var(--wide);
  font-size: 1.05rem;
  transition:
    background-color 0.35s ease,
    color 0.35s ease,
    transform 160ms var(--ease-out);
}

.cart-square.bump {
  animation: bump 420ms var(--ease-out);
}

@keyframes bump {
  0% {
    transform: scale(1);
  }
  35% {
    transform: scale(1.18);
  }
  100% {
    transform: scale(1);
  }
}

.flood-light,
.flood-dark {
  background: var(--ink);
  color: var(--paper);
}

.mobile {
  display: none;
}

/* Mobile menu */
.mobile-menu {
  position: fixed;
  z-index: 999;
  top: var(--navbar-height);
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--paper);
  padding: 1.5rem var(--gutter) 2rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow-y: auto;
}

.mobile-menu nav {
  display: flex;
  flex-direction: column;
}

.mobile-link {
  font-stretch: var(--wide);
  font-weight: 800;
  font-size: clamp(2.25rem, 11vw, 3.25rem);
  letter-spacing: -0.04em;
  line-height: 1.05;
  padding: 0.6rem 0;
  border-bottom: 2px solid var(--rule);
}

.mobile-tools {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 2rem;
}

.mobile-tools .lang {
  align-self: flex-start;
}

.mobile-tools .lang-btn {
  min-height: 44px;
  padding: 0 1rem;
  font-size: 0.95rem;
}

.theme-line {
  align-self: flex-start;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 4px;
  min-height: 44px;
}

.menu-enter-active {
  transition:
    opacity 0.22s var(--ease-out),
    transform 0.22s var(--ease-out);
}

.menu-leave-active {
  transition: opacity 0.14s ease;
}

.menu-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.menu-leave-to {
  opacity: 0;
}

@media (max-width: 860px) {
  .desktop {
    display: none !important;
  }

  .mobile {
    display: grid;
  }

  .tools {
    margin-left: auto;
    gap: 0.4rem;
  }

  .cart-word {
    display: none;
  }
}

@media (max-width: 400px) {
  .brand-word {
    font-size: 1.15rem;
  }
}
</style>

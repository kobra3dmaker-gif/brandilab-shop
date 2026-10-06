<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useCart } from '@/composables/useCart'
import { useTheme } from '@/composables/useTheme'
import { useI18n } from 'vue-i18n'
import { useLocale, SUPPORTED_LOCALES, LOCALE_NAMES } from '@/i18n'
import { useProducts } from '@/composables/useProducts'
import { useRouter } from 'vue-router'
import logo from '@/assets/logo.webp'

const { itemCount, toggleCart } = useCart()
const { isDark, toggleTheme } = useTheme() // Theme toggle available for UI
const { t } = useI18n()
const { locale, setLocale } = useLocale()
const { searchQuery } = useProducts()
const router = useRouter()

const isScrolled = ref(false)
const showMobileMenu = ref(false)
const showCategoriesDropdown = ref(false)

const handleScroll = () => {
  isScrolled.value = window.scrollY > 20
}

const doSearch = () => {
  if (router.currentRoute.value.path !== '/') {
    router.push('/#shop')
  }
}

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
}

const toggleCategories = () => {
  showCategoriesDropdown.value = !showCategoriesDropdown.value
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <header class="navbar-wrapper" :class="{ 'is-scrolled': isScrolled }">
    <!-- Main Navbar -->
    <nav class="navbar-main">
      <div class="navbar-container">
        
        <!-- Left: Logo & Brand -->
        <RouterLink to="/" class="navbar-brand">
          <img :src="logo" alt="BrandiLab" class="brand-logo" />
          <span class="brand-text">BrandiLab</span>
        </RouterLink>

        <!-- Center: Search Bar (Hidden on Mobile) -->
        <div class="navbar-search desktop-only">
          <input 
            type="text" 
            class="search-input" 
            :placeholder="t('nav.searchPlaceholder') || 'Cerca prodotti...'" 
            v-model="searchQuery"
            @keyup.enter="doSearch"
          />
          <button class="search-button" aria-label="Cerca" @click="doSearch">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </div>

        <!-- Right: Actions -->
        <div class="navbar-actions">
          
          <!-- Categories Dropdown (Desktop Only) -->
          <div class="dropdown-wrapper desktop-only">
            <button class="action-btn text-btn" @click="toggleCategories">
              <span>{{ t('nav.browseCategories') || 'Sfoglia categorie' }}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :class="{ 'rotated': showCategoriesDropdown }">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div v-if="showCategoriesDropdown" class="dropdown-menu">
              <!-- Dummy links for categories -->
              <RouterLink to="/" class="dropdown-item">Stampe 3D</RouterLink>
              <RouterLink to="/" class="dropdown-item">Taglio Laser</RouterLink>
              <RouterLink to="/" class="dropdown-item">Gadget</RouterLink>
            </div>
          </div>

          <!-- Language Switcher -->
          <div class="lang-switcher">
            <button 
              v-for="loc in SUPPORTED_LOCALES" 
              :key="loc"
              @click="setLocale(loc)"
              class="lang-btn"
              :class="{ 'active': locale === loc }"
            >
              {{ loc.toUpperCase() }}
            </button>
          </div>

          <!-- Theme Toggle -->
          <button class="action-btn theme-btn" @click="toggleTheme" aria-label="Cambia tema">
            <svg v-if="!isDark" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          </button>

          <!-- Cart Button -->
          <button class="action-btn cart-btn" @click="toggleCart" aria-label="Carrello">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <span class="cart-badge">{{ itemCount }}</span>
          </button>

          <!-- Mobile Menu Toggle -->
          <button class="action-btn mobile-menu-toggle mobile-only" @click="toggleMobileMenu" aria-label="Menu">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line v-if="!showMobileMenu" x1="3" y1="12" x2="21" y2="12"></line>
              <line v-if="!showMobileMenu" x1="3" y1="6" x2="21" y2="6"></line>
              <line v-if="!showMobileMenu" x1="3" y1="18" x2="21" y2="18"></line>
              <line v-if="showMobileMenu" x1="18" y1="6" x2="6" y2="18"></line>
              <line v-if="showMobileMenu" x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </nav>

    <!-- Secondary Nav Strip (Desktop Only) -->
    <div class="navbar-secondary desktop-only">
      <div class="secondary-container">
        <RouterLink to="/" class="secondary-link">{{ t('nav.newArrivals') || 'Novità' }}</RouterLink>
        <RouterLink to="/" class="secondary-link">{{ t('nav.bestsellers') || 'Bestseller' }}</RouterLink>
        <RouterLink to="/" class="secondary-link">{{ t('nav.giftIdeas') || 'Idee regalo' }}</RouterLink>
        <RouterLink to="/" class="secondary-link">{{ t('nav.allProducts') || 'Tutti i prodotti' }}</RouterLink>
      </div>
    </div>

    <!-- Mobile Drawer -->
    <div class="mobile-drawer" :class="{ 'is-open': showMobileMenu }">
      <div class="mobile-search">
        <input 
          type="text" 
          class="search-input" 
          :placeholder="t('nav.searchPlaceholder') || 'Cerca prodotti...'" 
          v-model="searchQuery"
          @keyup.enter="doSearch"
        />
        <button class="search-button" @click="doSearch">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
      </div>
      
      <nav class="mobile-nav-links">
        <RouterLink to="/" class="mobile-link" @click="showMobileMenu = false">{{ t('nav.newArrivals') || 'Novità' }}</RouterLink>
        <RouterLink to="/" class="mobile-link" @click="showMobileMenu = false">{{ t('nav.bestsellers') || 'Bestseller' }}</RouterLink>
        <RouterLink to="/" class="mobile-link" @click="showMobileMenu = false">{{ t('nav.giftIdeas') || 'Idee regalo' }}</RouterLink>
        <RouterLink to="/" class="mobile-link" @click="showMobileMenu = false">{{ t('nav.allProducts') || 'Tutti i prodotti' }}</RouterLink>
        
        <div class="mobile-divider"></div>
        
        <p class="mobile-section-title">{{ t('nav.browseCategories') || 'Sfoglia categorie' }}</p>
        <RouterLink to="/" class="mobile-link" @click="showMobileMenu = false">Stampe 3D</RouterLink>
        <RouterLink to="/" class="mobile-link" @click="showMobileMenu = false">Taglio Laser</RouterLink>
        <RouterLink to="/" class="mobile-link" @click="showMobileMenu = false">Gadget</RouterLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.navbar-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  background-color: var(--color-brand-dark, #1a1a1a);
  color: var(--color-on-dark, #ffffff);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  transition: var(--transition, all 0.3s ease);
}

.navbar-main {
  height: var(--navbar-height, 72px);
  display: flex;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.navbar-container {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

/* Brand */
.navbar-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: var(--color-on-dark, #ffffff);
}

.brand-logo {
  height: 40px;
  width: auto;
  object-fit: contain;
}

.brand-text {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* Search */
.navbar-search {
  flex: 1;
  max-width: 600px;
  display: flex;
  align-items: center;
  background: var(--color-surface, #ffffff);
  border-radius: var(--radius-md, 6px);
  overflow: hidden;
  height: 44px;
  border: 1px solid var(--color-border);
}

.search-input {
  flex: 1;
  height: 100%;
  border: none;
  padding: 0 1rem;
  font-size: 1rem;
  color: var(--color-text);
  background: transparent;
  outline: none;
}

.search-button {
  background: var(--color-accent, #16a085);
  color: white;
  border: none;
  height: 100%;
  width: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.search-button:hover {
  background-color: #12876f;
}

/* Actions */
.navbar-actions {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.action-btn {
  background: transparent;
  border: none;
  color: var(--color-on-dark, #ffffff);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s;
}

.action-btn:hover {
  opacity: 0.8;
}

.text-btn {
  gap: 0.5rem;
  font-weight: 500;
  font-size: 0.95rem;
  padding: 0.5rem;
}

.text-btn svg {
  transition: transform 0.2s ease;
}

.text-btn svg.rotated {
  transform: rotate(180deg);
}

.cart-btn {
  position: relative;
  padding: 0.25rem;
}

.cart-badge {
  position: absolute;
  top: -5px;
  right: -8px;
  background-color: var(--color-accent, #16a085);
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  min-width: 20px;
  height: 20px;
  border-radius: var(--radius-full, 9999px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  border: 2px solid var(--color-brand-dark, #1a1a1a);
}

/* Lang Switcher */
.lang-switcher {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.25rem;
  border-radius: var(--radius-sm, 4px);
}

.lang-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 2px;
  transition: all 0.2s;
}

.lang-btn:hover {
  color: white;
}

.lang-btn.active {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

/* Dropdown */
.dropdown-wrapper {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 1rem);
  right: 0;
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-md, 6px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  padding: 0.5rem 0;
  display: flex;
  flex-direction: column;
}

.dropdown-item {
  padding: 0.75rem 1rem;
  color: var(--color-text);
  text-decoration: none;
  font-size: 0.95rem;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background-color: var(--color-accent-light);
  color: var(--color-accent, #16a085);
}

/* Secondary Nav */
.navbar-secondary {
  background-color: rgba(0, 0, 0, 0.2); /* Darker shade */
  height: 36px;
  display: flex;
  align-items: center;
}

.secondary-container {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.secondary-link {
  color: var(--color-on-dark, #ffffff);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  opacity: 0.9;
  transition: opacity 0.2s;
  padding: 0.25rem 0;
}

.secondary-link:hover {
  opacity: 1;
  text-decoration: underline;
}

/* Mobile Drawer */
.mobile-drawer {
  display: none;
  background-color: var(--color-brand-dark, #1a1a1a);
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.mobile-drawer.is-open {
  display: block;
}

.mobile-search {
  display: flex;
  align-items: center;
  background: var(--color-surface, #ffffff);
  border-radius: var(--radius-md, 6px);
  overflow: hidden;
  height: 40px;
  margin-bottom: 1.5rem;
  border: 1px solid var(--color-border);
}

.mobile-nav-links {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mobile-link {
  color: var(--color-on-dark, #ffffff);
  text-decoration: none;
  font-size: 1.1rem;
  font-weight: 500;
}

.mobile-divider {
  height: 1px;
  background-color: rgba(255, 255, 255, 0.1);
  margin: 0.5rem 0;
}

.mobile-section-title {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 0.5rem;
}

/* Utilities */
.desktop-only {
  display: flex;
}

.mobile-only {
  display: none;
}

@media (max-width: 1024px) {
  .desktop-only {
    display: none !important;
  }
  
  .mobile-only {
    display: flex;
  }

  .navbar-container {
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .navbar-actions {
    gap: 0.5rem;
  }
  
  .brand-text {
    display: none;
  }
  
  .navbar-container {
    padding: 0 1rem;
  }
}
</style>

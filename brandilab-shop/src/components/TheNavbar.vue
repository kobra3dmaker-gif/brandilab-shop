<template>
  <header class="navbar" :class="{ 'scrolled': isScrolled }">
    <div class="navbar-container">
      <div class="brand">
        <RouterLink class="brand-link" to="/">BrandiLab</RouterLink>
      </div>
      
      <nav class="desktop-nav">
        <RouterLink to="/" class="nav-link" active-class="active">Home</RouterLink>
        <RouterLink to="/shop" class="nav-link" active-class="active">Shop</RouterLink>
        <RouterLink to="/about" class="nav-link" active-class="active">About</RouterLink>
        <RouterLink to="/contact" class="nav-link" active-class="active">Contact</RouterLink>
      </nav>

      <div class="actions">
        <button class="snipcart-checkout cart-btn" @click.prevent="openCart" aria-label="Cart">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          <span class="snipcart-items-count badge">0</span>
          <span class="badge" v-show="itemCount > 0">{{ itemCount }}</span>
        </button>

        <button class="mobile-toggle" @click="toggleMenu" :class="{ 'is-open': isMenuOpen }" aria-label="Toggle menu">
          <span class="bar"></span>
          <span class="bar"></span>
          <span class="bar"></span>
        </button>
      </div>
    </div>

    <!-- Mobile Menu Drawer -->
    <div class="mobile-menu" :class="{ 'is-open': isMenuOpen }">
      <nav class="mobile-nav">
        <RouterLink to="/" class="nav-link" active-class="active" @click="closeMenu">Home</RouterLink>
        <RouterLink to="/shop" class="nav-link" active-class="active" @click="closeMenu">Shop</RouterLink>
        <RouterLink to="/about" class="nav-link" active-class="active" @click="closeMenu">About</RouterLink>
        <RouterLink to="/contact" class="nav-link" active-class="active" @click="closeMenu">Contact</RouterLink>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useSnipcart } from '@/composables/useSnipcart';

const { itemCount, openCart } = useSnipcart();

const isScrolled = ref(false);
const isMenuOpen = ref(false);

const handleScroll = () => {
  isScrolled.value = window.scrollY > 50;
};

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const closeMenu = () => {
  isMenuOpen.value = false;
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: var(--navbar-height, 72px);
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 1000;
  transition: var(--transition, all 0.3s ease);
  border-bottom: 1px solid var(--color-border, #e0e0e0);
}

.navbar.scrolled {
  box-shadow: var(--shadow-md, 0 4px 12px rgba(0,0,0,0.1));
  border-bottom-color: transparent;
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand-link {
  font-family: var(--font-family, sans-serif);
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-primary, #1a1a2e);
  text-decoration: none;
  letter-spacing: -0.5px;
}

.desktop-nav {
  display: none;
  gap: 32px;
}

.desktop-nav .nav-link {
  font-family: var(--font-family, sans-serif);
  color: var(--color-text, #2d3436);
  text-decoration: none;
  font-weight: 500;
  font-size: 1rem;
  position: relative;
  transition: var(--transition, all 0.3s ease);
}

.desktop-nav .nav-link:hover {
  color: var(--color-accent, #16a085);
}

.desktop-nav .nav-link::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 2px;
  background-color: var(--color-accent, #16a085);
  transition: var(--transition, all 0.3s ease);
}

.desktop-nav .nav-link.active {
  color: var(--color-accent, #16a085);
}

.desktop-nav .nav-link.active::after {
  width: 100%;
}

.actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.cart-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text, #2d3436);
  display: flex;
  align-items: center;
  position: relative;
  padding: 8px;
  transition: var(--transition, all 0.3s ease);
}

.cart-btn:hover {
  color: var(--color-accent, #16a085);
}

.badge {
  position: absolute;
  top: 0;
  right: 0;
  background-color: var(--color-accent, #16a085);
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

.mobile-toggle {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 24px;
  height: 18px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.bar {
  width: 100%;
  height: 2px;
  background-color: var(--color-text, #2d3436);
  border-radius: 2px;
  transition: var(--transition, all 0.3s ease);
  transform-origin: left center;
}

.mobile-toggle.is-open .bar:nth-child(1) {
  transform: rotate(45deg);
}

.mobile-toggle.is-open .bar:nth-child(2) {
  opacity: 0;
}

.mobile-toggle.is-open .bar:nth-child(3) {
  transform: rotate(-45deg);
}

.mobile-menu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background-color: var(--color-surface, #ffffff);
  box-shadow: var(--shadow-md, 0 4px 12px rgba(0,0,0,0.1));
  clip-path: polygon(0 0, 100% 0, 100% 0, 0 0);
  transition: clip-path 0.3s ease-in-out;
}

.mobile-menu.is-open {
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
}

.mobile-nav {
  display: flex;
  flex-direction: column;
  padding: 16px 24px;
}

.mobile-nav .nav-link {
  padding: 16px 0;
  font-family: var(--font-family, sans-serif);
  color: var(--color-text, #2d3436);
  text-decoration: none;
  font-weight: 500;
  font-size: 1.125rem;
  border-bottom: 1px solid var(--color-border, #e0e0e0);
}

.mobile-nav .nav-link:last-child {
  border-bottom: none;
}

.mobile-nav .nav-link.active {
  color: var(--color-accent, #16a085);
}

@media (min-width: 768px) {
  .desktop-nav {
    display: flex;
  }
  .mobile-toggle, .mobile-menu {
    display: none;
  }
}
</style>

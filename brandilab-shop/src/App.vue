<script setup lang="ts">
import TheNavbar from '@/components/TheNavbar.vue'
import TheFooter from '@/components/TheFooter.vue'
import CookieBanner from '@/components/CookieBanner.vue'
import CartDrawer from '@/components/CartDrawer.vue'
</script>

<template>
  <div class="app-layout">
    <TheNavbar />
    <CartDrawer />
    <main class="main-content">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
    <TheFooter />
    <CookieBanner />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  padding-top: var(--navbar-total-height);
}

/* On tablet/mobile the secondary nav strip is hidden */
@media (max-width: 1024px) {
  .main-content {
    padding-top: var(--navbar-height);
  }
}
</style>

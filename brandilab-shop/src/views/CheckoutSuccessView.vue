<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useCart } from '@/composables/useCart'

const route = useRoute()
const { t } = useI18n()
const { clearCart } = useCart()

onMounted(() => {
  // If we arrived here via Stripe success URL with a session_id,
  // we can safely clear the cart.
  if (route.query.session_id) {
    clearCart()
  }
})
</script>

<template>
  <main class="thankyou-view">
    <div class="container">
      <div class="hero-section text-center">
        <h1 class="title">{{ t('thankyou.heroTitle', 'Grazie per il tuo acquisto!') }}</h1>
        <p class="subtitle">{{ t('thankyou.heroSubtitle', 'Il tuo ordine è in preparazione con cura.') }}</p>
      </div>

      <div class="content-section text-center">
        <p>Riceverai presto un'email con i dettagli del tuo ordine e la conferma di spedizione.</p>
        
        <div class="actions">
          <RouterLink to="/" class="btn btn-primary">{{ t('thankyou.backToShop', 'Torna al negozio') }}</RouterLink>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.thankyou-view {
  padding: 4rem 1rem;
  min-height: calc(100vh - var(--navbar-height));
}
.text-center {
  text-align: center;
}
.hero-section {
  margin-bottom: 3rem;
}
.title {
  font-size: 2.5rem;
  color: var(--color-primary);
  margin-bottom: 1rem;
}
.subtitle {
  font-size: 1.25rem;
  color: var(--color-text-light);
}
.actions {
  margin-top: 2rem;
}
.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: var(--color-accent);
  color: white;
  text-decoration: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  transition: opacity 0.2s;
}
.btn:hover {
  opacity: 0.9;
}
</style>

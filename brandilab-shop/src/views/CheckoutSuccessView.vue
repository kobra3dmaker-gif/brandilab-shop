<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useCart } from '@/composables/useCart'

const route = useRoute()
const { t } = useI18n()
const { clearCart } = useCart()

onMounted(() => {
  // Arrived via Stripe's success URL with a session_id: the order went through
  if (route.query.session_id) {
    clearCart()
  }
})
</script>

<template>
  <main class="thanks">
    <section class="field">
      <div class="container">
        <h1 class="title display">{{ t('thankyou.heroTitle') }}</h1>
        <p class="subtitle">{{ t('thankyou.heroSubtitle') }}</p>
      </div>
    </section>

    <div class="container body">
      <ol class="steps">
        <li>{{ t('thankyou.stepPrint') }}</li>
        <li>{{ t('thankyou.stepDeliver') }}</li>
      </ol>
      <p class="note">{{ t('thankyou.emailNote') }}</p>
      <RouterLink :to="{ path: '/', hash: '#catalogo' }" class="btn btn-ink">
        {{ t('thankyou.backToShop') }}
      </RouterLink>
    </div>
  </main>
</template>

<style scoped>
.field {
  background: var(--paper-2);
  color: var(--ink);
  padding: clamp(3rem, 8vw, 6.5rem) 0 clamp(2rem, 4vw, 3rem);
}

.title {
  font-size: clamp(2.5rem, 7.5vw, 6rem);
  max-width: 14ch;
  animation: rise-blur 1.1s var(--ease-apple) both;
}

.subtitle {
  margin-top: 1rem;
  font-size: clamp(1.1rem, 1.8vw, 1.4rem);
  font-weight: 600;
}

.body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.5rem;
  padding-top: 2rem;
  padding-bottom: clamp(3rem, 7vw, 6rem);
}

.steps {
  width: 100%;
  max-width: 520px;
  border-top: 2px solid var(--rule);
}

.steps li {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 0;
  font-weight: 700;
  border-bottom: 2px solid var(--rule);
}

.steps li::before {
  content: '';
  width: 0.7rem;
  height: 0.7rem;
  background: var(--blue);
}

.note {
  color: var(--ink-2);
  max-width: 55ch;
}
</style>

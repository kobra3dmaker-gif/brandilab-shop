<template>
  <Transition name="slide-up">
    <div v-if="showBanner" class="cookie-banner" role="dialog" aria-live="polite" :aria-label="t('cookies.title')">
      <p class="cookie-text">
        <strong>{{ t('cookies.title') }}</strong>
        {{ t('cookies.text') }}
      </p>
      <!-- Accept and decline are deliberately equally prominent (Garante Privacy guidelines) -->
      <div class="cookie-actions">
        <button class="cookie-btn" @click="decline">{{ t('cookies.decline') }}</button>
        <button class="cookie-btn" @click="accept">{{ t('cookies.accept') }}</button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useAnalyticsConsent } from '@/analytics'

const { t } = useI18n()
const { showBanner, accept, decline } = useAnalyticsConsent()
</script>

<style scoped>
.cookie-banner {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: 16px;
  z-index: 900; /* below the navbar (1000) and the Snipcart cart */
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 24px;
  background-color: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  font-family: var(--font-family);
}

.cookie-text {
  font-size: 0.95rem;
  line-height: 1.5;
}

.cookie-text strong {
  display: block;
  margin-bottom: 4px;
  color: var(--color-primary);
}

.cookie-actions {
  display: flex;
  gap: 12px;
}

.cookie-btn {
  flex: 1;
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  border: 2px solid var(--color-accent);
  background: transparent;
  color: var(--color-accent);
  font-weight: 600;
  transition: var(--transition);
}

.cookie-btn:hover {
  background: var(--color-accent);
  color: #fff;
}

.cookie-btn:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

@media (min-width: 640px) {
  .cookie-banner {
    flex-direction: row;
    align-items: center;
  }

  .cookie-actions {
    flex-shrink: 0;
  }
}
</style>

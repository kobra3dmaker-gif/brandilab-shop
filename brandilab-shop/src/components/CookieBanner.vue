<template>
  <Transition name="slide-up">
    <div v-if="showBanner" class="cookie-banner" role="dialog" aria-live="polite" :aria-label="t('cookies.title')">
      <p class="cookie-text">
        <strong>{{ t('cookies.title') }}</strong>
        {{ t('cookies.text') }}
      </p>
      <!-- Accept and decline are deliberately equally prominent (Garante Privacy guidelines) -->
      <div class="cookie-actions">
        <button class="btn btn-line cookie-btn" @click="decline">{{ t('cookies.decline') }}</button>
        <button class="btn btn-line cookie-btn" @click="accept">{{ t('cookies.accept') }}</button>
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
  left: 12px;
  right: 12px;
  bottom: 12px;
  z-index: 900;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: var(--paper);
  color: var(--ink);
  border: 2px solid var(--rule);
}

.cookie-text {
  font-size: 0.88rem;
  line-height: 1.45;
}

.cookie-text strong {
  display: block;
  margin-bottom: 4px;
  font-stretch: var(--semi-wide);
  font-size: 1rem;
}

.cookie-actions {
  display: flex;
  gap: 8px;
}

.cookie-btn {
  flex: 1;
  min-height: 44px;
  font-size: 0.9rem;
}

@media (min-width: 640px) {
  .cookie-banner {
    right: auto;
    left: 24px;
    bottom: 24px;
    max-width: 380px;
  }
}
</style>

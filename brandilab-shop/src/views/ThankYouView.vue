<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

import ebayLogo from '@/assets/logos/ebay.png'
import vintedLogo from '@/assets/logos/vinted.png'
import subitoLogo from '@/assets/logos/subito.png'
import tiktokLogo from '@/assets/logos/tiktok.png'

const { t } = useI18n()

const promoCode = 'GRAZIE15'
const copied = ref(false)

async function copyCode() {
  try {
    await navigator.clipboard.writeText(promoCode)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2500)
  } catch {
    // Fallback for older browsers / non-HTTPS contexts
    const textarea = document.createElement('textarea')
    textarea.value = promoCode
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2500)
  }
}
</script>

<template>
  <div class="thankyou-view">
    <!-- ───────── Hero ───────── -->
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-emoji" aria-hidden="true">🎉</div>
        <h1 class="hero-title">{{ t('thankyou.heroTitle') }}</h1>
        <p class="hero-subtitle">{{ t('thankyou.heroSubtitle') }}</p>
      </div>
    </section>

    <div class="container">
      <!-- ───────── Discount Code ───────── -->
      <section class="card promo-card">
        <div class="promo-badge">-15%</div>
        <h2 class="card-title">{{ t('thankyou.promoTitle') }}</h2>
        <p class="card-text">{{ t('thankyou.promoText') }}</p>

        <button class="promo-code-btn" @click="copyCode" :aria-label="t('thankyou.promoCopy')">
          <span class="promo-code">{{ promoCode }}</span>
          <span class="promo-copy-label">
            <svg
              v-if="!copied"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            <svg
              v-else
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {{ copied ? t('thankyou.promoCopied') : t('thankyou.promoCopy') }}
          </span>
        </button>
      </section>

      <div class="two-column-layout">
        <!-- ───────── Care Instructions ───────── -->
        <section class="card care-card">
          <div class="care-icon" aria-hidden="true">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h2 class="card-title">{{ t('thankyou.careTitle') }}</h2>
          <ul class="care-list">
            <li>{{ t('thankyou.careTip1') }}</li>
            <li>{{ t('thankyou.careTip2') }}</li>
            <li>{{ t('thankyou.careTip3') }}</li>
          </ul>
        </section>

        <!-- ───────── Shop Links ───────── -->
        <section class="card shops-card">
          <h2 class="card-title">{{ t('thankyou.shopsTitle') }}</h2>
          <p class="card-text">{{ t('thankyou.shopsText') }}</p>

          <div class="shop-buttons">
            <!-- TikTok Shop -->
            <a
              href="https://www.tiktok.com/@brandilab"
              target="_blank"
              rel="noopener noreferrer"
              class="shop-btn"
              :aria-label="t('thankyou.feedbackTiktokShop')"
            >
              <img :src="tiktokLogo" alt="TikTok Shop" class="shop-logo tiktok-logo" />
            </a>

            <!-- Vinted -->
            <a
              href="https://www.vinted.it/member/315209443"
              target="_blank"
              rel="noopener noreferrer"
              class="shop-btn"
              :aria-label="t('thankyou.feedbackVinted')"
            >
              <img :src="vintedLogo" alt="Vinted" class="shop-logo vinted-logo" />
            </a>

            <!-- eBay -->
            <a
              href="https://www.ebay.it/usr/brandilab"
              target="_blank"
              rel="noopener noreferrer"
              class="shop-btn"
              :aria-label="t('thankyou.feedbackEbay')"
            >
              <img :src="ebayLogo" alt="eBay" class="shop-logo ebay-logo" />
            </a>

            <!-- Subito -->
            <a
              href="https://www.subito.it/utente/131079177"
              target="_blank"
              rel="noopener noreferrer"
              class="shop-btn"
              :aria-label="t('thankyou.feedbackSubito')"
            >
              <img :src="subitoLogo" alt="Subito" class="shop-logo subito-logo" />
            </a>
          </div>
        </section>
      </div>

      <!-- ───────── Back to Shop ───────── -->
      <div class="bottom-actions">
        <RouterLink to="/shop" class="btn btn-primary">{{ t('thankyou.backToShop') }}</RouterLink>
        <RouterLink to="/" class="btn btn-outline">{{ t('thankyou.backHome') }}</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ─── Page Layout ─── */
.thankyou-view {
  background-color: var(--color-bg);
  min-height: calc(100vh - var(--navbar-height));
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 var(--container-padding) 4rem;
}

/* ─── Hero ─── */
.hero {
  background: var(--color-brand-dark);
  color: var(--color-on-dark);
  text-align: center;
  padding: 3.5rem var(--container-padding) 3rem;
}

.hero-inner {
  max-width: 540px;
  margin: 0 auto;
}

.hero-emoji {
  font-size: 3rem;
  margin-bottom: 0.75rem;
  animation: bounce 0.6s ease-out;
}

@keyframes bounce {
  0% { transform: scale(0); }
  60% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.hero-title {
  font-size: var(--font-size-3xl);
  font-weight: 800;
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
}

.hero-subtitle {
  font-size: var(--font-size-lg);
  opacity: 0.85;
  line-height: 1.5;
}

/* ─── Two Column Layout ─── */
.two-column-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-top: 2.5rem;
}

@media (min-width: 768px) {
  .two-column-layout {
    grid-template-columns: 1fr 1fr;
  }
}

.two-column-layout .card {
  margin-top: 0;
}

/* ─── Cards ─── */
.card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 2rem 1.5rem;
  box-shadow: var(--shadow-md);
  margin-top: 1.5rem;
}

.card-title {
  font-size: var(--font-size-xl);
  color: var(--color-primary);
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.card-text {
  color: var(--color-text-light);
  font-size: var(--font-size-sm);
  line-height: 1.6;
  margin-bottom: 1rem;
}

/* ─── Promo Card ─── */
.promo-card {
  text-align: center;
  position: relative;
  overflow: hidden;
  max-width: 540px;
  margin-left: auto;
  margin-right: auto;
}

.promo-badge {
  position: absolute;
  top: 16px;
  right: -28px;
  background: var(--color-accent);
  color: white;
  font-weight: 800;
  font-size: var(--font-size-xs);
  padding: 4px 36px;
  transform: rotate(45deg);
  letter-spacing: 0.05em;
}

.promo-code-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.875rem 1.25rem;
  margin-top: 0.5rem;
  border: 2px dashed var(--color-accent);
  border-radius: var(--radius-md);
  background: var(--color-accent-light);
  cursor: pointer;
  transition: var(--transition-fast);
  font-family: inherit;
}

.promo-code-btn:hover {
  background: var(--color-accent);
  color: white;
  border-style: solid;
}

.promo-code-btn:hover .promo-copy-label {
  color: white;
}

.promo-code {
  font-family: 'Courier New', Courier, monospace;
  font-size: var(--font-size-2xl);
  font-weight: 800;
  letter-spacing: 0.15em;
  color: var(--color-accent);
  transition: var(--transition-fast);
}

.promo-code-btn:hover .promo-code {
  color: white;
}

.promo-copy-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-weight: 600;
  white-space: nowrap;
  transition: var(--transition-fast);
}

/* ─── Care Card ─── */
.care-card {
  border-left: 4px solid var(--color-danger);
}

.care-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: rgba(231, 76, 60, 0.1);
  color: var(--color-danger);
  margin-bottom: 0.75rem;
}

.care-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.care-list li {
  position: relative;
  padding-left: 1.5rem;
  color: var(--color-text);
  font-size: var(--font-size-sm);
  line-height: 1.7;
}

.care-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--color-danger);
  font-weight: 700;
  font-size: 1.1em;
}

.care-list li + li {
  margin-top: 0.35rem;
}

/* ─── Shops Card ─── */
.shops-card {
  text-align: center;
}

.shop-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.shop-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.25rem 0.75rem;
  border-radius: var(--radius-md);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  text-decoration: none;
  transition: var(--transition-fast);
}

.shop-btn:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-accent);
}

.shop-logo {
  max-width: 140px;
  width: auto;
  object-fit: contain;
}

/* Base heights for optical balance */
.tiktok-logo {
  max-height: 56px;
  transform: scale(1.35);
}

.vinted-logo {
  max-height: 30px;
}

.ebay-logo {
  max-height: 30px;
}

.subito-logo {
  max-height: 64px;
  transform: scale(1.8);
}

/* ─── Bottom Actions ─── */
.bottom-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 2rem;
}

@media (min-width: 400px) {
  .bottom-actions {
    flex-direction: row;
    justify-content: center;
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.75rem;
  border-radius: var(--radius-sm);
  font-weight: 600;
  text-decoration: none;
  transition: var(--transition);
  font-size: var(--font-size-base);
  flex: 1;
}

.btn-primary {
  background: var(--color-accent);
  color: white;
}

.btn-primary:hover {
  background: var(--color-accent-hover);
  transform: translateY(-1px);
}

.btn-outline {
  background: transparent;
  color: var(--color-accent);
  border: 2px solid var(--color-accent);
}

.btn-outline:hover {
  background: var(--color-accent);
  color: white;
  transform: translateY(-1px);
}
</style>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const promoCode = 'GRAZIE10'
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
        <div class="promo-badge">-5€</div>
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

      <!-- ───────── Feedback CTAs ───────── -->
      <section class="card social-card">
        <h2 class="card-title">{{ t('thankyou.feedbackTitle') }}</h2>
        <p class="card-text">{{ t('thankyou.feedbackText') }}</p>

        <div class="feedback-buttons">
          <!-- TikTok Shop -->
          <a
            href="https://www.tiktok.com/@brandilab"
            target="_blank"
            rel="noopener noreferrer"
            class="social-btn tiktok-shop"
            :aria-label="t('thankyou.feedbackTiktokShop')"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78c.29 0 .57.04.84.12v-3.5a6.37 6.37 0 0 0-.84-.05A6.34 6.34 0 0 0 3.15 15.3 6.34 6.34 0 0 0 9.49 21.65a6.34 6.34 0 0 0 6.34-6.34V8.78a8.28 8.28 0 0 0 3.76.91V6.24a4.85 4.85 0 0 1 0 .45z" />
            </svg>
            <span>{{ t('thankyou.feedbackTiktokShop') }}</span>
            <span class="star-badge" aria-hidden="true">⭐</span>
          </a>

          <!-- Vinted -->
          <a
            href="https://www.vinted.it/member/315209443"
            target="_blank"
            rel="noopener noreferrer"
            class="social-btn vinted"
            :aria-label="t('thankyou.feedbackVinted')"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M7.5 2l3.04 14.76h.12L13.86 2H17l-4.62 20h-3.76L4 2h3.5z" />
            </svg>
            <span>{{ t('thankyou.feedbackVinted') }}</span>
            <span class="star-badge" aria-hidden="true">⭐</span>
          </a>

          <!-- eBay -->
          <a
            href="https://www.ebay.it/usr/brandilab"
            target="_blank"
            rel="noopener noreferrer"
            class="social-btn ebay"
            :aria-label="t('thankyou.feedbackEbay')"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M5.71 9.86c-2.28 0-3.71 1.28-3.71 3.21 0 2.12 1.6 3.22 3.84 3.22 1.08 0 2.16-.32 2.88-.84v-1.64H6.8c-.64.48-1.2.68-1.96.68-1.12 0-1.88-.6-2-1.56h6.12v-.72c0-2.16-1.36-3.35-3.25-3.35zm-1.8 2.52c.2-.88.88-1.48 1.8-1.48.88 0 1.48.56 1.64 1.48H3.91zM22 13.28c0-2.04-1.4-3.42-3.48-3.42-.92 0-1.72.32-2.28.84V6h-1.92v10.12h1.8l.08-.68c.56.56 1.36.88 2.28.88 2.12 0 3.52-1.4 3.52-3.44v.4zm-1.92-.04c0 1.12-.72 1.84-1.76 1.84s-1.76-.72-1.76-1.84.72-1.84 1.76-1.84 1.76.72 1.76 1.84zM14.24 16.12h-2v-.68c-.56.52-1.32.84-2.2.84-1.24 0-2.2-.76-2.2-1.92 0-1.36 1.12-2 2.72-2h1.68v-.2c0-.72-.52-1.16-1.44-1.16-.68 0-1.28.24-1.84.68l-.92-1.2c.84-.68 1.92-1 3.04-1 1.84 0 3.08.92 3.08 2.68v4h.08z" />
            </svg>
            <span>{{ t('thankyou.feedbackEbay') }}</span>
            <span class="star-badge" aria-hidden="true">⭐</span>
          </a>

          <!-- Subito -->
          <a
            href="https://www.subito.it/utente/131079177"
            target="_blank"
            rel="noopener noreferrer"
            class="social-btn subito"
            :aria-label="t('thankyou.feedbackSubito')"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-4-4 1.41-1.41L11 14.17l5.59-5.59L18 10l-7 7z" />
            </svg>
            <span>{{ t('thankyou.feedbackSubito') }}</span>
            <span class="star-badge" aria-hidden="true">⭐</span>
          </a>
        </div>
      </section>

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
  max-width: 540px;
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

/* ─── Social Card ─── */
.social-card {
  text-align: center;
}

.feedback-buttons {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.625rem;
}

@media (min-width: 400px) {
  .feedback-buttons {
    grid-template-columns: 1fr 1fr;
  }
}

.social-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: var(--font-size-sm);
  text-decoration: none;
  color: white;
  transition: var(--transition-fast);
  position: relative;
}

.social-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.social-btn.tiktok-shop {
  background: #010101;
}

.social-btn.vinted {
  background: #09b1ba;
}

.social-btn.ebay {
  background: #e53238;
}

.social-btn.subito {
  background: #f76707;
}

.star-badge {
  font-size: 0.85em;
  margin-left: 0.125rem;
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

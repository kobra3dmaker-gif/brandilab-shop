<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { analyticsEnabled, useAnalyticsConsent } from '@/analytics'

import ebayLogo from '@/assets/logos/footer/ebay.png'
import vintedLogo from '@/assets/logos/footer/vinted.jpg'
import subitoLogo from '@/assets/logos/footer/subito.jpg'
import tiktokLogo from '@/assets/logos/footer/tiktok.png'

const { t } = useI18n()
const { reopenBanner } = useAnalyticsConsent()

const marketplaces = [
  { name: 'TikTok Shop', href: 'https://www.tiktok.com/@brandilab', logo: tiktokLogo },
  { name: 'Vinted', href: 'https://www.vinted.it/member/315209443', logo: vintedLogo },
  { name: 'eBay', href: 'https://www.ebay.it/usr/brandilab', logo: ebayLogo },
  { name: 'Subito', href: 'https://www.subito.it/utente/131079177', logo: subitoLogo },
]
</script>

<template>
  <footer class="footer">
    <div class="inner">
      <p class="wordmark" aria-hidden="true">
        <span class="ch">BrandiLab</span>
      </p>
      <p class="tagline">{{ t('footer.tagline') }}</p>

      <div class="cols">
        <nav class="col" :aria-label="t('footer.shopTitle')">
          <h2 class="col-title">{{ t('footer.shopTitle') }}</h2>
          <RouterLink :to="{ path: '/', hash: '#catalogo' }">{{ t('nav.catalogue') }}</RouterLink>
          <RouterLink to="/about">{{ t('footer.ourStory') }}</RouterLink>
          <RouterLink :to="{ path: '/contact', query: { type: 'custom' } }">{{ t('footer.custom') }}</RouterLink>
        </nav>

        <nav class="col" :aria-label="t('footer.supportTitle')">
          <h2 class="col-title">{{ t('footer.supportTitle') }}</h2>
          <RouterLink to="/account">{{ t('nav.myOrders') }}</RouterLink>
          <RouterLink :to="{ path: '/contact', hash: '#faq' }">{{ t('footer.faq') }}</RouterLink>
          <RouterLink :to="{ path: '/contact', hash: '#faq' }">{{ t('footer.shipping') }}</RouterLink>
          <RouterLink to="/contact">{{ t('nav.contact') }}</RouterLink>
        </nav>

        <div class="col">
          <h2 class="col-title">{{ t('footer.contactTitle') }}</h2>
          <a href="mailto:brandilab3d@gmail.com">brandilab3d@gmail.com</a>
          <span>{{ t('footer.location') }}</span>
        </div>

        <div class="col">
          <h2 class="col-title">{{ t('footer.socialTitle') }}</h2>
          <ul class="markets">
            <li v-for="m in marketplaces" :key="m.name">
              <a :href="m.href" target="_blank" rel="noopener noreferrer">
                <img :src="m.logo" alt="" width="24" height="24" loading="lazy" />
                {{ m.name }}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div class="bottom">
        <p>{{ t('footer.rights') }} · {{ t('footer.vat') }} 04260600368 · 41026 Pavullo nel Frignano (MO)</p>
        <button v-if="analyticsEnabled" class="cookie-link" @click="reopenBanner">{{ t('footer.cookiePreferences') }}</button>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: var(--paper-2);
  color: var(--ink);
}

.inner {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: clamp(2.5rem, 6vw, 4.5rem) var(--gutter) 1.5rem;
}

.wordmark {
  font-stretch: var(--wide);
  font-weight: 900;
  font-size: clamp(3.25rem, 13.5vw, 13rem);
  line-height: 0.82;
  letter-spacing: -0.055em;
  color: var(--ink);
  margin-left: -0.04em;
  display: flex;
  overflow: clip;
  padding-bottom: 0.04em;
}

.ch {
  display: inline-block;
}

/* Letters rise out of the fold as the footer comes into view */
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .ch {
      animation: letter-rise linear both;
      animation-timeline: view();
      animation-range: entry 0% entry 85%;
    }
  }
}

@keyframes letter-rise {
  from {
    translate: 0 105%;
  }
}

.tagline {
  max-width: 52ch;
  margin-top: 1.25rem;
  color: var(--ink-2);
}

.cols {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2rem 1.5rem;
  margin-top: clamp(2rem, 5vw, 3.5rem);
  padding-top: 1.5rem;
  border-top: 2px solid var(--rule);
}

@media (min-width: 900px) {
  .cols {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 899px) {
  .col:nth-child(3) {
    grid-column: 1 / -1;
  }
}

.col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.55rem;
  min-width: 0;
}

.col-title {
  font-stretch: var(--semi-wide);
  font-weight: 800;
  font-size: 0.95rem;
  color: var(--ink);
  margin-bottom: 0.25rem;
}

.col a,
.col span {
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.col a {
  text-decoration: underline;
  text-decoration-color: transparent;
  text-underline-offset: 3px;
  transition: text-decoration-color 0.15s ease;
}

@media (hover: hover) and (pointer: fine) {
  .col a:hover {
    text-decoration-color: currentColor;
  }
}

.markets {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.markets a {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
}

.markets img {
  width: 24px;
  height: 24px;
  object-fit: cover;
}

.bottom {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.75rem 1.5rem;
  margin-top: clamp(2rem, 5vw, 3.5rem);
  padding-top: 1rem;
  border-top: 1px solid var(--rule-soft);
  font-size: 0.85rem;
  color: var(--ink-3);
}

.cookie-link {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.footer :focus-visible {
  outline-color: var(--focus);
}
</style>

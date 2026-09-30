<template>
  <footer class="footer">
    <div class="footer-container">
      <div class="footer-grid">
        <div class="footer-col brand-col">
          <img class="footer-logo" :src="logo" :alt="t('footer.logoAlt')" width="80" height="80" loading="lazy">
          <h3 class="footer-brand">BrandiLab</h3>
          <p class="footer-text">{{ t('footer.tagline') }}</p>
        </div>
        
        <div class="footer-col">
          <h4 class="col-title">{{ t('footer.quickLinks') }}</h4>
          <nav class="footer-nav">
            <RouterLink to="/">{{ t('nav.home') }}</RouterLink>
            <RouterLink to="/shop">{{ t('nav.shop') }}</RouterLink>
            <RouterLink to="/about">{{ t('nav.about') }}</RouterLink>
            <RouterLink to="/contact">{{ t('nav.contact') }}</RouterLink>
          </nav>
        </div>

        <div class="footer-col">
          <h4 class="col-title">{{ t('footer.supportTitle') }}</h4>
          <nav class="footer-nav">
            <RouterLink to="/contact">{{ t('footer.helpCenter') }}</RouterLink>
            <RouterLink to="/about#materials">{{ t('footer.shippingPolicy') }}</RouterLink>
            <RouterLink to="/faq">{{ t('footer.returns') }}</RouterLink>
            <RouterLink to="/faq">{{ t('footer.faq') }}</RouterLink>
          </nav>
        </div>

        <div class="footer-col">
          <h4 class="col-title">{{ t('footer.aboutTitle') }}</h4>
          <nav class="footer-nav">
            <RouterLink to="/about#story">{{ t('footer.ourStory') }}</RouterLink>
            <RouterLink to="/about#materials">{{ t('footer.materials') }}</RouterLink>
          </nav>
        </div>

        <div class="footer-col">
          <h4 class="col-title">{{ t('footer.contactTitle') }}</h4>
          <address class="footer-address">
            <p>{{ t('footer.emailLabel') }}: <a href="mailto:kobra3dmaker@gmail.com">kobra3dmaker@gmail.com</a></p>
            <p>{{ t('footer.locationLabel') }}: {{ t('footer.location') }}</p>
          </address>

          <h4 class="col-title social-heading">{{ t('footer.socialTitle') }}</h4>
          <div class="social-links-footer">
            <a href="https://www.tiktok.com/@brandilab" target="_blank" rel="noopener noreferrer" aria-label="TikTok Shop">
              <img :src="tiktokLogo" alt="TikTok Shop" class="footer-social-logo" />
            </a>
            <a href="https://www.vinted.it/member/315209443" target="_blank" rel="noopener noreferrer" aria-label="Vinted">
              <img :src="vintedLogo" alt="Vinted" class="footer-social-logo" />
            </a>
            <a href="https://www.ebay.it/usr/brandilab" target="_blank" rel="noopener noreferrer" aria-label="eBay">
              <img :src="ebayLogo" alt="eBay" class="footer-social-logo" />
            </a>
            <a href="https://www.subito.it/utente/131079177" target="_blank" rel="noopener noreferrer" aria-label="Subito">
              <img :src="subitoLogo" alt="Subito" class="footer-social-logo" />
            </a>
          </div>
        </div>
      </div>
    </div>
    
    <div class="footer-bottom">
      <div class="footer-container bottom-container">
        <p class="copyright">
          {{ t('footer.rights') }}
          <button v-if="analyticsEnabled" class="cookie-link" @click="reopenBanner">{{ t('footer.cookiePreferences') }}</button>
        </p>
        <div class="bottom-links">
          <RouterLink to="/contact">{{ t('footer.helpCenter') }}</RouterLink>
          <RouterLink to="/about">{{ t('footer.aboutTitle') }}</RouterLink>
          <RouterLink to="/about#materials">{{ t('footer.shippingPolicy') }}</RouterLink>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import logo from '@/assets/logo.webp';
import { analyticsEnabled, useAnalyticsConsent } from '@/analytics';

import ebayLogo from '@/assets/logos/footer/ebay.png'
import vintedLogo from '@/assets/logos/footer/vinted.jpg'
import subitoLogo from '@/assets/logos/footer/subito.jpg'
import tiktokLogo from '@/assets/logos/footer/tiktok.png'

const { t } = useI18n();
const { reopenBanner } = useAnalyticsConsent();
</script>

<style scoped>
.footer {
  background-color: var(--color-brand-dark);
  color: var(--color-on-dark);
  font-family: var(--font-family, sans-serif);
  padding-top: 48px;
}

.footer-container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 24px;
}

.footer-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
  margin-bottom: 48px;
}

@media (min-width: 640px) {
  .footer-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 960px) {
  .footer-grid {
    grid-template-columns: 1.8fr 1fr 1fr 1fr 1.2fr;
    gap: 24px;
  }
}

.footer-logo {
  display: block;
  width: 80px;
  height: 80px;
  max-width: none;
  object-fit: contain;
  margin-bottom: 12px;
}

.cookie-link {
  background: none;
  border: none;
  padding: 0;
  margin-left: 12px;
  color: inherit;
  font-size: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.cookie-link:hover {
  color: var(--color-accent);
}

.footer-brand {
  font-size: 1.25rem;
  font-weight: 800;
  margin: 0 0 12px 0;
  color: var(--color-on-dark);
}

.footer-text {
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.5;
  margin: 0;
  font-size: 0.85rem;
}

.col-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: var(--color-on-dark);
}

.social-heading {
  margin-top: 20px;
}

.footer-nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.footer-nav a {
  color: rgba(255, 255, 255, 0.65);
  text-decoration: none;
  transition: var(--transition, all 0.3s ease);
  font-size: 0.875rem;
}

.footer-nav a:hover {
  color: var(--color-accent, #16a085);
}

.footer-address {
  font-style: normal;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.5;
  font-size: 0.875rem;
}

.footer-address p {
  margin: 0 0 6px 0;
}

.footer-address a {
  color: rgba(255, 255, 255, 0.65);
  text-decoration: none;
  transition: var(--transition, all 0.3s ease);
}

.footer-address a:hover {
  color: var(--color-accent, #16a085);
}

.social-links-footer {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.social-links-footer a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition, all 0.3s ease);
}

.social-links-footer a:hover {
  transform: translateY(-2px) scale(1.08);
}

.footer-social-logo {
  height: 30px;
  width: 30px;
  object-fit: cover;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 20px 0;
  background-color: rgba(0, 0, 0, 0.15);
}

.bottom-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

@media (min-width: 640px) {
  .bottom-container {
    flex-direction: row;
    justify-content: space-between;
  }
}

.copyright {
  margin: 0;
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.8rem;
}

.bottom-links {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  justify-content: center;
}

.bottom-links a {
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.8rem;
  text-decoration: none;
  transition: var(--transition-fast);
}

.bottom-links a:hover {
  color: var(--color-accent);
}
</style>

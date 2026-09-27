<script setup lang="ts">
import { useProducts } from '@/composables/useProducts'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import TheHero from '@/components/TheHero.vue'
import ProductGrid from '@/components/ProductGrid.vue'

const { products, loading } = useProducts()
const { t } = useI18n()
</script>

<template>
  <main class="home-view">
    <TheHero />

    <section class="section featured-section">
      <div class="container">
        <h2 class="section-title">{{ t('home.ourProducts') }}</h2>
        <ProductGrid :products="products" :loading="loading" />
      </div>
    </section>

    <section class="section why-section">
      <div class="container">
        <h2 class="section-title">{{ t('home.whyTitle') }}</h2>
        <div class="values-grid">
          <div class="value-card">
            <div class="value-icon">🎯</div>
            <h3>{{ t('home.precisionTitle') }}</h3>
            <p>{{ t('home.precisionText') }}</p>
          </div>
          <div class="value-card">
            <div class="value-icon">🎨</div>
            <h3>{{ t('home.customTitle') }}</h3>
            <p>{{ t('home.customText') }}</p>
          </div>
          <div class="value-card">
            <div class="value-icon">🌱</div>
            <h3>{{ t('home.ecoTitle') }}</h3>
            <p>{{ t('home.ecoText') }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section cta-section">
      <div class="container cta-content">
        <h2>{{ t('home.ctaTitle') }}</h2>
        <p>{{ t('home.ctaText') }}</p>
        <RouterLink to="/shop" class="btn btn-primary">{{ t('home.ctaButton') }}</RouterLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.home-view {
  display: flex;
  flex-direction: column;
}

.section {
  padding: 5rem 1rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  text-align: center;
  font-size: 2rem;
  margin-bottom: 3rem;
  color: var(--color-primary);
}

.why-section {
  background-color: var(--color-bg);
}

.values-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.value-card {
  background: var(--color-surface);
  padding: 2rem;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  text-align: center;
  transition: var(--transition);
}

.value-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-5px);
}

.value-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.value-card h3 {
  margin-bottom: 1rem;
  color: var(--color-primary);
}

.value-card p {
  color: var(--color-text-light);
  line-height: 1.6;
}

.cta-section {
  text-align: center;
  background-color: var(--color-surface);
}

.cta-content h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: var(--color-primary);
}

.cta-content p {
  color: var(--color-text-light);
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.btn {
  display: inline-block;
  padding: 0.8rem 2rem;
  border-radius: var(--radius-sm);
  font-weight: 600;
  text-decoration: none;
  transition: var(--transition);
}

.btn-primary {
  background-color: var(--color-accent);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-accent-hover);
}
</style>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <main class="about">
    <header class="masthead-field">
      <div class="container">
        <h1 class="title display">{{ t('about.title') }}</h1>
        <p class="subtitle">{{ t('about.subtitle') }}</p>
      </div>
    </header>

    <section v-reveal class="story container" aria-labelledby="story-title">
      <h2 id="story-title" class="section-title display">{{ t('about.storyTitle') }}</h2>
      <div class="story-cols">
        <p>{{ t('about.story1') }}</p>
        <p>{{ t('about.story2') }}</p>
      </div>
    </section>

    <section v-reveal class="process container" aria-labelledby="process-title">
      <h2 id="process-title" class="section-title display">{{ t('about.processTitle') }}</h2>
      <ol class="steps">
        <li class="step">
          <h3>{{ t('about.designTitle') }}</h3>
          <p>{{ t('about.designText') }}</p>
        </li>
        <li class="step">
          <h3>{{ t('about.printTitle') }}</h3>
          <p>{{ t('about.printText') }}</p>
        </li>
        <li class="step">
          <h3>{{ t('about.shipTitle') }}</h3>
          <p>{{ t('about.shipText') }}</p>
        </li>
      </ol>
    </section>

    <section class="mission" aria-labelledby="mission-title">
      <div class="container">
        <h2 id="mission-title" class="mission-title">{{ t('about.missionTitle') }}</h2>
        <p class="mission-text">{{ t('about.mission') }}</p>
        <RouterLink :to="{ path: '/', hash: '#catalogo' }" class="btn btn-ink">
          {{ t('about.cta') }}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </RouterLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.masthead-field {
  background: var(--paper-2);
  color: var(--ink);
  padding: clamp(2.5rem, 7vw, 6rem) 0 clamp(2rem, 4vw, 3rem);
}

.title {
  font-size: clamp(2.75rem, 8vw, 6rem);
  max-width: 12ch;
  animation: rise-blur 1.1s var(--ease-apple) both;
}

.subtitle {
  animation: rise 1s var(--ease-apple) 200ms both;
}

.subtitle {
  margin-top: 1rem;
  font-size: clamp(1.1rem, 1.8vw, 1.4rem);
  font-weight: 600;
}

.section-title {
  font-size: clamp(1.9rem, 4vw, 3.25rem);
  padding: 1.25rem 0 1.5rem;
  border-top: 2px solid var(--rule);
}

.story {
  padding-top: clamp(2.5rem, 6vw, 4.5rem);
}

.story-cols {
  display: grid;
  gap: 1.25rem 3rem;
  font-size: 1.08rem;
  line-height: 1.65;
  color: var(--ink-2);
}

.story-cols p {
  max-width: 62ch;
}

@media (min-width: 860px) {
  .story-cols {
    grid-template-columns: 1fr 1fr;
  }
}

.process {
  padding-top: clamp(2.5rem, 6vw, 4.5rem);
  padding-bottom: clamp(2.5rem, 6vw, 4.5rem);
}

.steps {
  display: grid;
  gap: 0;
}

.step {
  padding: 1.25rem 0;
  border-top: 2px solid var(--rule);
}

.step h3 {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-stretch: var(--semi-wide);
  font-weight: 800;
  font-size: 1.35rem;
  letter-spacing: -0.02em;
  margin-bottom: 0.5rem;
}

.step h3::before {
  content: '';
  width: 0.85rem;
  height: 0.85rem;
  background: var(--blue);
}

.step p {
  color: var(--ink-2);
  max-width: 38ch;
}

@media (min-width: 860px) {
  .steps {
    grid-template-columns: repeat(3, 1fr);
    border-top: 2px solid var(--rule);
  }

  .step {
    border-top: none;
    padding: 1.5rem 1.75rem 0 0;
  }

  .step + .step {
    padding-left: 1.75rem;
    border-left: 2px solid var(--rule);
  }
}

.mission {
  background: var(--tile-dark);
  color: var(--on-tile-dark);
  padding: clamp(3rem, 7vw, 5.5rem) 0;
}

.mission-title {
  font-stretch: var(--semi-wide);
  font-weight: 800;
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.mission-text {
  font-stretch: var(--semi-wide);
  font-weight: 650;
  font-size: clamp(1.4rem, 2.8vw, 2.3rem);
  line-height: 1.22;
  letter-spacing: -0.02em;
  max-width: 32ch;
  margin-bottom: 2rem;
  text-wrap: pretty;
}

.mission .btn-ink {
  background: var(--blue);
  color: var(--on-blue);
}

.mission .btn-ink:hover {
  background: var(--blue-hover);
}
</style>

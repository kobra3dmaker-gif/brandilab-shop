<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ContactForm from '@/components/ContactForm.vue'

const { t } = useI18n()

const EMAIL = 'brandilab3d@gmail.com'

const openFaq = ref<string | null>(null)

// Keys under contact.faqs in src/i18n/{it,en}.ts
const faqs = ['materials', 'shipping', 'custom'] as const

function toggleFaq(key: string) {
  openFaq.value = openFaq.value === key ? null : key
}
</script>

<template>
  <main class="contact">
    <header class="head container">
      <h1 class="title display">{{ t('contact.title') }}</h1>
      <p class="subtitle">{{ t('contact.subtitle') }}</p>
    </header>

    <div class="layout container">
      <div class="form-col">
        <ContactForm />
      </div>

      <dl class="info">
        <div>
          <dt>{{ t('contact.emailTitle') }}</dt>
          <dd><a :href="`mailto:${EMAIL}`">{{ EMAIL }}</a></dd>
        </div>
        <div>
          <dt>{{ t('contact.locationTitle') }}</dt>
          <dd>{{ t('contact.location') }}</dd>
        </div>
        <div>
          <dt>{{ t('contact.responseTitle') }}</dt>
          <dd>{{ t('contact.response') }}</dd>
        </div>
      </dl>
    </div>

    <section id="faq" class="faq container" aria-labelledby="faq-title">
      <h2 id="faq-title" class="faq-title display">{{ t('contact.faqTitle') }}</h2>
      <div v-for="key in faqs" :key="key" class="faq-item" :class="{ open: openFaq === key }">
        <h3>
          <button
            class="faq-q"
            :aria-expanded="openFaq === key"
            :aria-controls="`faq-${key}`"
            @click="toggleFaq(key)"
          >
            {{ t(`contact.faqs.${key}.question`) }}
            <svg class="faq-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          </button>
        </h3>
        <div :id="`faq-${key}`" class="faq-a" role="region">
          <div class="faq-a-inner">
            <p>{{ t(`contact.faqs.${key}.answer`) }}</p>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.contact {
  padding-bottom: clamp(3rem, 7vw, 6rem);
}

.head {
  padding-top: clamp(2rem, 5vw, 4rem);
  padding-bottom: clamp(1.5rem, 3vw, 2.5rem);
}

.title {
  font-size: clamp(2.75rem, 8vw, 6rem);
  animation: rise-blur 1.1s var(--ease-apple) both;
}

.subtitle,
.layout {
  animation: rise 1s var(--ease-apple) 200ms both;
}

.subtitle {
  margin-top: 1rem;
  font-size: clamp(1.05rem, 1.6vw, 1.3rem);
  color: var(--ink-2);
  max-width: 48ch;
}

.layout {
  display: grid;
  gap: 2.5rem;
  padding-top: 1.75rem;
  border-top: 2px solid var(--rule);
}

@media (min-width: 900px) {
  .layout {
    grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
    gap: 4rem;
  }
}

.info > div {
  padding: 1rem 0;
  border-bottom: 1px solid var(--rule-soft);
}

.info > div:first-child {
  padding-top: 0;
}

.info dt {
  font-weight: 800;
  font-stretch: var(--semi-wide);
  margin-bottom: 0.25rem;
}

.info dd {
  color: var(--ink-2);
  overflow-wrap: anywhere;
}

.info a {
  color: var(--ink);
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.faq {
  margin-top: clamp(3rem, 7vw, 5rem);
  max-width: 980px;
}

.faq-title {
  font-size: clamp(1.9rem, 4vw, 3.25rem);
  padding: 1.25rem 0 1rem;
  border-top: 2px solid var(--rule);
}

.faq-item {
  border-bottom: 2px solid var(--rule);
}

.faq-q {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1.1rem 0;
  text-align: left;
  font-stretch: var(--semi-wide);
  font-weight: 750;
  font-size: clamp(1.05rem, 1.6vw, 1.25rem);
  letter-spacing: -0.01em;
}

.faq-icon {
  flex-shrink: 0;
  transition: transform 220ms var(--ease-out);
}

.faq-item.open .faq-icon {
  transform: rotate(45deg);
}

.faq-a {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 240ms var(--ease-out);
}

.faq-item.open .faq-a {
  grid-template-rows: 1fr;
}

.faq-a-inner {
  overflow: hidden;
}

.faq-a p {
  padding-bottom: 1.25rem;
  color: var(--ink-2);
  max-width: 65ch;
}

.faq-item:not(.open) .faq-a-inner {
  visibility: hidden;
  transition: visibility 0s 240ms;
}

@media (prefers-reduced-motion: reduce) {
  .faq-a,
  .faq-icon {
    transition: none;
  }
}
</style>

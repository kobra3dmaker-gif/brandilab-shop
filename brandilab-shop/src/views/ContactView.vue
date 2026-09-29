<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const form = ref({
  name: '',
  email: '',
  subject: '',
  message: ''
})

const isSubmitted = ref(false)
const openFaqIndex = ref<number | null>(null)

// Keys under contact.faqs in src/i18n/{it,en}.ts
const faqs = ['materials', 'shipping', 'custom'] as const

const submitForm = () => {
  isSubmitted.value = true
  form.value = { name: '', email: '', subject: '', message: '' }
  
  setTimeout(() => {
    isSubmitted.value = false
  }, 5000)
}

const toggleFaq = (index: number) => {
  openFaqIndex.value = openFaqIndex.value === index ? null : index
}
</script>

<template>
  <main class="contact-view">
    <div class="container">
      <header class="page-header">
        <h1 class="title">{{ t('contact.title') }}</h1>
        <p class="subtitle">{{ t('contact.subtitle') }}</p>
      </header>

      <div class="contact-layout">
        <div class="contact-form-container">
          <div v-if="isSubmitted" class="success-message">
            <h3>{{ t('contact.thanksTitle') }}</h3>
            <p>{{ t('contact.thanksText') }}</p>
          </div>
          
          <form v-else @submit.prevent="submitForm" class="contact-form">
            <div class="form-group">
              <label for="name">{{ t('contact.nameLabel') }}</label>
              <input type="text" id="name" v-model="form.name" required :placeholder="t('contact.namePlaceholder')" />
            </div>
            
            <div class="form-group">
              <label for="email">{{ t('contact.emailLabel') }}</label>
              <input type="email" id="email" v-model="form.email" required :placeholder="t('contact.emailPlaceholder')" />
            </div>
            
            <div class="form-group">
              <label for="subject">{{ t('contact.subjectLabel') }}</label>
              <input type="text" id="subject" v-model="form.subject" required :placeholder="t('contact.subjectPlaceholder')" />
            </div>
            
            <div class="form-group">
              <label for="message">{{ t('contact.messageLabel') }}</label>
              <textarea id="message" v-model="form.message" required rows="5" :placeholder="t('contact.messagePlaceholder')"></textarea>
            </div>
            
            <button type="submit" class="btn btn-primary">{{ t('contact.send') }}</button>
          </form>
        </div>

        <div class="contact-info">
          <div class="info-card">
            <div class="info-icon">✉️</div>
            <h3>{{ t('contact.emailTitle') }}</h3>
            <p>kobra3dmaker@gmail.com</p>
          </div>
          
          <div class="info-card">
            <div class="info-icon">📍</div>
            <h3>{{ t('contact.locationTitle') }}</h3>
            <p>{{ t('contact.location') }}</p>
          </div>
          
          <div class="info-card">
            <div class="info-icon">⏱️</div>
            <h3>{{ t('contact.responseTitle') }}</h3>
            <p>{{ t('contact.response') }}</p>
          </div>
        </div>
      </div>

      <section class="faq-section">
        <h2 class="section-title">{{ t('contact.faqTitle') }}</h2>
        <div class="faq-accordion">
          <div 
            v-for="(faq, index) in faqs" 
            :key="faq"
            class="faq-item"
            :class="{ active: openFaqIndex === index }"
          >
            <button class="faq-question" @click="toggleFaq(index)">
              {{ t(`contact.faqs.${faq}.question`) }}
              <span class="faq-icon">{{ openFaqIndex === index ? '−' : '+' }}</span>
            </button>
            <div class="faq-answer" v-show="openFaqIndex === index">
              <p>{{ t(`contact.faqs.${faq}.answer`) }}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.contact-view {
  padding: 4rem 1rem 6rem;
  background-color: var(--color-bg);
  min-height: calc(100vh - var(--navbar-height));
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 4rem;
}

.title {
  font-size: 2.5rem;
  color: var(--color-primary);
  margin-bottom: 1rem;
}

.subtitle {
  color: var(--color-text-light);
  font-size: 1.2rem;
}

.contact-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 4rem;
  margin-bottom: 6rem;
}

@media (min-width: 768px) {
  .contact-layout {
    grid-template-columns: 3fr 2fr;
  }
}

.contact-form-container {
  background-color: var(--color-surface);
  padding: 2.5rem;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: var(--color-primary);
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 1rem;
  transition: var(--transition);
  background-color: var(--color-bg);
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(22, 160, 133, 0.1);
}

.btn {
  display: inline-block;
  padding: 1rem 2rem;
  border-radius: var(--radius-sm);
  font-weight: 600;
  text-align: center;
  transition: var(--transition);
  cursor: pointer;
  border: none;
  font-size: 1rem;
  width: 100%;
}

.btn-primary {
  background-color: var(--color-accent);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-accent-hover);
}

.success-message {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-accent);
}

.success-message h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.success-message p {
  color: var(--color-text);
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-card {
  background-color: var(--color-surface);
  padding: 2rem;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  text-align: center;
}

.info-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.info-card h3 {
  color: var(--color-primary);
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
}

.info-card p {
  color: var(--color-text-light);
}

.faq-section {
  max-width: 800px;
  margin: 0 auto;
}

.section-title {
  text-align: center;
  font-size: 2rem;
  color: var(--color-primary);
  margin-bottom: 2.5rem;
}

.faq-accordion {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.faq-item {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.faq-item.active {
  border-color: var(--color-accent);
}

.faq-question {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: none;
  border: none;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-primary);
  cursor: pointer;
  text-align: left;
}

.faq-icon {
  font-size: 1.5rem;
  color: var(--color-accent);
}

.faq-answer {
  padding: 0 1.5rem 1.5rem;
  color: var(--color-text-light);
  line-height: 1.6;
}
</style>

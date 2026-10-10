<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'

type AuthMode = 'login' | 'register' | 'forgot' | 'reset'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { login, loginDemo, register, requestPasswordReset, confirmPasswordReset, loading } = useAuth()

function resolveInitialMode(): AuthMode {
  if (route.name === 'register' || route.query.mode === 'register') return 'register'
  if (route.name === 'forgot-password' || route.query.mode === 'forgot') return 'forgot'
  if (route.name === 'reset-password' || route.query.token) return 'reset'
  return 'login'
}

const mode = ref<AuthMode>(resolveInitialMode())
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const phone = ref('')
const password = ref('')
const showPassword = ref(false)
const errorMessage = ref('')
const resetEmailSent = ref(false)
const resetSuccess = ref(false)

watch(
  () => route.fullPath,
  () => {
    mode.value = resolveInitialMode()
    errorMessage.value = ''
  },
)

const headingTitle = computed(() => {
  if (mode.value === 'register') return t('portal.auth.registerTitle')
  if (mode.value === 'forgot') return t('portal.auth.forgotTitle')
  if (mode.value === 'reset') return t('portal.auth.resetTitle')
  return t('portal.auth.loginTitle')
})

const headingSubtitle = computed(() => {
  if (mode.value === 'register') return t('portal.auth.registerSubtitle')
  if (mode.value === 'forgot') return t('portal.auth.forgotSubtitle')
  if (mode.value === 'reset') return t('portal.auth.resetSubtitle')
  return t('portal.auth.loginSubtitle')
})

function switchMode(next: AuthMode) {
  mode.value = next
  errorMessage.value = ''
  resetEmailSent.value = false
}

async function onSubmit() {
  errorMessage.value = ''
  const redirectTarget = typeof route.query.redirect === 'string' ? route.query.redirect : '/account'

  if (mode.value === 'login') {
    if (!email.value.trim() || !password.value) {
      errorMessage.value = t('portal.auth.errFields')
      return
    }
    const res = await login(email.value, password.value)
    if (!res.ok) {
      errorMessage.value =
        res.error === 'server_unreachable'
          ? t('portal.auth.errServer')
          : t('portal.auth.errInvalidCredentials')
      return
    }
    router.push(redirectTarget)
    return
  }

  if (mode.value === 'register') {
    if (!firstName.value.trim() || !lastName.value.trim() || !email.value.trim() || password.value.length < 8) {
      errorMessage.value = t('portal.auth.errFields')
      return
    }
    const res = await register({
      firstName: firstName.value,
      lastName: lastName.value,
      email: email.value,
      phone: phone.value,
      password: password.value,
    })
    if (!res.ok) {
      errorMessage.value =
        res.error === 'email_already_registered'
          ? t('portal.auth.errEmailExists')
          : t('portal.auth.errFields')
      return
    }
    router.push(redirectTarget)
    return
  }

  if (mode.value === 'forgot') {
    if (!email.value.trim()) {
      errorMessage.value = t('portal.auth.errFields')
      return
    }
    await requestPasswordReset(email.value)
    resetEmailSent.value = true
    return
  }

  if (mode.value === 'reset') {
    const resetToken = String(route.query.token || '')
    if (password.value.length < 8) {
      errorMessage.value = t('portal.auth.errFields')
      return
    }
    const res = await confirmPasswordReset(resetToken, password.value)
    if (!res.ok) {
      errorMessage.value = t('portal.auth.errFields')
      return
    }
    resetSuccess.value = true
  }
}

function handleDemoLogin() {
  loginDemo()
  const redirectTarget = typeof route.query.redirect === 'string' ? route.query.redirect : '/account'
  router.push(redirectTarget)
}
</script>

<template>
  <main class="auth-page">
    <div class="container auth-grid">
      <!-- Form Card -->
      <section class="auth-card">
        <header class="auth-head">
          <p class="eyebrow">BrandiLab — {{ t('nav.account') }}</p>
          <h1 class="auth-title display">{{ headingTitle }}</h1>
          <p class="auth-subtitle">{{ headingSubtitle }}</p>
        </header>

        <!-- Forgot Password Confirmation State -->
        <div v-if="mode === 'forgot' && resetEmailSent" class="notice-box">
          <h2>{{ t('portal.auth.resetSentTitle') }}</h2>
          <p>{{ t('portal.auth.resetSentText') }}</p>
          <button type="button" class="btn btn-ink" @click="switchMode('login')">
            {{ t('portal.auth.backToLogin') }}
          </button>
        </div>

        <!-- Reset Password Success State -->
        <div v-else-if="mode === 'reset' && resetSuccess" class="notice-box">
          <h2>{{ t('portal.auth.resetDoneTitle') }}</h2>
          <p>{{ t('portal.auth.resetDoneText') }}</p>
          <button type="button" class="btn btn-ink" @click="switchMode('login')">
            {{ t('portal.auth.loginCta') }}
          </button>
        </div>

        <!-- Main Form -->
        <form v-else class="auth-form" novalidate @submit.prevent="onSubmit">
          <div v-if="mode === 'register'" class="row-2">
            <label class="field">
              <span class="field-label">{{ t('portal.auth.firstName') }} *</span>
              <input v-model="firstName" type="text" autocomplete="given-name" required class="input" />
            </label>

            <label class="field">
              <span class="field-label">{{ t('portal.auth.lastName') }} *</span>
              <input v-model="lastName" type="text" autocomplete="family-name" required class="input" />
            </label>
          </div>

          <label v-if="mode !== 'reset'" class="field">
            <span class="field-label">{{ t('portal.auth.email') }} *</span>
            <input v-model="email" type="email" autocomplete="email" required class="input" />
          </label>

          <label v-if="mode === 'register'" class="field">
            <span class="field-label">{{ t('portal.auth.phone') }}</span>
            <input v-model="phone" type="tel" autocomplete="tel" class="input" />
          </label>

          <div v-if="mode !== 'forgot'" class="field">
            <div class="label-row">
              <label for="auth-password" class="field-label">
                {{ mode === 'reset' ? t('portal.auth.newPassword') : t('portal.auth.password') }} *
              </label>
              <button
                v-if="mode === 'login'"
                type="button"
                class="text-link"
                @click="switchMode('forgot')"
              >
                {{ t('portal.auth.forgotLink') }}
              </button>
            </div>

            <div class="password-wrap">
              <input
                id="auth-password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
                required
                class="input"
              />
              <button
                type="button"
                class="toggle-pw"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? 'Nascondi' : 'Mostra' }}
              </button>
            </div>
            <span v-if="mode === 'register' || mode === 'reset'" class="hint">
              {{ t('portal.auth.passwordHint') }}
            </span>
          </div>

          <p v-if="errorMessage" class="error-banner" role="alert">
            {{ errorMessage }}
          </p>

          <button type="submit" class="btn btn-blue submit-btn" :disabled="loading">
            <template v-if="mode === 'login'">{{ t('portal.auth.loginCta') }}</template>
            <template v-else-if="mode === 'register'">{{ t('portal.auth.registerCta') }}</template>
            <template v-else-if="mode === 'forgot'">{{ t('portal.auth.forgotCta') }}</template>
            <template v-else>{{ t('portal.auth.resetCta') }}</template>
          </button>

          <!-- Mode Switchers -->
          <div class="mode-switch">
            <template v-if="mode === 'login'">
              <span>{{ t('portal.auth.noAccount') }}</span>
              <button type="button" class="text-link" @click="switchMode('register')">
                {{ t('portal.auth.registerCta') }}
              </button>
            </template>

            <template v-else-if="mode === 'register'">
              <span>{{ t('portal.auth.hasAccount') }}</span>
              <button type="button" class="text-link" @click="switchMode('login')">
                {{ t('portal.auth.loginCta') }}
              </button>
            </template>

            <template v-else>
              <button type="button" class="text-link" @click="switchMode('login')">
                ← {{ t('portal.auth.backToLogin') }}
              </button>
            </template>
          </div>
        </form>
      </section>

      <!-- Demo Preview Panel -->
      <aside class="demo-panel">
        <div class="demo-badge">DEMO</div>
        <h2 class="demo-title">{{ t('portal.auth.demoBoxTitle') }}</h2>
        <p class="demo-desc">{{ t('portal.auth.demoBoxText') }}</p>
        <ul class="demo-features">
          <li>✓ Storico ordini con filtri e ricerca stile Amazon</li>
          <li>✓ Timeline dinamica interattiva (Ricevuto → Stampa 3D → Spedito → Consegnato)</li>
          <li>✓ Indirizzi storicizzati e stampa ricevuta fiscale</li>
        </ul>
        <button type="button" class="btn btn-ink demo-btn" @click="handleDemoLogin">
          {{ t('portal.auth.demoLoginCta') }}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </aside>
    </div>
  </main>
</template>

<style scoped>
.auth-page {
  padding: clamp(2.5rem, 6vw, 5rem) 0 clamp(4rem, 8vw, 6rem);
  background: var(--paper-2);
  min-height: calc(100vh - var(--navbar-height));
}

.auth-grid {
  max-width: 1020px;
  display: grid;
  grid-template-columns: 1.2fr 0.85fr;
  gap: 2rem;
  align-items: start;
}

.auth-card {
  background: var(--paper);
  border: 2px solid var(--rule);
  padding: clamp(1.5rem, 4vw, 2.75rem);
}

.eyebrow {
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--blue);
  margin-bottom: 0.5rem;
}

.auth-title {
  font-size: clamp(2rem, 4vw, 3rem);
}

.auth-subtitle {
  margin-top: 0.65rem;
  color: var(--ink-2);
  font-size: 0.98rem;
}

.auth-form {
  margin-top: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.field-label {
  font-size: 0.88rem;
  font-weight: 750;
}

.input {
  width: 100%;
  min-height: 46px;
  padding: 0.65rem 0.85rem;
  background: var(--paper);
  border: 2px solid var(--ink);
  font-size: 1rem;
}

.password-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrap .input {
  padding-right: 5.5rem;
}

.toggle-pw {
  position: absolute;
  right: 0.75rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--ink-2);
  text-decoration: underline;
}

.hint {
  font-size: 0.8rem;
  color: var(--ink-3);
}

.error-banner {
  padding: 0.75rem 1rem;
  background: rgba(227, 0, 0, 0.08);
  border: 1.5px solid var(--danger);
  color: var(--danger);
  font-size: 0.9rem;
  font-weight: 700;
}

.submit-btn {
  width: 100%;
  margin-top: 0.25rem;
}

.mode-switch {
  padding-top: 1rem;
  border-top: 1px solid var(--rule-soft);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.92rem;
}

.text-link {
  font-weight: 750;
  color: var(--link);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.notice-box {
  margin-top: 1.75rem;
  padding: 1.5rem;
  background: var(--paper-2);
  border: 2px solid var(--ink);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
}

.demo-panel {
  background: var(--paper);
  border: 2px solid var(--rule);
  padding: clamp(1.5rem, 3.5vw, 2.25rem);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.demo-badge {
  align-self: flex-start;
  padding: 0.2rem 0.6rem;
  background: var(--ink);
  color: var(--paper);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.06em;
}

.demo-title {
  font-stretch: var(--semi-wide);
  font-weight: 850;
  font-size: 1.35rem;
}

.demo-desc {
  color: var(--ink-2);
  font-size: 0.94rem;
}

.demo-features {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.88rem;
  font-weight: 650;
  padding: 0.5rem 0;
}

.demo-btn {
  width: 100%;
}

@media (max-width: 860px) {
  .auth-grid {
    grid-template-columns: 1fr;
  }

  .row-2 {
    grid-template-columns: 1fr;
  }
}
</style>


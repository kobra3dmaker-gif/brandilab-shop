<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { CustomerOrder, OrderStatus } from '@/types'

const props = defineProps<{
  order: CustomerOrder
}>()

const { t, locale } = useI18n()
const copied = ref(false)

const STANDARD_STEPS: OrderStatus[] = [
  'RICEVUTO',
  'IN_LAVORAZIONE',
  'SPEDITO',
  'IN_CONSEGNA',
  'CONSEGNATO',
]

const currentStepIndex = computed(() => {
  if (props.order.status === 'ANNULLATO') return -1
  if (props.order.status === 'PROBLEMA_CONSEGNA') return 3 // Highlights at delivery stage
  return STANDARD_STEPS.indexOf(props.order.status)
})

const progressPercent = computed(() => {
  if (currentStepIndex.value <= 0) return 0
  return Math.min(100, Math.round((currentStepIndex.value / (STANDARD_STEPS.length - 1)) * 100))
})

function stepState(index: number): 'done' | 'current' | 'upcoming' | 'warning' | 'cancelled' {
  if (props.order.status === 'ANNULLATO') {
    return index === 0 ? 'cancelled' : 'upcoming'
  }
  if (props.order.status === 'PROBLEMA_CONSEGNA' && index === 3) {
    return 'warning'
  }
  if (index < currentStepIndex.value) return 'done'
  if (index === currentStepIndex.value) return 'current'
  return 'upcoming'
}

function getEventTimestamp(status: OrderStatus): string | null {
  const match = props.order.statusHistory.find((h) => h.status === status)
  if (!match) return null
  return formatShortDateTime(match.createdAt)
}

function formatShortDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat(locale.value === 'en' ? 'en-GB' : 'it-IT', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

const reversedHistory = computed(() => [...props.order.statusHistory].reverse())

async function copyTracking() {
  if (!props.order.trackingNumber) return
  try {
    await navigator.clipboard.writeText(props.order.trackingNumber)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    // Clipboard unavailable
  }
}
</script>

<template>
  <section class="timeline-card" :aria-label="t('portal.timeline.title')">
    <header class="timeline-header">
      <div>
        <h2 class="timeline-title">{{ t('portal.timeline.title') }}</h2>
        <p v-if="order.estimatedDelivery && order.status !== 'CONSEGNATO' && order.status !== 'ANNULLATO'" class="eta">
          {{
            t('portal.orderCard.estimatedArrival', {
              date: new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'it-IT', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              }).format(new Date(order.estimatedDelivery)),
            })
          }}
        </p>
      </div>

      <span class="status-pill" :class="`pill-${order.status.toLowerCase()}`">
        {{ t(`portal.timeline.steps.${order.status}`) }}
      </span>
    </header>

    <!-- Visual Stepper Bar -->
    <div class="stepper-wrap">
      <div class="progress-track" aria-hidden="true">
        <div
          class="progress-fill"
          :class="{
            'is-complete': order.status === 'CONSEGNATO',
            'is-warning': order.status === 'PROBLEMA_CONSEGNA',
            'is-cancelled': order.status === 'ANNULLATO',
          }"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>

      <ol class="stepper">
        <li
          v-for="(step, idx) in STANDARD_STEPS"
          :key="step"
          class="step"
          :class="`is-${stepState(idx)}`"
        >
          <div class="step-node" aria-hidden="true">
            <svg
              v-if="stepState(idx) === 'done' || (step === 'CONSEGNATO' && order.status === 'CONSEGNATO')"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="square"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <span v-else-if="stepState(idx) === 'current'" class="pulse-dot" />
            <span v-else-if="stepState(idx) === 'warning'">!</span>
            <span v-else class="step-num tabular">{{ idx + 1 }}</span>
          </div>

          <div class="step-info">
            <span class="step-label">{{ t(`portal.timeline.steps.${step}`) }}</span>
            <span v-if="getEventTimestamp(step)" class="step-time tabular">
              {{ getEventTimestamp(step) }}
            </span>
          </div>
        </li>
      </ol>
    </div>

    <!-- Carrier & Tracking Box (Shown when shipped or delivered) -->
    <div v-if="order.trackingNumber" class="tracking-box">
      <div class="tracking-meta">
        <div>
          <span class="meta-k">{{ t('portal.timeline.carrierLabel') }}</span>
          <strong class="meta-v">{{ order.carrierName || 'Corriere Espresso' }}</strong>
        </div>
        <div>
          <span class="meta-k">{{ t('portal.timeline.trackingNumberLabel') }}</span>
          <strong class="meta-v tabular">{{ order.trackingNumber }}</strong>
        </div>
      </div>

      <div class="tracking-actions">
        <button type="button" class="btn btn-line btn-sm" @click="copyTracking">
          {{ copied ? t('portal.timeline.copied') : t('portal.timeline.copyTracking') }}
        </button>
        <a
          v-if="order.trackingUrl"
          :href="order.trackingUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-blue btn-sm"
        >
          {{ t('portal.timeline.openCarrierSite') }}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" aria-hidden="true">
            <path d="M7 17L17 7M7 7h10v10" />
          </svg>
        </a>
      </div>
    </div>

    <!-- Chronological Audit Log -->
    <div v-if="reversedHistory.length > 0" class="history-log">
      <h3 class="history-title">{{ t('portal.timeline.historyLogTitle') }}</h3>
      <ol class="history-list">
        <li
          v-for="(ev, i) in reversedHistory"
          :key="ev.id"
          class="history-item"
          :class="{ 'is-latest': i === 0 }"
        >
          <span class="history-dot" aria-hidden="true" />
          <div class="history-content">
            <div class="history-row">
              <strong>{{ ev.title }}</strong>
              <time class="history-date tabular" :datetime="ev.createdAt">
                {{ formatShortDateTime(ev.createdAt) }}
              </time>
            </div>
            <p v-if="ev.description" class="history-desc">{{ ev.description }}</p>
          </div>
        </li>
      </ol>
    </div>
  </section>
</template>

<style scoped>
.timeline-card {
  border: 2px solid var(--rule);
  background: var(--paper);
  padding: clamp(1.25rem, 3vw, 2rem);
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.timeline-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.timeline-title {
  font-stretch: var(--semi-wide);
  font-weight: 850;
  font-size: 1.35rem;
  letter-spacing: -0.02em;
}

.eta {
  margin-top: 0.25rem;
  font-weight: 700;
  color: var(--color-success);
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.8rem;
  font-size: 0.82rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border: 2px solid var(--ink);
  background: var(--paper-2);
}

.pill-consegnato {
  background: var(--color-success);
  color: #ffffff;
  border-color: var(--color-success);
}

.pill-spedito,
.pill-in_consegna,
.pill-in_lavorazione {
  background: var(--blue);
  color: var(--on-blue);
  border-color: var(--blue);
}

.pill-annullato,
.pill-problema_consegna {
  background: var(--danger);
  color: #ffffff;
  border-color: var(--danger);
}

/* Horizontal Stepper on Desktop */
.stepper-wrap {
  position: relative;
  padding-top: 0.5rem;
}

.progress-track {
  position: absolute;
  top: 23px;
  left: 10%;
  right: 10%;
  height: 4px;
  background: var(--rule-soft);
  z-index: 0;
}

.progress-fill {
  height: 100%;
  background: var(--blue);
  transition: width 0.55s var(--ease-apple);
}

.progress-fill.is-complete {
  background: var(--color-success);
}

.progress-fill.is-warning,
.progress-fill.is-cancelled {
  background: var(--danger);
}

.stepper {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.5rem;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.65rem;
}

.step-node {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  background: var(--paper);
  border: 2.5px solid var(--rule-soft);
  color: var(--ink-3);
  font-weight: 800;
  font-size: 0.85rem;
  transition:
    background-color 0.25s ease,
    border-color 0.25s ease,
    color 0.25s ease,
    transform 0.25s ease;
}

.step.is-done .step-node {
  background: var(--ink);
  border-color: var(--ink);
  color: var(--paper);
}

.step.is-current .step-node {
  background: var(--blue);
  border-color: var(--blue);
  color: var(--on-blue);
  transform: scale(1.08);
  box-shadow: 0 0 0 4px var(--color-accent-light);
}

.step.is-warning .step-node,
.step.is-cancelled .step-node {
  background: var(--danger);
  border-color: var(--danger);
  color: #ffffff;
}

.pulse-dot {
  width: 10px;
  height: 10px;
  background: currentColor;
  animation: pulse-scale 1.6s infinite ease-in-out;
}

@keyframes pulse-scale {
  0%,
  100% {
    transform: scale(0.85);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.25);
    opacity: 1;
  }
}

.step-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.step-label {
  font-size: 0.88rem;
  font-weight: 700;
  line-height: 1.25;
  color: var(--ink-2);
}

.step.is-current .step-label,
.step.is-done .step-label {
  color: var(--ink);
}

.step-time {
  font-size: 0.76rem;
  color: var(--ink-3);
}

/* Tracking info box */
.tracking-box {
  background: var(--paper-2);
  border: 1.5px solid var(--rule-soft);
  padding: 1rem 1.25rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.tracking-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem 2.5rem;
}

.meta-k {
  display: block;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ink-3);
  font-weight: 700;
}

.meta-v {
  font-size: 1rem;
  font-weight: 800;
}

.tracking-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.btn-sm {
  min-height: 40px;
  padding: 0.5rem 1rem;
  font-size: 0.88rem;
}

/* Chronological event log */
.history-log {
  border-top: 1px solid var(--rule-soft);
  padding-top: 1.25rem;
}

.history-title {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ink-3);
  font-weight: 800;
  margin-bottom: 1rem;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.history-item {
  display: grid;
  grid-template-columns: 16px 1fr;
  gap: 0.75rem;
  align-items: start;
}

.history-dot {
  width: 10px;
  height: 10px;
  margin-top: 0.38rem;
  background: var(--rule-soft);
}

.history-item.is-latest .history-dot {
  background: var(--blue);
}

.history-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.95rem;
}

.history-date {
  font-size: 0.82rem;
  color: var(--ink-3);
}

.history-desc {
  margin-top: 0.2rem;
  font-size: 0.88rem;
  color: var(--ink-2);
}

/* Responsive Vertical Stepper on Mobile */
@media (max-width: 760px) {
  .progress-track {
    display: none;
  }

  .stepper {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .step {
    flex-direction: row;
    text-align: left;
    align-items: center;
    gap: 0.9rem;
  }

  .step-node {
    flex-shrink: 0;
  }
}
</style>


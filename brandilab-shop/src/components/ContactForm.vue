<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { trackEvent } from '@/analytics'

const SHOP_EMAIL = 'brandilab3d@gmail.com'
const API_BASE = import.meta.env.VITE_API_URL || ''

const TYPES = ['question', 'custom', 'order', 'other'] as const
type RequestType = (typeof TYPES)[number]

// Same limits the worker enforces (api-worker/src/contact.js)
const MAX_FILES = 3
const MAX_TOTAL_BYTES = 8 * 1024 * 1024
const ACCEPTED = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'gif', 'pdf', 'stl', '3mf', 'obj', 'step', 'stp']

const { t, locale } = useI18n()
const route = useRoute()

const queryType = String(route.query.type ?? '')
const queryProduct = String(route.query.product ?? '').slice(0, 120)

const form = reactive({
  type: (TYPES as readonly string[]).includes(queryType) ? (queryType as RequestType) : ('question' as RequestType),
  name: '',
  email: '',
  phone: '',
  size: '',
  color: '',
  quantity: '',
  deadline: '',
  message: queryProduct ? t('contact.form.productPrefill', { product: queryProduct }) : '',
  website: '',
})

// Arriving again from a "custom version" link while already on this page
watch(
  () => route.query.type,
  (type) => {
    if (typeof type === 'string' && (TYPES as readonly string[]).includes(type)) form.type = type as RequestType
  },
)

const files = ref<File[]>([])
const fileError = ref('')
const isDragging = ref(false)
const status = ref<'idle' | 'sending' | 'sent' | 'error'>('idle')
const errorMessage = ref('')
const sentTo = ref({ name: '', email: '' })

const isCustom = computed(() => form.type === 'custom')
const totalBytes = computed(() => files.value.reduce((sum, f) => sum + f.size, 0))
const acceptAttr = ACCEPTED.map((ext) => `.${ext}`).join(',')

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function addFiles(list: FileList | null | undefined) {
  fileError.value = ''
  if (!list) return
  const next = [...files.value]
  for (const file of Array.from(list)) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!ACCEPTED.includes(ext)) {
      fileError.value = t('contact.form.errors.file_type')
      continue
    }
    if (next.some((f) => f.name === file.name && f.size === file.size)) continue
    next.push(file)
  }
  if (next.length > MAX_FILES) {
    fileError.value = t('contact.form.errors.too_many_files')
    next.length = MAX_FILES
  }
  if (next.reduce((sum, f) => sum + f.size, 0) > MAX_TOTAL_BYTES) {
    fileError.value = t('contact.form.errors.files_too_large')
    return
  }
  files.value = next
}

function onPick(event: Event) {
  const input = event.target as HTMLInputElement
  addFiles(input.files)
  input.value = ''
}

function onDrop(event: DragEvent) {
  isDragging.value = false
  addFiles(event.dataTransfer?.files)
}

function removeFile(index: number) {
  files.value = files.value.filter((_, i) => i !== index)
  fileError.value = ''
}

async function submit() {
  if (status.value === 'sending') return
  status.value = 'sending'
  errorMessage.value = ''

  const body = new FormData()
  const fields: (keyof typeof form)[] = ['type', 'name', 'email', 'phone', 'message', 'website']
  if (isCustom.value) fields.push('size', 'color', 'quantity', 'deadline')
  for (const key of fields) body.append(key, form[key])
  body.append('locale', locale.value)
  for (const file of files.value) body.append('files', file, file.name)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30000)

  try {
    const res = await fetch(`${API_BASE}/api/contact`, { method: 'POST', body, signal: controller.signal })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.ok) throw new Error(typeof data.error === 'string' ? data.error : 'generic')

    trackEvent('generate_lead', { lead_type: form.type })
    sentTo.value = { name: form.name, email: form.email }
    status.value = 'sent'
  } catch (err) {
    const code = err instanceof Error ? err.message : 'generic'
    const known = ['invalid_fields', 'file_type', 'too_many_files', 'files_too_large']
    errorMessage.value = known.includes(code)
      ? t(`contact.form.errors.${code}`)
      : t('contact.form.errors.generic', { email: SHOP_EMAIL })
    status.value = 'error'
  } finally {
    clearTimeout(timer)
  }
}

function reset() {
  Object.assign(form, { name: '', email: '', phone: '', size: '', color: '', quantity: '', deadline: '', message: '', website: '' })
  files.value = []
  status.value = 'idle'
}
</script>

<template>
  <div v-if="status === 'sent'" class="sent" role="status">
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="square" aria-hidden="true"><path d="M4.5 12.5l5 5 10-11" /></svg>
    <h2 class="display">{{ t('contact.thanksTitle') }}</h2>
    <p>{{ t('contact.thanksText', { name: sentTo.name, email: sentTo.email }) }}</p>
    <button class="btn btn-line" @click="reset">{{ t('contact.again') }}</button>
  </div>

  <form v-else class="form" @submit.prevent="submit">
    <fieldset class="types">
      <legend>{{ t('contact.form.typeLabel') }}</legend>
      <div class="type-options">
        <label v-for="type in TYPES" :key="type" class="type" :class="{ on: form.type === type }">
          <input v-model="form.type" type="radio" name="type" :value="type" />
          {{ t(`contact.form.types.${type}`) }}
        </label>
      </div>
    </fieldset>

    <div class="row">
      <label class="field">
        <span>{{ t('contact.nameLabel') }}</span>
        <input v-model.trim="form.name" type="text" required maxlength="100" autocomplete="name" :placeholder="t('contact.namePlaceholder')" />
      </label>
      <label class="field">
        <span>{{ t('contact.emailLabel') }}</span>
        <input v-model.trim="form.email" type="email" required maxlength="254" autocomplete="email" :placeholder="t('contact.emailPlaceholder')" />
      </label>
    </div>

    <label class="field">
      <span>{{ t('contact.form.phoneLabel') }} <em>({{ t('contact.form.optional') }})</em></span>
      <input v-model.trim="form.phone" type="tel" maxlength="40" autocomplete="tel" />
    </label>

    <Transition name="custom">
      <div v-if="isCustom" class="custom">
        <p class="custom-intro">{{ t('contact.form.customIntro') }}</p>
        <div class="row">
          <label class="field">
            <span>{{ t('contact.form.sizeLabel') }} <em>({{ t('contact.form.optional') }})</em></span>
            <input v-model.trim="form.size" type="text" maxlength="120" :placeholder="t('contact.form.sizePlaceholder')" />
          </label>
          <label class="field">
            <span>{{ t('contact.form.colorLabel') }} <em>({{ t('contact.form.optional') }})</em></span>
            <input v-model.trim="form.color" type="text" maxlength="80" :placeholder="t('contact.form.colorPlaceholder')" />
          </label>
        </div>
        <div class="row">
          <label class="field">
            <span>{{ t('contact.form.quantityLabel') }} <em>({{ t('contact.form.optional') }})</em></span>
            <input v-model="form.quantity" type="number" min="1" max="999" inputmode="numeric" />
          </label>
          <label class="field">
            <span>{{ t('contact.form.deadlineLabel') }} <em>({{ t('contact.form.optional') }})</em></span>
            <input v-model="form.deadline" type="date" />
          </label>
        </div>
      </div>
    </Transition>

    <label class="field">
      <span>{{ isCustom ? t('contact.form.messageLabelCustom') : t('contact.messageLabel') }}</span>
      <textarea
        v-model="form.message"
        required
        rows="6"
        maxlength="5000"
        :placeholder="isCustom ? t('contact.form.messagePlaceholderCustom') : t('contact.messagePlaceholder')"
      />
    </label>

    <div class="field">
      <span id="files-label">{{ t('contact.form.filesLabel') }} <em>({{ t('contact.form.optional') }})</em></span>
      <label
        class="drop"
        :class="{ dragging: isDragging }"
        @dragover.prevent="isDragging = true"
        @dragleave="isDragging = false"
        @drop.prevent="onDrop"
      >
        <input class="visually-hidden" type="file" multiple :accept="acceptAttr" aria-labelledby="files-label" @change="onPick" />
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M4 15v5h16v-5" /></svg>
        <span>{{ t('contact.form.filesDrop') }} <u>{{ t('contact.form.filesBrowse') }}</u></span>
      </label>
      <p class="hint">{{ t('contact.form.filesHint') }}</p>
      <ul v-if="files.length" class="files">
        <li v-for="(file, i) in files" :key="file.name + file.size">
          <span class="file-name">{{ file.name }}</span>
          <span class="file-size tabular">{{ formatSize(file.size) }}</span>
          <button type="button" class="file-remove" :aria-label="t('contact.form.removeFile', { name: file.name })" @click="removeFile(i)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="square" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </li>
        <li class="files-total tabular">{{ formatSize(totalBytes) }} / 8 MB</li>
      </ul>
      <p v-if="fileError" class="error" role="alert">{{ fileError }}</p>
    </div>

    <!-- Anti-spam: hidden from people, filled in by bots -->
    <div class="visually-hidden" aria-hidden="true">
      <label>Website <input v-model="form.website" type="text" name="website" tabindex="-1" autocomplete="off" /></label>
    </div>

    <p v-if="status === 'error'" class="error" role="alert">{{ errorMessage }}</p>

    <div class="actions">
      <button type="submit" class="btn btn-blue submit" :disabled="status === 'sending'">
        <span v-if="status === 'sending'" class="spinner" aria-hidden="true" />
        {{ status === 'sending' ? t('contact.form.sending') : t('contact.send') }}
        <svg v-if="status !== 'sending'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </button>
      <p class="privacy">{{ t('contact.form.privacy') }}</p>
    </div>
  </form>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.types {
  border: none;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.types legend {
  font-weight: 700;
  font-size: 0.95rem;
  margin-bottom: 0.6rem;
}

.type-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.type {
  position: relative;
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 1rem;
  border: 2px solid var(--ink);
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  user-select: none;
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    transform 160ms var(--ease-out);
}

.type input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.type.on {
  background: var(--ink);
  color: var(--paper);
}

.type:active {
  transform: scale(0.97);
}

.type:has(input:focus-visible) {
  outline: 3px solid var(--focus);
  outline-offset: 2px;
}

.row {
  display: grid;
  gap: 1.2rem;
}

@media (min-width: 640px) {
  .row {
    grid-template-columns: 1fr 1fr;
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-weight: 700;
  font-size: 0.95rem;
}

.field em {
  font-style: normal;
  font-weight: 400;
  color: var(--ink-3);
}

.field input,
.field textarea {
  width: 100%;
  min-height: 48px;
  padding: 0.8rem 0.9rem;
  border: 2px solid var(--ink);
  border-radius: 0;
  background: var(--paper);
  font-weight: 400;
  font-size: 1rem;
  resize: vertical;
  outline: none;
}

.field input:focus-visible,
.field textarea:focus-visible {
  outline: 3px solid var(--focus);
  outline-offset: 2px;
}

.field input::placeholder,
.field textarea::placeholder {
  color: var(--ink-3);
}

.custom {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  padding: 1.25rem;
  background: var(--paper-2);
}

.custom-intro {
  color: var(--ink-2);
  max-width: 60ch;
}

.custom-enter-active {
  transition:
    opacity 0.35s var(--ease-apple),
    translate 0.45s var(--ease-apple);
}

.custom-leave-active {
  transition: opacity 0.15s ease;
}

.custom-enter-from {
  opacity: 0;
  translate: 0 -10px;
}

.custom-leave-to {
  opacity: 0;
}

.drop {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 72px;
  padding: 1rem;
  border: 2px dashed var(--ink-3);
  font-weight: 500;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;
}

.drop u {
  color: var(--link);
  text-underline-offset: 3px;
}

.drop.dragging,
.drop:has(input:focus-visible) {
  border-color: var(--blue);
  background: var(--color-accent-light);
}

@media (hover: hover) and (pointer: fine) {
  .drop:hover {
    border-color: var(--ink);
  }
}

.hint {
  font-weight: 400;
  font-size: 0.85rem;
  color: var(--ink-2);
}

.files {
  display: flex;
  flex-direction: column;
  border-top: 2px solid var(--rule);
  font-weight: 400;
}

.files li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--rule-soft);
}

.file-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size,
.files-total {
  color: var(--ink-2);
  font-size: 0.85rem;
}

.files-total {
  justify-content: flex-end;
  border-bottom: none !important;
}

.file-remove {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  color: var(--ink-3);
}

@media (hover: hover) and (pointer: fine) {
  .file-remove:hover {
    color: var(--danger);
  }
}

.error {
  font-weight: 600;
  font-size: 0.92rem;
  color: var(--danger);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1.25rem;
}

.submit {
  min-height: 52px;
}

.privacy {
  font-size: 0.85rem;
  color: var(--ink-2);
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2.5px solid rgba(255, 255, 255, 0.35);
  border-top-color: var(--on-blue);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.sent {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
  padding: 2rem;
  background: var(--paper-2);
  animation: rise 0.6s var(--ease-apple) both;
}

.sent svg {
  color: var(--blue);
}

.sent h2 {
  font-size: clamp(2rem, 4vw, 3rem);
}

.sent p {
  color: var(--ink-2);
  max-width: 50ch;
}
</style>

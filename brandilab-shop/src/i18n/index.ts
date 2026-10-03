import { watch } from 'vue'
import { createI18n, useI18n } from 'vue-i18n'
import it from './it'
import en from './en'

/**
 * Site language (Italian / English).
 *
 * On the first visit the language comes from the browser (the first of the visitor's
 * preferred languages that we support); if none of them is Italian or English, Italian is
 * used. Picking a language with the navbar switch stores it in localStorage, and that
 * choice wins from then on.
 *
 * <html lang> is also set before the first paint by the inline script in index.html
 * (same detection and storage key), so Snipcart starts in the right language too.
 */

export const SUPPORTED_LOCALES = ['it', 'en'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'it'
export const LOCALE_NAMES: Record<Locale, string> = { it: 'Italiano', en: 'English' }

const STORAGE_KEY = 'locale'

function isLocale(value: unknown): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale)
}

function readStored(): Locale | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return isLocale(value) ? value : null
  } catch {
    return null
  }
}

function writeStored(value: Locale) {
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // Storage blocked (private mode etc.) — the choice just won't persist
  }
}

function detectBrowserLocale(): Locale | null {
  const preferred = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const tag of preferred) {
    const base = tag?.toLowerCase().split('-')[0]
    if (isLocale(base)) return base
  }
  return null
}

const currency = { style: 'currency', currency: 'EUR' } as const

export const i18n = createI18n({
  legacy: false,
  locale: readStored() ?? detectBrowserLocale() ?? DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_LOCALE,
  messages: { it, en },
  // n(price, 'currency') → "12,50 €" in Italian, "€12.50" in English
  numberFormats: { it: { currency }, en: { currency } },
})

// Keep the page itself in the current language
watch(
  i18n.global.locale,
  (locale) => {
    document.documentElement.lang = locale
    document.title = i18n.global.t('meta.title')
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', i18n.global.t('meta.description'))
  },
  { immediate: true },
)

export function useLocale() {
  const { locale } = useI18n()

  function setLocale(value: Locale) {
    locale.value = value
    writeStored(value)
  }

  return { locale, setLocale }
}

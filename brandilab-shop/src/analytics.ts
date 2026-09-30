import { ref, computed } from 'vue'

/**
 * Google Analytics 4, only with the visitor's consent (GDPR / Garante Privacy).
 *
 * index.html defines gtag() and the Consent Mode defaults before anything else runs; calls
 * made before consent just queue up in window.dataLayer. Google's gtag.js is downloaded only
 * once the visitor accepts the cookie banner (or accepted on a previous visit), and then
 * processes the queue.
 *
 * What gets tracked:
 * - page views, scrolls, outbound clicks… — GA4 "Enhanced measurement" (on by default, it also
 *   follows the Vue Router navigations)
 * - add_to_cart, remove_from_cart, begin_checkout, purchase — sent by Snipcart itself
 *   (Google Analytics integration enabled in the Snipcart dashboard)
 * - view_item — sent by ProductView through trackEvent()
 */

type Consent = 'granted' | 'denied'

const STORAGE_KEY = 'analytics-consent' // also read by the inline script in index.html
const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID ?? ''

/** false while .env still has the placeholder ID: no banner, nothing loaded */
export const analyticsEnabled = /^G-[A-Z0-9]+$/.test(MEASUREMENT_ID) && MEASUREMENT_ID !== 'G-XXXXXXXXXX'

function gtag(...args: unknown[]) {
  ;(window as any).gtag?.(...args)
}

function readStored(): Consent | null {
  try {
    const match = document.cookie.match(new RegExp('(^| )' + STORAGE_KEY + '=([^;]+)'))
    if (match) {
      const value = match[2]
      return value === 'granted' || value === 'denied' ? value : null
    }
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'granted' || value === 'denied' ? value : null
  } catch {
    return null
  }
}

function writeStored(value: Consent) {
  try {
    localStorage.setItem(STORAGE_KEY, value)
    document.cookie = `${STORAGE_KEY}=${value}; max-age=${60 * 60 * 24 * 365}; path=/; SameSite=Lax`
  } catch {
    // Storage blocked — the banner will simply ask again next visit
  }
}

let scriptLoaded = false
function loadGtag() {
  if (scriptLoaded || !analyticsEnabled) return
  scriptLoaded = true
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
  document.head.appendChild(script)
}

// Remove the _ga / _ga_XXXX cookies when consent is withdrawn
function deleteGaCookies() {
  const hostParts = location.hostname.split('.')
  const domains = hostParts.map((_, i) => hostParts.slice(i).join('.')).filter((d) => d.includes('.'))
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=')[0]?.trim()
    if (!name?.startsWith('_ga')) continue
    const expired = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
    document.cookie = expired
    for (const domain of domains) document.cookie = `${expired}; domain=.${domain}`
  }
}

// Shared state — singleton
const consent = ref<Consent | null>(readStored())
const bannerReopened = ref(false)

if (consent.value === 'granted') loadGtag()

function setConsent(value: Consent) {
  consent.value = value
  bannerReopened.value = false
  writeStored(value)

  // Official GA opt-out switch: stops all sending even if gtag.js is already loaded
  ;(window as any)[`ga-disable-${MEASUREMENT_ID}`] = value === 'denied'
  gtag('consent', 'update', { analytics_storage: value })

  if (value === 'granted') loadGtag()
  else deleteGaCookies()
}

export function useAnalyticsConsent() {
  return {
    consent: computed(() => consent.value),
    showBanner: computed(() => analyticsEnabled && (consent.value === null || bannerReopened.value)),
    accept: () => setConsent('granted'),
    decline: () => setConsent('denied'),
    reopenBanner: () => {
      bannerReopened.value = true
    },
  }
}

/** Send a GA4 event. Queued (and only sent) if the visitor has accepted analytics. */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (!analyticsEnabled) return
  gtag('event', name, params)
}

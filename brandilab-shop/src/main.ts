import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Patch History API to prevent Snipcart from corrupting Vue Router's history state.
// Snipcart writes entries without Vue Router's state, so we carry the current state over,
// pointing `current` at the new URL (otherwise Vue Router would later restore the old URL).
function withRouterState(state: any, url?: string | URL | null) {
  if (state && state.current) return state
  const merged = { ...(history.state || {}), ...(state || {}) }
  if (url != null && merged.current) {
    const { pathname, search, hash } = new URL(url, location.href)
    const base = import.meta.env.BASE_URL.replace(/\/$/, '')
    merged.current = pathname.slice(base.length) + search + hash
  }
  return merged
}

const originalPushState = history.pushState
history.pushState = function (state, title, url) {
  return originalPushState.call(this, withRouterState(state, url), title, url)
}

const originalReplaceState = history.replaceState
history.replaceState = function (state, title, url) {
  return originalReplaceState.call(this, withRouterState(state, url), title, url)
}

const app = createApp(App)

app.use(router)

app.mount('#app')

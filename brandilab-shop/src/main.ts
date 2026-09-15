import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Patch History API to prevent Snipcart from corrupting Vue Router's history state
const originalPushState = history.pushState
history.pushState = function (state, title, url) {
  if (!state || !state.current) {
    state = { ...(history.state || {}), ...(state || {}) }
  }
  return originalPushState.call(this, state, title, url)
}

const originalReplaceState = history.replaceState
history.replaceState = function (state, title, url) {
  if (!state || !state.current) {
    state = { ...(history.state || {}), ...(state || {}) }
  }
  return originalReplaceState.call(this, state, title, url)
}

const app = createApp(App)

app.use(router)

app.mount('#app')

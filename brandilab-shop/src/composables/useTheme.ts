import { ref, computed, watchEffect } from 'vue'

/**
 * Light/dark theme.
 *
 * By default the site follows the OS/browser setting (prefers-color-scheme) and keeps
 * following it if it changes. Clicking the navbar toggle stores an explicit choice in
 * localStorage; choosing the same theme as the OS clears it again, so the site goes back
 * to following the system.
 *
 * The initial theme is applied before the first paint by the inline script in index.html
 * (same storage key), this composable keeps it in sync afterwards.
 */

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'
const media = window.matchMedia('(prefers-color-scheme: dark)')

function readStored(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

function writeStored(value: Theme | null) {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, value)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage blocked (private mode etc.) — the choice just won't persist
  }
}

// Shared state — singleton across all components
const systemTheme = ref<Theme>(media.matches ? 'dark' : 'light')
const storedTheme = ref<Theme | null>(readStored())
const theme = computed<Theme>(() => storedTheme.value ?? systemTheme.value)

media.addEventListener('change', (e) => {
  systemTheme.value = e.matches ? 'dark' : 'light'
})

watchEffect(() => {
  document.documentElement.dataset.theme = theme.value
})

export function useTheme() {
  function toggleTheme() {
    const next: Theme = theme.value === 'dark' ? 'light' : 'dark'
    storedTheme.value = next === systemTheme.value ? null : next
    writeStored(storedTheme.value)
  }

  return {
    theme,
    isDark: computed(() => theme.value === 'dark'),
    toggleTheme,
  }
}

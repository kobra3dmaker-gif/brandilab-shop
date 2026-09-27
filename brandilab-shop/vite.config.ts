import { fileURLToPath, URL } from 'node:url'

import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { sanityConfig } from './src/sanityConfig'
import { SNIPCART_PRODUCTS_FILE, SNIPCART_PRODUCTS_URL } from './src/snipcart'

/**
 * Writes snipcart-products.json (every product's id and price, read from Sanity) into the
 * build, so Snipcart's crawler can validate orders — see src/snipcart.ts.
 * If Sanity can't be reached the build fails, so a broken file never gets deployed.
 */
function snipcartProducts(): Plugin {
  return {
    name: 'snipcart-products',
    apply: 'build',
    async generateBundle() {
      const { projectId, dataset, apiVersion } = sanityConfig
      const query = '*[_type == "product"]{ _id, price }'
      const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(query)}`

      const response = await fetch(url)
      if (!response.ok) {
        this.error(`Could not load products from Sanity for Snipcart validation (HTTP ${response.status})`)
      }
      const { result } = (await response.json()) as { result: { _id: string; price?: number }[] }

      const products = result
        .filter((p) => typeof p.price === 'number')
        .map((p) => ({ id: p._id, price: p.price, url: SNIPCART_PRODUCTS_URL }))

      this.emitFile({
        type: 'asset',
        fileName: SNIPCART_PRODUCTS_FILE,
        source: JSON.stringify(products, null, 2),
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/', // MUST match your GitHub repo name exactly
  plugins: [
    vue(),
    vueDevTools(),
    snipcartProducts(),
  ],
  // vue-i18n feature flags (we only use the Composition API)
  define: {
    __VUE_I18N_FULL_INSTALL__: true,
    __VUE_I18N_LEGACY_API__: false,
    __INTLIFY_PROD_DEVTOOLS__: false,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})

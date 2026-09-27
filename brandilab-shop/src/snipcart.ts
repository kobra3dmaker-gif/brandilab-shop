/**
 * Snipcart order validation.
 *
 * Before charging, Snipcart's crawler fetches each item's data-item-url and checks that the
 * product id and price are really there (so nobody can edit the price in the browser).
 * The site itself is rendered by JavaScript, which the crawler doesn't run, so instead every
 * button points at a JSON file listing all products with their prices. That file is built
 * from Sanity on every deploy (see the snipcartProducts plugin in vite.config.ts).
 *
 * The URL is absolute (apex domain, no www → no redirect) and must be identical in the
 * buttons and in the JSON file.
 */
export const SNIPCART_PRODUCTS_FILE = 'snipcart-products.json'
export const SNIPCART_PRODUCTS_URL = `https://brandilab.it/${SNIPCART_PRODUCTS_FILE}`

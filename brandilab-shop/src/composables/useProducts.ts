import { ref, computed } from 'vue'
import { sanity } from '@/sanity'
import type { Product } from '@/types'

const products = ref<Product[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
let fetched = false

export type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc'

function materialKey(material?: string) {
  return (material ?? '').trim().toLowerCase()
}

// Case- and accent-insensitive, so "alpha" and "Élan" sort alongside "Drago"
function compareText(a?: string, b?: string) {
  return (a ?? '').localeCompare(b ?? '', undefined, { sensitivity: 'base', numeric: true })
}

function price(p: Product) {
  return typeof p.price === 'number' ? p.price : 0
}

async function fetchProducts() {
  if (fetched) return
  loading.value = true
  error.value = null
  try {
    const query = '*[_type == "product"] | order(_createdAt desc)'
    products.value = await sanity.fetch(query)
    fetched = true
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load products'
    console.error('Error loading products from Sanity:', e)
  } finally {
    loading.value = false
  }
}

export function useProducts() {
  // Auto-fetch on first use
  if (!fetched && !loading.value) {
    fetchProducts()
  }

  const featuredProducts = computed(() =>
    products.value.filter((p) => p.featured),
  )

  // Distinct materials, ignoring products without one and differences in case/whitespace
  // ("PLA" and "pla " are the same filter)
  const materials = computed(() => {
    const byKey = new Map<string, string>()
    for (const p of products.value) {
      const label = p.material?.trim()
      if (label && !byKey.has(materialKey(label))) byKey.set(materialKey(label), label)
    }
    return ['All', ...[...byKey.values()].sort(compareText)]
  })

  function getProductById(id: string): Product | undefined {
    return products.value.find((p) => p._id === id)
  }

  function filterByMaterial(list: Product[], material: string): Product[] {
    if (material === 'All') return list
    return list.filter((p) => materialKey(p.material) === materialKey(material))
  }

  function sortProducts(list: Product[], sortBy: SortOption): Product[] {
    const sorted = [...list]
    switch (sortBy) {
      case 'price-asc':
        return sorted.sort((a, b) => price(a) - price(b) || compareText(a.title, b.title))
      case 'price-desc':
        return sorted.sort((a, b) => price(b) - price(a) || compareText(a.title, b.title))
      case 'name-asc':
        return sorted.sort((a, b) => compareText(a.title, b.title))
      default:
        // Sanity already returns products newest first
        return sorted
    }
  }

  return {
    products,
    loading,
    error,
    featuredProducts,
    materials,
    fetchProducts,
    getProductById,
    filterByMaterial,
    sortProducts,
  }
}

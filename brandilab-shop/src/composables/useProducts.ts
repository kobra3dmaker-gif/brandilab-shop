import { ref, computed } from 'vue'
import { sanity } from '@/sanity'
import type { Product } from '@/types'

const products = ref<Product[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
let fetched = false

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

  const materials = computed(() => {
    const mats = new Set(products.value.map((p) => p.material))
    return ['All', ...Array.from(mats)]
  })

  function getProductById(id: string): Product | undefined {
    return products.value.find((p) => p._id === id)
  }

  function filterByMaterial(material: string): Product[] {
    if (material === 'All') return products.value
    return products.value.filter((p) => p.material === material)
  }

  function sortProducts(
    list: Product[],
    sortBy: 'price-asc' | 'price-desc' | 'name-asc',
  ): Product[] {
    const sorted = [...list]
    switch (sortBy) {
      case 'price-asc':
        return sorted.sort((a, b) => a.price - b.price)
      case 'price-desc':
        return sorted.sort((a, b) => b.price - a.price)
      case 'name-asc':
        return sorted.sort((a, b) => a.title.localeCompare(b.title))
      default:
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

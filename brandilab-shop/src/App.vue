<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Define the TypeScript interface for our products
interface Product {
  id: string;
  name: string;
  price: number;
  material: string;
  description: string;
  image: string;
  url: string;
}

const products = ref<Product[]>([])

// Fetch the static JSON "backend"
onMounted(async () => {
  try {
    const response = await fetch('/catalog.json')
    products.value = await response.json()
  } catch (error) {
    console.error('Error loading the catalog:', error)
  }
})
</script>

<template>
  <main class="store-container">
    <h1>BrandiLab Catalog</h1>

    <div class="grid">
      <div v-for="product in products" :key="product.id" class="card">
        <img :src="product.image" :alt="product.name" />
        <h2>{{ product.name }}</h2>
        <p>{{ product.description }}</p>
        <p><strong>Material:</strong> {{ product.material }}</p>
        <p class="price">€{{ product.price.toFixed(2) }}</p>

        <!-- Snipcart Buy Button -->
        <button class="snipcart-add-item"
          :data-item-id="product.id"
          :data-item-price="product.price"
          :data-item-url="product.url"
          :data-item-description="product.description"
          :data-item-image="product.image"
          :data-item-name="product.name">
          Add to Cart
        </button>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* Add your preferred CSS grid and card styling here */
.store-container { padding: 2rem; font-family: sans-serif; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; }
.card { border: 1px solid #eee; padding: 1rem; border-radius: 8px; }
img { max-width: 100%; border-radius: 4px; }
button { background: #000; color: #fff; padding: 10px 15px; border: none; cursor: pointer; }
</style>

<template>
  <div class="hero-carousel">
    <div 
      class="slides-container" 
      :style="{ transform: `translateX(-${currentSlide * 100}%)` }"
    >
      <div 
        v-for="(slide, index) in slides" 
        :key="index"
        class="slide"
      >
        <div class="slide-background"></div>
        <div class="slide-content">
          <div class="text-content">
            <h2 class="slide-title">{{ t(`hero.slide${index + 1}Title`) }}</h2>
            <p class="slide-subtitle">{{ t(`hero.slide${index + 1}Subtitle`) }}</p>
            <a href="#shop" class="hero-btn">{{ t('hero.shopNow') }}</a>
          </div>
          
          <div class="images-content">
            <div 
              v-if="getSlideProduct(index, 0)" 
              class="product-image left-img"
            >
              <img :src="getImageUrl(getSlideProduct(index, 0))" alt="" />
            </div>
            <div 
              v-if="getSlideProduct(index, 1)" 
              class="product-image right-img"
            >
              <img :src="getImageUrl(getSlideProduct(index, 1))" alt="" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="navigation-dots">
      <button 
        v-for="(_, index) in slides" 
        :key="index"
        class="dot"
        :class="{ active: currentSlide === index }"
        @click="goToSlide(index)"
        :aria-label="`Go to slide ${index + 1}`"
      ></button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProducts } from '@/composables/useProducts'
import { urlFor } from '@/sanity'

const { t } = useI18n()
const { products } = useProducts()

const slides = [0, 1, 2]
const currentSlide = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const carouselProducts = computed(() => {
  return products.value ? products.value.slice(0, 6) : []
})

const getSlideProduct = (slideIndex: number, productOffset: number) => {
  const index = slideIndex * 2 + productOffset
  return carouselProducts.value[index]
}

const getImageUrl = (product: any) => {
  if (!product || !product.image) return ''
  return urlFor(product.image).width(400).url()
}

const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % slides.length
}

const goToSlide = (index: number) => {
  currentSlide.value = index
  resetTimer()
}

const startTimer = () => {
  timer = setInterval(nextSlide, 5000)
}

const resetTimer = () => {
  if (timer) clearInterval(timer)
  startTimer()
}

onMounted(() => {
  startTimer()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.hero-carousel {
  position: relative;
  width: 100%;
  height: 320px;
  overflow: hidden;
  background-color: var(--color-brand-dark, #2c3e50);
}

.slides-container {
  display: flex;
  width: 100%;
  height: 100%;
  transition: transform 0.5s ease-in-out;
}

.slide {
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
}

.slide-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%);
  z-index: 1;
}

.slide-content {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  height: 100%;
}

.text-content {
  flex: 1;
  max-width: 50%;
  color: var(--color-on-dark, #ffffff);
}

.slide-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  line-height: 1.2;
}

.slide-subtitle {
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
  opacity: 0.9;
}

.hero-btn {
  display: inline-block;
  background-color: #ffffff;
  color: var(--color-brand-dark, #2c3e50);
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
}

.hero-btn:hover {
  background-color: #f0f0f0;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.images-content {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  height: 100%;
  align-items: center;
}

.product-image {
  width: 200px;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
  background: rgba(255, 255, 255, 0.1);
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.left-img {
  transform: translateY(20px) rotate(-5deg);
}

.right-img {
  transform: translateY(-10px) rotate(5deg);
}

.navigation-dots {
  position: absolute;
  bottom: 1.5rem;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  z-index: 3;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.5);
  border: none;
  cursor: pointer;
  padding: 0;
  transition: all 0.3s ease;
}

.dot.active {
  background-color: var(--color-accent, #008080);
  transform: scale(1.2);
}

@media (max-width: 768px) {
  .hero-carousel {
    height: 380px;
  }
  
  .slide-content {
    flex-direction: column;
    justify-content: center;
    text-align: center;
    padding: 2rem 1rem;
  }
  
  .slide-background {
    background: linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.4) 100%);
  }

  .text-content {
    max-width: 100%;
    margin-bottom: 2rem;
  }
  
  .slide-title {
    font-size: 1.75rem;
  }
  
  .slide-subtitle {
    font-size: 1rem;
  }
  
  .images-content {
    justify-content: center;
    width: 100%;
  }
  
  .product-image {
    width: 120px;
    height: 120px;
  }
}
</style>

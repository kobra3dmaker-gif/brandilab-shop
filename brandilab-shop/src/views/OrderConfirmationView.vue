<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useSnipcart } from '@/composables/useSnipcart'

const { isReady } = useSnipcart()

const orderToken = ref<string | null>(null)
const orderNumber = ref<string | null>(null)

onMounted(() => {
  // Snipcart stores the last order token in the URL hash after checkout
  const params = new URLSearchParams(window.location.search)
  orderToken.value = params.get('token')

  // Generate a display-friendly order number
  if (orderToken.value) {
    orderNumber.value = `BL-${orderToken.value.slice(0, 8).toUpperCase()}`
  } else {
    orderNumber.value = `BL-${Date.now().toString(36).toUpperCase()}`
  }
})
</script>

<template>
  <main class="confirmation-view">
    <div class="container">
      <div class="confirmation-card">
        <div class="success-icon">✓</div>
        <h1 class="title">Order Confirmed!</h1>
        <p class="subtitle">Thank you for your purchase from BrandiLab</p>

        <div class="order-info" v-if="orderNumber">
          <div class="info-row">
            <span class="label">Order Number</span>
            <span class="value">{{ orderNumber }}</span>
          </div>
        </div>

        <div class="details-box">
          <p>We've received your order and will begin preparing your 3D printed creation right away.</p>
          <p>You'll receive a confirmation email with tracking information once your order ships.</p>
        </div>

        <div class="actions">
          <RouterLink to="/shop" class="btn btn-primary">Continue Shopping</RouterLink>
          <RouterLink to="/" class="btn btn-outline">Back to Home</RouterLink>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.confirmation-view {
  padding: 5rem 1rem;
  background-color: var(--color-bg);
  min-height: calc(100vh - var(--navbar-height));
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
}

.confirmation-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 3rem 2rem;
  box-shadow: var(--shadow-md);
  text-align: center;
}

.success-icon {
  width: 80px;
  height: 80px;
  background-color: var(--color-success, #27ae60);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: bold;
  margin: 0 auto 1.5rem;
  animation: pop 0.4s ease-out;
}

@keyframes pop {
  0% { transform: scale(0); }
  80% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.title {
  font-size: 2rem;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--color-text-light);
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

.order-info {
  background: var(--color-bg);
  border-radius: var(--radius-md);
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  font-size: 0.9rem;
  color: var(--color-text-light);
}

.value {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--color-primary);
  font-family: monospace;
}

.details-box {
  margin-bottom: 2rem;
}

.details-box p {
  color: var(--color-text-light);
  line-height: 1.6;
  margin-bottom: 0.75rem;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

@media (min-width: 480px) {
  .actions {
    flex-direction: row;
    justify-content: center;
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.75rem;
  border-radius: var(--radius-sm);
  font-weight: 600;
  text-decoration: none;
  transition: var(--transition);
  font-size: 0.95rem;
}

.btn-primary {
  background: var(--color-accent);
  color: white;
}

.btn-primary:hover {
  background: var(--color-accent-hover);
  transform: translateY(-1px);
}

.btn-outline {
  background: transparent;
  color: var(--color-accent);
  border: 2px solid var(--color-accent);
}

.btn-outline:hover {
  background: var(--color-accent);
  color: white;
  transform: translateY(-1px);
}
</style>


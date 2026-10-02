<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { loadStripe, type StripeElements, type Stripe } from '@stripe/stripe-js'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const { t } = useI18n()

const errorMsg = ref('')
const loading = ref(true)
const statusMsg = ref('')
const noWallet = ref(false)

let stripe: Stripe | null = null
let elements: StripeElements | null = null

const API_BASE = import.meta.env.VITE_API_URL || ''

onMounted(async () => {
  const publicToken = route.query.publicToken as string
  const paymentIntentId = route.query.payment_intent as string

  if (!publicToken) {
    errorMsg.value = t('pay.errorMissingToken', 'Token mancante. Torna al carrello e riprova.')
    loading.value = false
    return
  }

  try {
    stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
    if (!stripe) throw new Error('Stripe failed to load')

    // If returning from a redirect
    if (paymentIntentId) {
      return await finalizePayment(publicToken, paymentIntentId)
    }

    // Normal flow: initialize payment
    statusMsg.value = t('pay.statusInit', 'Inizializzazione pagamento...')
    const sessionRes = await fetch(`${API_BASE}/api/payment-session?publicToken=${encodeURIComponent(publicToken)}`)
    if (!sessionRes.ok) throw new Error('Session unavailable')
    
    const { amount, currency } = await sessionRes.json()

    elements = stripe.elements({
      mode: 'payment',
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      paymentMethodCreation: 'manual', // or let it default
    })

    const expressCheckoutElement = (elements as any).create('expressCheckout', {
      wallets: {
        applePay: 'auto',
        googlePay: 'auto',
        paypal: 'never',
        amazonPay: 'never',
        link: 'never'
      } as any,
      buttonType: {
        applePay: 'buy',
        googlePay: 'buy'
      },
      layout: {
        maxColumns: 1,
        maxRows: 1
      }
    })

    expressCheckoutElement.on('ready', (event: any) => {
      const availablePaymentMethods = event.availablePaymentMethods
      if (!availablePaymentMethods || 
         (!availablePaymentMethods.applePay && !availablePaymentMethods.googlePay)) {
        noWallet.value = true
        loading.value = false
      } else {
        loading.value = false
        expressCheckoutElement.mount('#express-checkout-element')
      }
    })

    expressCheckoutElement.on('confirm', async (event) => {
      try {
        const { error: submitError } = await elements!.submit()
        if (submitError) {
          errorMsg.value = submitError.message || 'Errore di validazione.'
          return
        }

        statusMsg.value = t('pay.statusProcessing', 'Elaborazione in corso...')
        
        const createRes = await fetch(`${API_BASE}/api/create-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicToken })
        })
        if (!createRes.ok) throw new Error('Intent creation failed')
        
        const { clientSecret } = await createRes.json()

        const confirmRes = await stripe!.confirmPayment({
          elements: elements!,
          clientSecret,
          confirmParams: {
            return_url: `${window.location.origin}/pay?publicToken=${encodeURIComponent(publicToken)}`
          },
          redirect: 'if_required'
        })

        if (confirmRes.error) {
          errorMsg.value = confirmRes.error.message || 'Errore durante il pagamento.'
          statusMsg.value = ''
        } else if (confirmRes.paymentIntent && confirmRes.paymentIntent.status === 'succeeded') {
          await finalizePayment(publicToken, confirmRes.paymentIntent.id)
        }
      } catch (err) {
        console.error(err)
        errorMsg.value = t('pay.errorGeneric', 'Si è verificato un errore. Riprova o usa un altro metodo.')
        statusMsg.value = ''
      }
    })

  } catch (err) {
    console.error(err)
    errorMsg.value = t('pay.errorGeneric', 'Si è verificato un errore. Riprova o usa un altro metodo.')
    loading.value = false
  }
})

async function finalizePayment(publicToken: string, paymentIntentId: string) {
  loading.value = true
  statusMsg.value = t('pay.statusFinalizing', 'Conferma del pagamento...')
  try {
    const res = await fetch(`${API_BASE}/api/finalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicToken, paymentIntentId })
    })
    
    if (!res.ok) throw new Error('Finalize failed')
    
    const { redirectUrl } = await res.json()
    window.location.href = redirectUrl
  } catch (err) {
    console.error(err)
    errorMsg.value = t('pay.errorFinalize', 'Errore nella conferma del pagamento. Contatta l\'assistenza.')
    loading.value = false
    statusMsg.value = ''
  }
}
</script>

<template>
  <div class="pay-view">
    <div class="container">
      <div class="card">
        <h1 class="card-title">{{ t('pay.title', 'Pagamento Rapido') }}</h1>
        
        <div v-if="errorMsg" class="error-msg">
          {{ errorMsg }}
        </div>

        <div v-if="noWallet" class="info-msg">
          {{ t('pay.noWallet', 'Apple Pay o Google Pay non sono disponibili su questo dispositivo o browser. Per favore, torna indietro e seleziona il pagamento con carta.') }}
          <div class="bottom-actions">
             <RouterLink to="/" class="btn btn-outline">{{ t('pay.backToShop', 'Torna al Negozio') }}</RouterLink>
          </div>
        </div>

        <div v-show="!noWallet && !errorMsg">
          <div v-if="loading" class="loading-state">
            <span class="spinner"></span>
            <p>{{ statusMsg }}</p>
          </div>
          
          <div id="express-checkout-element" :class="{ hidden: loading }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pay-view {
  background-color: var(--color-bg);
  min-height: calc(100vh - var(--navbar-height));
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem var(--container-padding);
}

.container {
  width: 100%;
  max-width: 500px;
}

.card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 2rem;
  box-shadow: var(--shadow-md);
  text-align: center;
}

.card-title {
  font-size: var(--font-size-xl);
  color: var(--color-primary);
  font-weight: 700;
  margin-bottom: 1.5rem;
}

.error-msg {
  color: var(--color-danger);
  background: rgba(231, 76, 60, 0.1);
  padding: 1rem;
  border-radius: var(--radius-md);
  margin-bottom: 1.5rem;
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.info-msg {
  color: var(--color-text);
  font-size: var(--font-size-sm);
  line-height: 1.6;
}

.bottom-actions {
  margin-top: 1.5rem;
}

.btn-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.75rem;
  border-radius: var(--radius-sm);
  font-weight: 600;
  text-decoration: none;
  background: transparent;
  color: var(--color-accent);
  border: 2px solid var(--color-accent);
  transition: var(--transition-fast);
}

.btn-outline:hover {
  background: var(--color-accent);
  color: white;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem 0;
  color: var(--color-text-muted);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: var(--color-accent);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.hidden {
  display: none !important;
}
</style>

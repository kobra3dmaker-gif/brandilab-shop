import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const HomeView = () => import('@/views/HomeView.vue')
const ProductView = () => import('@/views/ProductView.vue')
const AboutView = () => import('@/views/AboutView.vue')
const ContactView = () => import('@/views/ContactView.vue')
const CheckoutSuccessView = () => import('@/views/CheckoutSuccessView.vue')
const AuthView = () => import('@/views/AuthView.vue')
const AccountDashboardView = () => import('@/views/AccountDashboardView.vue')
const OrderDetailView = () => import('@/views/OrderDetailView.vue')
const AdminOrdersView = () => import('@/views/AdminOrdersView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/product/:id',
      name: 'product',
      component: ProductView,
    },
    {
      path: '/about',
      name: 'about',
      component: AboutView,
    },
    {
      path: '/contact',
      name: 'contact',
      component: ContactView,
    },
    {
      path: '/order-confirmation',
      redirect: '/checkout-success',
    },
    {
      path: '/thank-you',
      redirect: '/checkout-success',
    },
    {
      path: '/checkout-success',
      name: 'checkout-success',
      component: CheckoutSuccessView,
    },
    // ── Customer Portal (Area Riservata) ──
    {
      path: '/login',
      name: 'login',
      component: AuthView,
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      name: 'register',
      component: AuthView,
      meta: { guestOnly: true },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: AuthView,
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: AuthView,
    },
    {
      path: '/account',
      name: 'account',
      component: AccountDashboardView,
      meta: { requiresCustomerAuth: true },
    },
    {
      path: '/account/orders',
      redirect: '/account',
    },
    {
      path: '/account/orders/:id',
      name: 'order-detail',
      component: OrderDetailView,
      meta: { requiresCustomerAuth: true },
    },
    // ── Lightweight Admin Panel (Order Status & Tracking Management) ──
    {
      path: '/admin',
      name: 'admin-orders',
      component: AdminOrdersView,
    },
    {
      path: '/admin-dashboard',
      redirect: '/admin',
    },
  ],
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    if (to.hash) {
      return waitForElement(to.hash).then((found) =>
        found ? { el: to.hash, behavior: 'smooth' as const } : { top: 0 },
      )
    }
    return { top: 0 }
  },
})

/**
 * The target page mounts only after the previous one has faded out (Transition out-in) and its
 * code has loaded, so a hash target like #catalogo may not exist yet when scrollBehavior runs.
 */
function waitForElement(selector: string, timeout = 2000): Promise<boolean> {
  return new Promise((resolve) => {
    const start = performance.now()
    const check = () => {
      if (document.querySelector(selector)) return resolve(true)
      if (performance.now() - start > timeout) return resolve(false)
      requestAnimationFrame(check)
    }
    check()
  })
}

// After a deploy, the old page chunks no longer exist on GitHub Pages: load the page fresh
// instead of leaving the visitor on a frozen route.
router.onError((error, to) => {
  if (/dynamically imported module|Importing a module script failed|Loading chunk/i.test(String(error?.message))) {
    window.location.assign(to.fullPath)
  }
})

// Customer Portal navigation guard
router.beforeEach((to) => {
  const { isAuthenticated } = useAuth()

  if (to.meta.requiresCustomerAuth && !isAuthenticated.value) {
    return {
      path: '/login',
      query: { redirect: to.fullPath },
    }
  }

  if (to.meta.guestOnly && isAuthenticated.value) {
    return '/account'
  }

  return true
})

export default router

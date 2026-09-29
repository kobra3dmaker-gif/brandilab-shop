import { createRouter, createWebHistory } from 'vue-router'

const HomeView = () => import('@/views/HomeView.vue')
const ShopView = () => import('@/views/ShopView.vue')
const ProductView = () => import('@/views/ProductView.vue')
const AboutView = () => import('@/views/AboutView.vue')
const ContactView = () => import('@/views/ContactView.vue')
const OrderConfirmationView = () => import('@/views/OrderConfirmationView.vue')
const ThankYouView = () => import('@/views/ThankYouView.vue')
const AdminDashboard = () => import('@/views/AdminDashboard.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/shop',
      name: 'shop',
      component: ShopView,
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
      name: 'order-confirmation',
      component: OrderConfirmationView,
    },
    {
      path: '/thank-you',
      name: 'thank-you',
      component: ThankYouView,
    },
    {
      path: '/admin-dashboard',
      name: 'AdminDashboard',
      component: AdminDashboard,
      meta: { requiresAuth: true },
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    // Opening/closing the Snipcart cart only changes the hash — keep the page where it was
    if (to.path === from.path && (isSnipcartHash(to.hash) || isSnipcartHash(from.hash))) {
      return false
    }
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  },
})

// Snipcart routes live in the URL hash (e.g. /shop#/cart, /shop#/checkout)
function isSnipcartHash(hash: string) {
  return hash.startsWith('#/')
}

/**
 * Close the Snipcart cart and resolve once it has unwound its history entries.
 * Snipcart closes by calling history.back() (once per cart step), so we wait
 * until the URL no longer points at a Snipcart route.
 */
function closeSnipcart(): Promise<void> {
  return new Promise((resolve) => {
    const finish = () => {
      window.removeEventListener('popstate', onPopState)
      clearTimeout(timeout)
      // Let Snipcart and Vue Router finish handling the popstate first
      setTimeout(resolve)
    }
    const onPopState = () => {
      if (!isSnipcartHash(location.hash)) finish()
    }
    const timeout = setTimeout(finish, 1000)
    window.addEventListener('popstate', onPopState)
    ;(window as any).Snipcart?.api.theme.cart.close()
  })
}

// Navigating anywhere (even to the same page, e.g. "Home" while on /#/cart) while the cart
// is open would push the new page on top of the cart's history entry and leave the cart
// open as an overlay that can no longer be closed. Close the cart first, then navigate.
router.beforeEach((to, from) => {
  const leavingOpenCart =
    isSnipcartHash(from.hash) &&
    location.hash === from.hash && // still on the cart entry, i.e. not a back/forward
    !isSnipcartHash(to.hash)

  if (leavingOpenCart) {
    closeSnipcart().then(() => router.push(to.fullPath))
    return false
  }
})

// Admin authentication guard
const ADMIN_PASSWORD = 'brandilab2026'

router.beforeEach((to, _from, next) => {
  if (to.meta.requiresAuth) {
    const isAuthenticated = localStorage.getItem('adminAuth') === 'true'
    if (isAuthenticated) {
      next()
    } else {
      const password = prompt('Restricted Area — Enter Admin Password:')
      if (password === ADMIN_PASSWORD) {
        localStorage.setItem('adminAuth', 'true')
        next()
      } else {
        next('/')
      }
    }
  } else {
    next()
  }
})

export default router

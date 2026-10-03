import { createRouter, createWebHistory } from 'vue-router'

const HomeView = () => import('@/views/HomeView.vue')
const ProductView = () => import('@/views/ProductView.vue')
const AboutView = () => import('@/views/AboutView.vue')
const ContactView = () => import('@/views/ContactView.vue')
const CheckoutSuccessView = () => import('@/views/CheckoutSuccessView.vue')
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
      redirect: '/checkout-success'
    },
    {
      path: '/thank-you',
      redirect: '/checkout-success'
    },
    {
      path: '/checkout-success',
      name: 'checkout-success',
      component: CheckoutSuccessView,
    },
    {
      path: '/admin-dashboard',
      name: 'AdminDashboard',
      component: AdminDashboard,
      meta: { requiresAuth: true },
    },
  ],
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  },
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

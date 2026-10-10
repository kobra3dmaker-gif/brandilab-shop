import { ref, computed } from 'vue'
import type { UserProfile, UserAddress } from '@/types'

const TOKEN_STORAGE_KEY = 'brandilab-auth-token'
const USER_STORAGE_KEY = 'brandilab-auth-user'
const ADDR_STORAGE_KEY = 'brandilab-auth-addresses'
const LOCAL_USERS_KEY = 'brandilab-local-registered-users'

const API_BASE = import.meta.env.VITE_API_URL || ''

const DEMO_USER: UserProfile = {
  id: 'usr-demo-brandilab-01',
  email: 'cliente@brandilab.it',
  firstName: 'Marco',
  lastName: 'Rossi',
  phone: '+39 348 123 4567',
  createdAt: '2026-01-15T10:30:00Z',
  isDemo: true,
}

const DEMO_ADDRESSES: UserAddress[] = [
  {
    id: 'addr-demo-1',
    label: 'Casa',
    recipientName: 'Marco Rossi',
    line1: 'Via Emilia Centro 142',
    line2: 'Scala B, Interno 4',
    city: 'Modena',
    postalCode: '41121',
    province: 'MO',
    country: 'IT',
    phone: '+39 348 123 4567',
    isDefault: true,
  },
  {
    id: 'addr-demo-2',
    label: 'Studio / Ufficio',
    recipientName: 'Marco Rossi — Studio Design',
    line1: 'Viale Indipendenza 58',
    line2: 'Piano 2',
    city: 'Bologna',
    postalCode: '40121',
    province: 'BO',
    country: 'IT',
    phone: '+39 348 123 4567',
    isDefault: false,
  },
]

interface StoredLocalAccount {
  profile: UserProfile
  password: string
}

function loadStoredJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

const token = ref<string | null>(localStorage.getItem(TOKEN_STORAGE_KEY))
const user = ref<UserProfile | null>(loadStoredJson<UserProfile | null>(USER_STORAGE_KEY, null))
const addresses = ref<UserAddress[]>(loadStoredJson<UserAddress[]>(ADDR_STORAGE_KEY, []))
const loading = ref(false)

function persistSession(newToken: string | null, newUser: UserProfile | null, newAddresses?: UserAddress[]) {
  token.value = newToken
  user.value = newUser
  if (newAddresses !== undefined) {
    addresses.value = newAddresses
  }
  try {
    if (newToken) localStorage.setItem(TOKEN_STORAGE_KEY, newToken)
    else localStorage.removeItem(TOKEN_STORAGE_KEY)

    if (newUser) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser))
    else localStorage.removeItem(USER_STORAGE_KEY)

    if (newAddresses !== undefined) {
      localStorage.setItem(ADDR_STORAGE_KEY, JSON.stringify(newAddresses))
    }
  } catch {
    // Ignore storage quota errors
  }
}

export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token.value) {
    headers['Authorization'] = `Bearer ${token.value}`
  }
  return headers
}

function findLocalAccount(email: string): StoredLocalAccount | undefined {
  const list = loadStoredJson<StoredLocalAccount[]>(LOCAL_USERS_KEY, [])
  return list.find((acc) => acc.profile.email.toLowerCase() === email.trim().toLowerCase())
}

function saveLocalAccount(account: StoredLocalAccount) {
  const list = loadStoredJson<StoredLocalAccount[]>(LOCAL_USERS_KEY, []).filter(
    (acc) => acc.profile.email.toLowerCase() !== account.profile.email.toLowerCase(),
  )
  list.push(account)
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(list))
  } catch {
    // Ignore storage error
  }
}

export function useAuth() {
  const isAuthenticated = computed(() => Boolean(user.value && token.value))
  const fullName = computed(() =>
    user.value ? `${user.value.firstName} ${user.value.lastName}`.trim() : '',
  )
  const initials = computed(() => {
    if (!user.value) return ''
    const f = user.value.firstName?.[0] || ''
    const l = user.value.lastName?.[0] || ''
    return `${f}${l}`.toUpperCase() || 'U'
  })

  async function login(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
    loading.value = true
    const cleanEmail = email.trim().toLowerCase()

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      })

      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const data = await res.json()
        if (res.ok && data.token && data.user) {
          persistSession(data.token, data.user)
          await fetchProfile()
          return { ok: true }
        }
        // If remote worker has D1 active and explicitly rejected credentials
        if (res.status === 401 || res.status === 400) {
          return { ok: false, error: data.error || 'invalid_credentials' }
        }
      }

      // Fallback when remote Worker hasn't been deployed with D1 yet (404 / 503)
      const localAcc = findLocalAccount(cleanEmail)
      if (localAcc && localAcc.password === password) {
        persistSession(`local-jwt-${localAcc.profile.id}`, localAcc.profile, [...DEMO_ADDRESSES])
        return { ok: true }
      }
      if (cleanEmail === DEMO_USER.email && password.length >= 6) {
        loginDemo()
        return { ok: true }
      }
      return { ok: false, error: 'invalid_credentials' }
    } catch {
      const localAcc = findLocalAccount(cleanEmail)
      if (localAcc && localAcc.password === password) {
        persistSession(`local-jwt-${localAcc.profile.id}`, localAcc.profile, [...DEMO_ADDRESSES])
        return { ok: true }
      }
      if (cleanEmail === DEMO_USER.email && password.length >= 6) {
        loginDemo()
        return { ok: true }
      }
      return { ok: false, error: 'server_unreachable' }
    } finally {
      loading.value = false
    }
  }

  function loginDemo() {
    persistSession('demo-jwt-token-brandilab', { ...DEMO_USER }, [...DEMO_ADDRESSES])
  }

  async function register(payload: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    password: string
  }): Promise<{ ok: boolean; error?: string }> {
    loading.value = true
    const cleanEmail = payload.email.trim().toLowerCase()

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, email: cleanEmail }),
      })

      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const data = await res.json()
        if (res.ok && data.token && data.user) {
          persistSession(data.token, data.user, [])
          return { ok: true }
        }
        if (res.status === 409 || res.status === 400) {
          return { ok: false, error: data.error || 'registration_failed' }
        }
      }

      // Local fallback when Worker is not yet deployed with D1
      const localUser: UserProfile = {
        id: `usr-${Date.now()}`,
        email: cleanEmail,
        firstName: payload.firstName.trim(),
        lastName: payload.lastName.trim(),
        phone: (payload.phone || '').trim(),
        createdAt: new Date().toISOString(),
        isDemo: true,
      }
      saveLocalAccount({ profile: localUser, password: payload.password })
      persistSession(`local-jwt-${localUser.id}`, localUser, [...DEMO_ADDRESSES])
      return { ok: true }
    } catch {
      const localUser: UserProfile = {
        id: `usr-${Date.now()}`,
        email: cleanEmail,
        firstName: payload.firstName.trim(),
        lastName: payload.lastName.trim(),
        phone: (payload.phone || '').trim(),
        createdAt: new Date().toISOString(),
        isDemo: true,
      }
      saveLocalAccount({ profile: localUser, password: payload.password })
      persistSession(`local-jwt-${localUser.id}`, localUser, [...DEMO_ADDRESSES])
      return { ok: true }
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    if (!user.value?.isDemo) {
      fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders(),
      }).catch(() => {})
    }
    persistSession(null, null, [])
  }

  async function fetchProfile() {
    if (!token.value || user.value?.isDemo) return
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: getAuthHeaders(),
      })
      if (res.status === 401) {
        persistSession(null, null, [])
        return
      }
      const contentType = res.headers.get('content-type') || ''
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json()
        persistSession(token.value, data.user, data.addresses || [])
      }
    } catch {
      // Keep cached user profile if offline
    }
  }

  async function updateProfile(payload: {
    firstName: string
    lastName: string
    phone: string
    currentPassword?: string
    newPassword?: string
  }): Promise<{ ok: boolean; error?: string }> {
    if (!user.value) return { ok: false, error: 'unauthorized' }

    if (user.value.isDemo) {
      const updated: UserProfile = {
        ...user.value,
        firstName: payload.firstName.trim(),
        lastName: payload.lastName.trim(),
        phone: payload.phone.trim(),
      }
      persistSession(token.value, updated)
      return { ok: true }
    }

    loading.value = true
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        return { ok: false, error: data.error || 'update_failed' }
      }
      persistSession(token.value, data.user)
      return { ok: true }
    } catch {
      return { ok: false, error: 'server_unreachable' }
    } finally {
      loading.value = false
    }
  }

  async function requestPasswordReset(email: string): Promise<{ ok: boolean }> {
    loading.value = true
    try {
      await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).catch(() => {})
      return { ok: true }
    } finally {
      loading.value = false
    }
  }

  async function confirmPasswordReset(resetToken: string, password: string): Promise<{ ok: boolean; error?: string }> {
    loading.value = true
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password }),
      })
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const data = await res.json()
        if (!res.ok) return { ok: false, error: data.error || 'invalid_or_expired_token' }
        return { ok: true }
      }
      return { ok: true }
    } catch {
      return { ok: false, error: 'server_unreachable' }
    } finally {
      loading.value = false
    }
  }

  async function addAddress(newAddr: Omit<UserAddress, 'id'>): Promise<{ ok: boolean; error?: string }> {
    if (!user.value) return { ok: false, error: 'unauthorized' }

    if (user.value.isDemo) {
      const created: UserAddress = {
        ...newAddr,
        id: `addr-${Date.now()}`,
      }
      let nextList = [...addresses.value]
      if (created.isDefault) {
        nextList = nextList.map((a) => ({ ...a, isDefault: false }))
      }
      nextList.unshift(created)
      persistSession(token.value, user.value, nextList)
      return { ok: true }
    }

    try {
      const res = await fetch(`${API_BASE}/api/me/addresses`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newAddr),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) return { ok: false, error: data.error || 'address_error' }
      persistSession(token.value, user.value, data.addresses || [])
      return { ok: true }
    } catch {
      return { ok: false, error: 'server_unreachable' }
    }
  }

  async function setDefaultAddress(addressId: string) {
    if (!user.value) return
    if (user.value.isDemo) {
      const nextList = addresses.value.map((a) => ({
        ...a,
        isDefault: a.id === addressId,
      }))
      persistSession(token.value, user.value, nextList)
      return
    }

    try {
      const res = await fetch(`${API_BASE}/api/me/addresses/${encodeURIComponent(addressId)}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isDefault: true }),
      })
      if (res.ok) {
        const data = await res.json()
        persistSession(token.value, user.value, data.addresses || [])
      }
    } catch {
      // Ignore network error
    }
  }

  async function deleteAddress(addressId: string) {
    if (!user.value) return
    if (user.value.isDemo) {
      const nextList = addresses.value.filter((a) => a.id !== addressId)
      persistSession(token.value, user.value, nextList)
      return
    }

    try {
      const res = await fetch(`${API_BASE}/api/me/addresses/${encodeURIComponent(addressId)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        const nextList = addresses.value.filter((a) => a.id !== addressId)
        persistSession(token.value, user.value, nextList)
      }
    } catch {
      // Ignore network error
    }
  }

  return {
    user,
    token,
    addresses,
    loading,
    isAuthenticated,
    fullName,
    initials,
    login,
    loginDemo,
    register,
    logout,
    fetchProfile,
    updateProfile,
    requestPasswordReset,
    confirmPasswordReset,
    addAddress,
    setDefaultAddress,
    deleteAddress,
  }
}

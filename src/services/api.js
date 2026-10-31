import axios from 'axios'

// Backend production base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://milkmanagement.devs.surf'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Build unique cache key for GET requests based on endpoint URL and query parameters
function getCacheKey(config) {
  if (!config) return null
  const method = (config.method || 'get').toLowerCase()
  const url = config.url || ''
  const params = config.params ? JSON.stringify(config.params) : ''
  return `api_cache_${method}_${url}_${params}`
}

// Safely stores cache with automatic quota cleanup if localStorage becomes full
function safelyStoreCache(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    try {
      // Clear half of the oldest api_cache_ items to free up space
      const keys = []
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && k.startsWith('api_cache_')) {
          keys.push(k)
        }
      }
      keys.slice(0, Math.ceil(keys.length / 2)).forEach((k) => localStorage.removeItem(k))
      localStorage.setItem(key, JSON.stringify(value))
    } catch (ignore) {}
  }
}

// Request Interceptor: Attach JWT Token, handle FormData boundary & normalize to /api prefix
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('milk_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // When sending FormData, delete Content-Type so browser automatically generates multipart boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }

    // Ensure every API URL has /api prefix
    if (config.url && !config.url.startsWith('http')) {
      if (!config.url.startsWith('/api')) {
        config.url = `/api${config.url.startsWith('/') ? '' : '/'}${config.url}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor: Caching, Offline fallback & 401 Unauthorized handling
api.interceptors.response.use(
  (response) => {
    // Automatically cache successful GET responses in localStorage
    const method = (response.config?.method || 'get').toLowerCase()
    if (method === 'get' && response.data !== undefined && response.data !== null) {
      const cacheKey = getCacheKey(response.config)
      if (cacheKey) {
        safelyStoreCache(cacheKey, {
          data: response.data,
          status: response.status,
          headers: response.headers,
          timestamp: Date.now(),
        })
      }
    }
    return response
  },
  (error) => {
    const config = error.config

    // If request was a GET and backend failed (server down, network error, 5xx), fallback to localStorage cached data
    if (config && (config.method || 'get').toLowerCase() === 'get') {
      const isNetworkOrServerError = !error.response || (error.response.status >= 500 && error.response.status !== 501)
      if (isNetworkOrServerError) {
        const cacheKey = getCacheKey(config)
        const cachedRaw = cacheKey ? localStorage.getItem(cacheKey) : null
        if (cachedRaw) {
          try {
            const cached = JSON.parse(cachedRaw)
            console.warn(`[Offline Cache Fallback] Backend unreachable for ${config.url}. Displaying cached data from localStorage.`)

            // Dispatch global event so UI can display offline banner
            window.dispatchEvent(
              new CustomEvent('api-offline-fallback', {
                detail: {
                  url: config.url,
                  timestamp: cached.timestamp,
                },
              })
            )

            // Resolve gracefully with cached data
            return Promise.resolve({
              data: cached.data,
              status: 200,
              statusText: 'OK (Offline Cache Fallback)',
              headers: cached.headers || {},
              config: config,
              isOfflineCached: true,
              cachedTimestamp: cached.timestamp,
            })
          } catch (e) {
            console.error('Failed to parse cached data:', e)
          }
        }
      }
    }

    if (error.response && error.response.status === 401) {
      // Clear token if expired or invalid
      localStorage.removeItem('milk_token')
      localStorage.removeItem('milk_user')
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/') {
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  }
)

export default api

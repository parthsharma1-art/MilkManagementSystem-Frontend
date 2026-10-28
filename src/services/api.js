import axios from 'axios'

// Backend production base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://milkmanagementsystem.devs.surf'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor: Attach JWT Token & normalize to /api prefix
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('milk_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
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

// Response Interceptor: Handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired or invalid
      localStorage.removeItem('milk_token')
      localStorage.removeItem('milk_user')
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

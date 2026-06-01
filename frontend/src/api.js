import axios from 'axios'
import { supabase } from './supabaseClient.js'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  import.meta.env.DEV ? 'http://localhost:3001/api' : '/api'
)

if (!import.meta.env.DEV && !import.meta.env.VITE_API_BASE_URL) {
  console.warn('[HabitMind] VITE_API_BASE_URL is not set. API calls may fail in production.')
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000 // 30 second timeout to prevent indefinite hangs
})

// Attach Bearer token to all requests if present in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hm_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

// Retry logic with exponential backoff + token refresh
const MAX_RETRIES = 2
const RETRY_DELAY = 1000
let isRefreshing = false
let refreshPromise = null

async function attemptTokenRefresh() {
  // Prevent multiple simultaneous refresh attempts
  if (isRefreshing) {
    return refreshPromise
  }
  
  isRefreshing = true
  refreshPromise = (async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error || !data.session) {
        throw new Error('Refresh failed')
      }
      
      // Update stored token
      localStorage.setItem('hm_token', data.session.access_token)
      if (data.user) {
        localStorage.setItem('hm_user', JSON.stringify({
          id: data.user.id,
          email: data.user.email
        }))
      }
      
      return data.session.access_token
    } catch (err) {
      // Refresh failed — force logout
      localStorage.removeItem('hm_token')
      localStorage.removeItem('hm_user')
      window.location.reload()
      throw err
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()
  
  return refreshPromise
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config

    // Handle expired or invalid JWT sessions — try refresh first
    if (error.response && error.response.status === 401 && !config.__hasRetried401) {
      config.__hasRetried401 = true
      try {
        const newToken = await attemptTokenRefresh()
        config.headers.Authorization = `Bearer ${newToken}`
        return api(config)
      } catch (refreshErr) {
        return Promise.reject(error)
      }
    }

    // Handle rate limiting
    if (error.response && error.response.status === 429) {
      return Promise.reject(error)
    }

    // Don't retry for client errors (4xx) or if already retried max times
    if (
      !config ||
      (error.response && error.response.status >= 400 && error.response.status < 500) ||
      (config.__retryCount || 0) >= MAX_RETRIES
    ) {
      return Promise.reject(error)
    }

    config.__retryCount = (config.__retryCount || 0) + 1
    const delay = RETRY_DELAY * Math.pow(2, config.__retryCount - 1)

    await new Promise(resolve => setTimeout(resolve, delay))
    return api(config)
  }
)

export default api

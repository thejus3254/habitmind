import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_BASE_URL
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

// Handle expired or invalid JWT sessions automatically
api.interceptors.response.use((response) => {
  return response
}, (error) => {
  if (error.response && error.response.status === 401) {
    localStorage.removeItem('hm_token')
    localStorage.removeItem('hm_user')
    // Instantly trigger view redirection by reloading the page
    window.location.reload()
  }
  return Promise.reject(error)
})

export default api

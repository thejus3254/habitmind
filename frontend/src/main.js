import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

const app = createApp(App)

// Global Vue error handler — prevents white screen of death
app.config.errorHandler = (err, instance, info) => {
  console.error('[Vue Error]', err, info)
  // Dispatch custom event for ErrorToast to pick up
  window.dispatchEvent(new CustomEvent('vue-error', {
    detail: { message: err?.message || 'An unexpected error occurred' }
  }))
}

// Global unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Rejection]', event.reason)
  event.preventDefault()
})

// Global JS errors
window.addEventListener('error', (event) => {
  console.error('[Global Error]', event.error)
})

app.mount('#app')
<template>
  <div class="auth-container fade-in">
    <!-- Floating background blobs for visual depth -->
    <div class="blob blob-primary"></div>
    <div class="blob blob-secondary"></div>

    <!-- OAuth Redirect Loading -->
    <div v-if="oauthLoading" class="oauth-loading-overlay">
      <div class="oauth-loading-card glass-panel">
        <div class="spinner-large"></div>
        <h2>Completing Google Sign-In...</h2>
        <p class="tagline">Verifying your identity securely</p>
      </div>
    </div>

    <div class="auth-card glass-panel">
      <div class="auth-header">
        <div class="logo-mark">HM</div>
        <h1 class="logo-text">HabitMind</h1>
        <p class="tagline">Your personal habit companion · Safe & Secure</p>
      </div>

      <!-- Google Sign-In Button -->
      <button class="btn-google" @click="handleGoogleSignIn" :disabled="googleLoading">
        <svg class="google-icon" viewBox="0 0 24 24" width="20" height="20">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span>{{ googleLoading ? 'Connecting...' : 'Continue with Google' }}</span>
      </button>

      <!-- Divider -->
      <div class="auth-divider">
        <span class="divider-line"></span>
        <span class="divider-text">or</span>
        <span class="divider-line"></span>
      </div>

      <!-- Mode Selector Tabs -->
      <div class="auth-tabs">
        <button 
          class="auth-tab-btn" 
          :class="{ active: mode === 'login' }" 
          @click="setMode('login')"
        >
          🔑 Login
        </button>
        <button 
          class="auth-tab-btn" 
          :class="{ active: mode === 'signup' }" 
          @click="setMode('signup')"
        >
          ✨ Register
        </button>
      </div>

      <!-- Status Alerts -->
      <div v-if="errorMsg" class="alert error-alert fade-in">
        <span class="alert-icon">⚠️</span>
        <span class="alert-text">{{ errorMsg }}</span>
      </div>
      <div v-if="successMsg" class="alert success-alert fade-in">
        <span class="alert-icon">🎉</span>
        <span class="alert-text">{{ successMsg }}</span>
      </div>

      <!-- Auth Form -->
      <form @submit.prevent="handleSubmit" class="auth-form">
        <div class="form-group">
          <label for="email" class="form-label">Email Address</label>
          <div class="input-wrapper">
            <span class="input-icon">✉️</span>
            <input 
              type="email" 
              id="email" 
              v-model="email" 
              placeholder="you@example.com" 
              required
              class="form-input"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <div class="input-wrapper">
            <span class="input-icon">🔒</span>
            <input 
              :type="showPassword ? 'text' : 'password'" 
              id="password" 
              v-model="password" 
              placeholder="••••••••" 
              required
              class="form-input"
              @input="checkPasswordStrength"
            />
            <button 
              type="button" 
              class="btn-toggle-password" 
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? '👁️' : '🙈' }}
            </button>
          </div>

          <!-- Password Strength Indicator (Only for Sign Up) -->
          <div v-if="mode === 'signup' && password" class="password-strength-meter fade-in">
            <div class="meter-bar">
              <div 
                class="meter-fill" 
                :class="strengthClass" 
                :style="{ width: strengthWidth }"
              ></div>
            </div>
            <span class="strength-label">Strength: {{ strengthLabel }}</span>
            
            <ul class="strength-requirements">
              <li :class="{ met: hasMinLength }">
                {{ hasMinLength ? '✓' : '✗' }} At least 8 characters
              </li>
              <li :class="{ met: hasUppercase }">
                {{ hasUppercase ? '✓' : '✗' }} At least 1 uppercase letter
              </li>
              <li :class="{ met: hasNumber }">
                {{ hasNumber ? '✓' : '✗' }} At least 1 number
              </li>
              <li :class="{ met: hasSpecialChar }">
                {{ hasSpecialChar ? '✓' : '✗' }} At least 1 special character
              </li>
            </ul>
          </div>
        </div>

        <!-- Confirm Password (Only for Sign Up) -->
        <div class="form-group fade-in" v-if="mode === 'signup'">
          <label for="confirmPassword" class="form-label">Confirm Password</label>
          <div class="input-wrapper">
            <span class="input-icon">🛡️</span>
            <input 
              type="password" 
              id="confirmPassword" 
              v-model="confirmPassword" 
              placeholder="••••••••" 
              required
              class="form-input"
            />
          </div>
          <span 
            v-if="confirmPassword && password !== confirmPassword" 
            class="validation-error fade-in"
          >
            Passwords do not match.
          </span>
        </div>

        <!-- Submit Button -->
        <button 
          type="submit" 
          class="btn-submit" 
          :disabled="loading || (mode === 'signup' && !isFormValid)"
        >
          <span v-if="loading" class="spinner"></span>
          <span>{{ buttonText }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import api from '../api.js'
import { supabase } from '../supabaseClient.js'

const emit = defineEmits(['auth-success'])

const mode = ref('login')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const loading = ref(false)
const googleLoading = ref(false)
const oauthLoading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

// Password strength metrics
const strengthScore = ref(0)
const strengthLabel = ref('Weak')
const strengthClass = ref('weak')
const strengthWidth = ref('0%')

function setMode(newMode) {
  mode.value = newMode
  errorMsg.value = ''
  successMsg.value = ''
  password.value = ''
  confirmPassword.value = ''
}

const buttonText = computed(() => {
  if (loading.value) {
    return mode.value === 'login' ? 'Logging in...' : 'Signing up...'
  }
  return mode.value === 'login' ? 'Sign In to Your Orbit' : 'Launch New Account'
})

// Calculate password complexity on the fly
function checkPasswordStrength() {
  const pwd = password.value
  let score = 0

  if (!pwd) {
    strengthScore.value = 0
    strengthLabel.value = 'None'
    strengthClass.value = 'none'
    strengthWidth.value = '0%'
    return
  }

  if (pwd.length >= 8) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[a-z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score++

  strengthScore.value = score

  if (score <= 2) {
    strengthLabel.value = 'Weak 🔴'
    strengthClass.value = 'weak'
    strengthWidth.value = '33%'
  } else if (score <= 4) {
    strengthLabel.value = 'Medium 🟡'
    strengthClass.value = 'medium'
    strengthWidth.value = '66%'
  } else {
    strengthLabel.value = 'Strong 🟢'
    strengthClass.value = 'strong'
    strengthWidth.value = '100%'
  }
}

const hasMinLength = computed(() => password.value.length >= 8)
const hasUppercase = computed(() => /[A-Z]/.test(password.value))
const hasNumber = computed(() => /[0-9]/.test(password.value))
const hasSpecialChar = computed(() => /[!@#$%^&*(),.?":{}|<>]/.test(password.value))

// Check if signup form satisfies security policies
const isFormValid = computed(() => {
  if (mode.value === 'login') return true
  return (
    email.value &&
    hasMinLength.value &&
    hasUppercase.value &&
    hasNumber.value &&
    hasSpecialChar.value &&
    password.value === confirmPassword.value
  )
})

// Google OAuth sign-in via Supabase
async function handleGoogleSignIn() {
  googleLoading.value = true
  errorMsg.value = ''
  successMsg.value = ''

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    })

    if (error) {
      throw error
    }
    // User will be redirected to Google — no further action here
  } catch (err) {
    console.error('Google Sign-In Error:', err)
    errorMsg.value = err.message || 'Failed to initiate Google sign-in. Please try again.'
    googleLoading.value = false
  }
}

// Handles Sign In & Sign Up submits
async function handleSubmit() {
  errorMsg.value = ''
  successMsg.value = ''
  
  if (mode.value === 'signup' && !isFormValid.value) {
    errorMsg.value = 'Please satisfy all security password requirements.'
    return
  }

  loading.value = true
  try {
    if (mode.value === 'signup') {
      const res = await api.post('/auth/signup', {
        email: email.value,
        password: password.value
      })

      const { user, session } = res.data.data
      if (session) {
        successMsg.value = 'Account registered successfully! Logging you in...'
        emit('auth-success', { user, token: session.access_token })
      } else {
        successMsg.value = 'Account registered successfully! A confirmation email has been sent. Please verify your email before logging in.'
      }
    } else {
      const res = await api.post('/auth/login', {
        email: email.value,
        password: password.value
      })
      
      const { user, session } = res.data.data
      emit('auth-success', { user, token: session.access_token })
    }
  } catch (err) {
    console.error('Authentication Error:', err)
    errorMsg.value = err.response?.data?.error || 'Authentication failed. Please check your credentials.'
  } finally {
    loading.value = false
  }
}

// Check for OAuth redirect callback on mount
onMounted(async () => {
  // If URL has hash fragments (from OAuth redirect), show loading
  if (window.location.hash && window.location.hash.includes('access_token')) {
    oauthLoading.value = true
    try {
      const { data, error } = await supabase.auth.getSession()
      if (data.session && !error) {
        emit('auth-success', {
          user: { id: data.session.user.id, email: data.session.user.email },
          token: data.session.access_token
        })
        // Clean up URL
        window.history.replaceState(null, '', window.location.pathname)
        return
      }
    } catch (err) {
      console.error('OAuth callback error:', err)
      errorMsg.value = 'Failed to complete Google sign-in. Please try again.'
    } finally {
      oauthLoading.value = false
    }
  }
})
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  position: relative;
  overflow: hidden;
  padding: 1rem;
}

/* Background Glowing Blobs */
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  z-index: 1;
  opacity: 0.15;
  pointer-events: none;
}

.blob-primary {
  width: 300px;
  height: 300px;
  background: var(--primary);
  top: 10%;
  left: 20%;
  animation: float1 12s infinite alternate ease-in-out;
}

.blob-secondary {
  width: 250px;
  height: 250px;
  background: #8b5cf6;
  bottom: 10%;
  right: 20%;
  animation: float2 10s infinite alternate ease-in-out;
}

@keyframes float1 {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(30px, 40px) scale(1.1); }
}

@keyframes float2 {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(-30px, -40px) scale(1.15); }
}

/* Auth Card */
.auth-card {
  width: 100%;
  max-width: 450px;
  border-radius: 24px;
  padding: 2.5rem;
  z-index: 2;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-mark {
  background: linear-gradient(135deg, var(--primary) 0%, #8b5cf6 100%);
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
  width: 50px;
  height: 50px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  margin-bottom: 0.75rem;
}

.logo-text {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: var(--text-primary);
  margin: 0;
}

.tagline {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

/* Google Button */
.btn-google {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 16px;
  background: #ffffff;
  color: #3c4043;
  border: 1px solid #dadce0;
  border-radius: 12px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.btn-google:hover:not(:disabled) {
  background: #f7f8f8;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.btn-google:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.btn-google:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.google-icon {
  flex-shrink: 0;
}

/* Divider */
.auth-divider {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 1.5rem 0;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: var(--border-color);
}

.divider-text {
  font-size: 12px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 500;
}

/* Tabs */
.auth-tabs {
  display: flex;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 4px;
  margin-bottom: 2rem;
}

.auth-tab-btn {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  padding: 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.auth-tab-btn.active {
  background: rgba(99, 102, 241, 0.15);
  color: #fff;
  border: 1px solid rgba(99, 102, 241, 0.3);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
}

/* Alerts */
.alert {
  padding: 10px 14px;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.error-alert {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.success-alert {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #a7f3d0;
}

.alert-text {
  flex: 1;
  text-align: left;
}

/* Forms */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
}

.form-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 12px;
  font-size: 15px;
  color: var(--text-muted);
}

.form-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 11px 12px 11px 36px;
  color: #fff;
  font-family: inherit;
  font-size: 14px;
  transition: all 0.2s ease-in-out;
}

.form-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.btn-toggle-password {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 16px;
  padding: 0;
}

.btn-toggle-password:hover {
  color: #fff;
}

/* Submit Button */
.btn-submit {
  background: linear-gradient(135deg, var(--primary) 0%, #8b5cf6 100%);
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 12px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.25);
  margin-top: 1rem;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

.btn-submit:active:not(:disabled) {
  transform: translateY(0);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Validation styling */
.validation-error {
  font-size: 11px;
  color: #fca5a5;
  margin-top: 2px;
}

/* Strength Meter */
.password-strength-meter {
  background: rgba(255, 255, 255, 0.01);
  border: 1px solid var(--border-color);
  padding: 10px;
  border-radius: 10px;
  margin-top: 6px;
}

.meter-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 4px;
}

.meter-fill {
  height: 100%;
  width: 0;
  transition: all 0.3s ease;
}

.meter-fill.weak { background: #ef4444; }
.meter-fill.medium { background: #f59e0b; }
.meter-fill.strong { background: #10b981; }

.strength-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
}

.strength-requirements {
  list-style: none;
  padding: 0;
  margin: 6px 0 0 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  text-align: left;
}

.strength-requirements li {
  font-size: 10px;
  color: #fca5a5;
  display: flex;
  align-items: center;
  gap: 4px;
}

.strength-requirements li.met {
  color: #a7f3d0;
}

/* Spinner */
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s infinite linear;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.fade-in {
  animation: fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

/* OAuth Loading Overlay */
.oauth-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

.oauth-loading-card {
  text-align: center;
  padding: 3rem 2.5rem;
  border-radius: 24px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.oauth-loading-card h2 {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 1.25rem 0 0.5rem;
}

.oauth-loading-card .tagline {
  font-size: 13px;
  color: var(--text-secondary);
}

.spinner-large {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s infinite linear;
  margin: 0 auto;
}
</style>

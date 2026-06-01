<template>
  <div class="page" v-if="token">
    <header class="header glass-panel">
      <div class="header-content">
        <div class="logo">
          <span class="logo-mark">HM</span>
          <div class="logo-info">
            <span class="logo-text">HabitMind</span>
            <p class="tagline">Your personal habit companion · Designed & built by Thejus</p>
          </div>
        </div>

        <!-- Tab Navigation inside Header -->
        <div class="tabs-nav">
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'dashboard' }" 
            @click="activeTab = 'dashboard'"
          >
            🏠 Dashboard
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'analytics' }" 
            @click="activeTab = 'analytics'"
          >
            📊 Calendar & Stats
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'chat' }" 
            @click="activeTab = 'chat'"
          >
            💬 AI Coach Chat
          </button>
        </div>

        <div class="header-stats-wrapper">
          <div class="header-stats" v-if="habits.length">
            <div class="stat-pill">
              <span class="stat-label">Active Habits</span>
              <span class="stat-value">{{ habits.length }}</span>
            </div>
            <div class="stat-pill">
              <span class="stat-label">Completed Today</span>
              <span class="stat-value success">{{ completedCount }}</span>
            </div>
          </div>

          <div class="user-profile-header">
            <span class="user-email" :title="user?.email">👤 {{ user?.email?.split('@')[0] }}</span>
            <button class="btn-logout" @click="handleLogout">Logout 🚪</button>
          </div>
        </div>
      </div>
    </header>

    <main class="main">
      <!-- Time-Travel Banner -->
      <div class="time-travel-banner glass-panel fade-in" v-if="selectedDate !== todayStr">
        <div class="banner-left">
          <span class="banner-icon">🌌</span>
          <p class="banner-text">
            Viewing history for <strong>{{ formatDisplayDate(selectedDate) }}</strong>. Completions toggled here apply to this day.
          </p>
        </div>
        <button class="btn-reset-date" @click="selectedDate = todayStr">Reset to Today</button>
      </div>

      <!-- Dashboard View -->
      <div class="tab-content" v-show="activeTab === 'dashboard'">
        <WeekStrip :selected-date="selectedDate" @select-date="selectDate" />
        <div class="dashboard-grid">
          <!-- Left Column: Habits Tracking & Form -->
          <div class="dashboard-col col-left">
            <div class="section glass-panel">
              <div class="section-header">
                <h2 class="section-title">Habits Orbit</h2>
                <span class="badge">{{ habits.length }} tracked</span>
              </div>
              
              <HabitForm :adding="habitAdding" :selected-date="selectedDate" @submit="onHabitSubmit" />

              <div class="habit-list" v-if="habits.length">
                <HabitCard
                  v-for="(habit, i) in habits"
                  :key="habit.id"
                  :habit="habit"
                  :color="colors[i % colors.length]"
                  @toggle="toggleHabit"
                  @delete="deleteHabit"
                />
              </div>
              <div class="empty-state" v-else>
                <div class="empty-icon">✨</div>
                <p class="empty-title">Your orbit is empty</p>
                <p class="empty-desc">Create your first habit above or click one of the AI suggestions to launch your journey!</p>
              </div>
            </div>
          </div>

          <!-- Right Column: AI Coach, Insights & Suggestions -->
          <div class="dashboard-col col-right">
            <!-- Daily Reminders timeline -->
            <RemindersWidget
              :habits="habits"
              :permission="notificationsPermission"
              @request-permission="requestNotificationPermission"
            />

            <!-- Coach Message -->
            <CoachCard :message="coachMessage" :loading="coachLoading" @refresh="fetchCoach" />

            <!-- Weekly Insights -->
            <WeeklyInsight :insight="weeklyInsight" :loading="insightLoading" @refresh="fetchInsight" />

            <!-- AI suggestions -->
            <SuggestionsCard :suggestions="suggestions" :loading="suggestLoading" @refresh="fetchSuggestions" @add="addSuggestion" />
          </div>
        </div>
      </div>

      <!-- Calendar & Analytics View -->
      <div class="tab-content fade-in" v-show="activeTab === 'analytics'">
        <div class="analytics-grid">
          <AnalyticsWidget :habits="habits" />
          <MonthCalendar :habits="habits" :selected-date="selectedDate" @select-date="onCalendarSelectDate" />
        </div>
      </div>

      <!-- AI Coach Chat View -->
      <div class="tab-content fade-in" v-show="activeTab === 'chat'">
        <CoachChat />
      </div>
    </main>

    <footer class="footer">
      <p>© 2026 HabitMind · Designed & Engineered by Thejus</p>
    </footer>

    <!-- Delete Confirmation Modal -->
    <div class="modal-backdrop" v-if="habitToDelete" @click="cancelDelete">
      <div class="modal-card glass-panel" @click.stop>
        <div class="modal-header">
          <span class="warning-icon">⚠️</span>
          <h3>Delete Habit?</h3>
        </div>
        <p class="modal-body">
          Are you sure you want to delete <strong>"{{ habitToDelete.name }}"</strong>? This will permanently erase your streak of <strong>{{ habitToDelete.streak }} days</strong> and all completion logs. This action cannot be undone.
        </p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="cancelDelete">Cancel</button>
          <button class="btn-confirm-delete" @click="confirmDelete" :disabled="deletingHabit">
            {{ deletingHabit ? 'Deleting...' : 'Delete Permanently' }}
          </button>
        </div>
      </div>
    </div>
  </div>
  <AuthScreen v-else @auth-success="handleAuthSuccess" />
  <ErrorToast />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import api from './api.js'
import { supabase } from './supabaseClient.js'
import CoachCard from './components/CoachCard.vue'
import HabitForm from './components/HabitForm.vue'
import HabitCard from './components/HabitCard.vue'
import WeeklyInsight from './components/WeeklyInsight.vue'
import SuggestionsCard from './components/SuggestionsCard.vue'
import WeekStrip from './components/WeekStrip.vue'
import AnalyticsWidget from './components/AnalyticsWidget.vue'
import MonthCalendar from './components/MonthCalendar.vue'
import CoachChat from './components/CoachChat.vue'
import RemindersWidget from './components/RemindersWidget.vue'
import AuthScreen from './components/AuthScreen.vue'
import ErrorToast from './components/ErrorToast.vue'

const activeTab = ref('dashboard')
const habits = ref([])

// Authentication States
const token = ref(localStorage.getItem('hm_token') || null)
const user = ref(JSON.parse(localStorage.getItem('hm_user') || 'null'))

function handleAuthSuccess({ user: loggedInUser, token: authToken }) {
  token.value = authToken
  user.value = loggedInUser
  localStorage.setItem('hm_token', authToken)
  localStorage.setItem('hm_user', JSON.stringify(loggedInUser))
  
  // Instantly fetch all personalized data upon login
  fetchHabits()
  fetchCoach()
  fetchInsight()
  fetchSuggestions()
}

function handleLogout() {
  token.value = null
  user.value = null
  localStorage.removeItem('hm_token')
  localStorage.removeItem('hm_user')
  habits.value = []
  suggestions.value = []
  
  if (reminderInterval) {
    clearInterval(reminderInterval)
    reminderInterval = null
  }
}
const coachMessage = ref('')
const coachLoading = ref(false)
const weeklyInsight = ref(null)
const insightLoading = ref(false)
const suggestions = ref([])
const suggestLoading = ref(false)
const habitAdding = ref(false)
const colors = [
  '#6366f1', '#10b981', '#f59e0b', '#ec4899',
  '#8b5cf6', '#06b6d4', '#f97316', '#ef4444'
]

// Date Travel States
const selectedDate = ref(new Date().toISOString().split('T')[0])
const todayStr = new Date().toISOString().split('T')[0]

// HTML5 Web Notifications
const notificationsPermission = ref(typeof Notification !== 'undefined' ? Notification.permission : 'default')
const notifiedAlerts = new Set()
let reminderInterval = null

const completedCount = computed(() => {
  return habits.value.filter(h => h.completed_today).length
})

function formatDisplayDate(dateStr) {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(dateStr).toLocaleDateString('en-US', options)
}

function selectDate(dateStr) {
  selectedDate.value = dateStr
}

function onCalendarSelectDate(dateStr) {
  selectedDate.value = dateStr
  activeTab.value = 'dashboard'
}

async function fetchHabits() {
  try {
    const res = await api.get(`/habits?date=${selectedDate.value}`)
    habits.value = res.data.data
  } catch (e) {
    console.error('Failed to fetch habits:', e)
  }
}

async function fetchCoach() {
  coachLoading.value = true
  try {
    const res = await api.get(`/ai/coach?date=${selectedDate.value}`)
    coachMessage.value = res.data.message
  } catch (e) { console.error(e) }
  finally { coachLoading.value = false }
}

async function fetchInsight() {
  insightLoading.value = true
  try {
    const res = await api.get(`/ai/weekly-insight?date=${selectedDate.value}`)
    weeklyInsight.value = res.data.insight
  } catch (e) { console.error(e) }
  finally { insightLoading.value = false }
}

async function fetchSuggestions() {
  suggestLoading.value = true
  try {
    const res = await api.post(`/ai/suggest?date=${selectedDate.value}`)
    suggestions.value = res.data.suggestions
  } catch (e) { console.error(e) }
  finally { suggestLoading.value = false }
}

async function toggleHabit(id) {
  try {
    await api.post(`/habits/${id}/toggle?date=${selectedDate.value}`)
    await fetchHabits()
    fetchCoach()
  } catch (e) {
    console.error('Failed to toggle habit:', e)
  }
}

const habitToDelete = ref(null)
const deletingHabit = ref(false)

function deleteHabit(id) {
  const habit = habits.value.find(h => h.id === id)
  if (habit) {
    habitToDelete.value = habit
  }
}

function cancelDelete() {
  habitToDelete.value = null
}

async function confirmDelete() {
  if (!habitToDelete.value) return
  deletingHabit.value = true
  try {
    await api.delete(`/habits/${habitToDelete.value.id}`)
    await fetchHabits()
    await fetchSuggestions()
  } catch (e) {
    console.error('Failed to delete habit:', e)
  } finally {
    deletingHabit.value = false
    habitToDelete.value = null
  }
}

async function onHabitSubmit(payload) {
  habitAdding.value = true
  try {
    let name, difficulty, level, schedule, reminder_time, notes
    if (typeof payload === 'string') {
      name = payload
      level = 'Mandatory'
      schedule = { rule: 'Daily', days: [] }
    } else {
      name = payload.name
      difficulty = payload.difficulty
      level = payload.level
      schedule = payload.schedule
      reminder_time = payload.reminder_time
      notes = payload.notes
    }

    if (!difficulty) {
      try {
        const ratingRes = await api.post(`/ai/rate-difficulty`, { name })
        difficulty = ratingRes.data.difficulty || 'Medium'
      } catch (err) {
        difficulty = 'Medium'
      }
    }

    await api.post(`/habits`, {
      name,
      difficulty,
      level,
      schedule,
      reminder_time,
      notes
    })
    await fetchHabits()
    fetchCoach()
    fetchSuggestions()
  } catch (e) {
    console.error('Failed to add habit:', e)
  } finally {
    habitAdding.value = false
  }
}

async function addSuggestion(name) {
  try {
    const ratingRes = await api.post(`/ai/rate-difficulty`, { name })
    const difficulty = ratingRes.data.difficulty || 'Medium'
    await api.post(`/habits`, {
      name,
      difficulty,
      level: 'Mandatory',
      schedule: { rule: 'Daily', days: [] }
    })
    await fetchHabits()
    await fetchSuggestions()
    fetchCoach()
  } catch (e) {
    console.error('Failed to add suggestion:', e)
  }
}

// Notification chime utilizing AudioContext
function playNotificationChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    
    osc.type = 'sine'
    osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
    osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.1) // A5
    
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.4)
  } catch (e) {
    console.error('Failed to play chime:', e)
  }
}

async function requestNotificationPermission() {
  if (typeof Notification === 'undefined') return
  const permission = await Notification.requestPermission()
  notificationsPermission.value = permission
}

function checkReminders() {
  if (selectedDate.value !== todayStr) return
  
  const now = new Date()
  const currentHours = String(now.getHours()).padStart(2, '0')
  const currentMinutes = String(now.getMinutes()).padStart(2, '0')
  const currentTimeStr = `${currentHours}:${currentMinutes}`
  
  habits.value.forEach((habit) => {
    if (
      habit.scheduled_today &&
      !habit.completed_today &&
      habit.reminder_time &&
      habit.reminder_time.startsWith(currentTimeStr)
    ) {
      const alertKey = `${habit.id}-${currentTimeStr}`
      if (notifiedAlerts.has(alertKey)) return
      notifiedAlerts.add(alertKey)
      
      playNotificationChime()
      
      if (notificationsPermission.value === 'granted') {
        new Notification('HabitMind Reminder', {
          body: `Time to orbit your habit: "${habit.name}" (${habit.level})!`,
          icon: '/favicon.ico'
        })
      }
    }
  })
}

// Watch selectedDate to fetch state correctly
watch(selectedDate, async () => {
  if (token.value) {
    await fetchHabits()
    fetchCoach()
    fetchInsight()
  }
})

// Listen for auth state changes (token refresh, sign out, etc.)
let authListener = null

onMounted(async () => {
  // Check for Supabase OAuth session (Google redirect callback)
  // PKCE flow uses ?code= query param, implicit flow uses #access_token= hash
  if (!token.value) {
    const urlParams = new URLSearchParams(window.location.search)
    const hasAuthCode = urlParams.has('code')
    const hasHashToken = window.location.hash && window.location.hash.includes('access_token')

    if (hasAuthCode || hasHashToken) {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (data.session && !error) {
          handleAuthSuccess({
            user: { id: data.session.user.id, email: data.session.user.email },
            token: data.session.access_token
          })
          window.history.replaceState(null, '', window.location.pathname)
          return
        }
      } catch (err) {
        console.error('Session detection error:', err)
      }
    }
  }

  if (token.value) {
    await fetchHabits()
    fetchCoach()
    fetchInsight()
    fetchSuggestions()
    
    reminderInterval = setInterval(checkReminders, 30000)
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      handleLogout()
    } else if (event === 'TOKEN_REFRESHED' && session) {
      token.value = session.access_token
      localStorage.setItem('hm_token', session.access_token)
    }
  })
  authListener = subscription
})

onUnmounted(() => {
  if (reminderInterval) {
    clearInterval(reminderInterval)
    reminderInterval = null
  }
  if (authListener) {
    authListener.unsubscribe()
  }
})
</script>

<style scoped>
.page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  gap: 2rem;
}

.header {
  border-radius: 16px;
  padding: 1.25rem 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 14px;
}

.logo-mark {
  background: linear-gradient(135deg, var(--primary) 0%, #8b5cf6 100%);
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.logo-info {
  display: flex;
  flex-direction: column;
}

.logo-text {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: var(--text-primary);
}

.tagline {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 400;
}

.header-stats-wrapper {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.header-stats {
  display: flex;
  gap: 1rem;
}

.user-profile-header {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  padding: 6px 12px;
  border-radius: 10px;
}

.user-email {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-logout {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  padding: 5px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-logout:hover {
  background: rgba(239, 68, 68, 0.18);
  border-color: rgba(239, 68, 68, 0.35);
  transform: translateY(-1px);
}

.btn-logout:active {
  transform: translateY(0);
}

.stat-pill {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 6px 12px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.stat-label {
  font-size: 10px;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-value.success {
  color: var(--success);
}

.main {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  flex: 1;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 2rem;
  align-items: start;
}

.dashboard-col {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.analytics-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

.section {
  padding: 1.75rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.badge {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 500;
  padding: 2px 10px;
  border-radius: 20px;
}

.habit-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
  border: 1px dashed var(--border-color);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.01);
  margin-top: 1rem;
}

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.empty-desc {
  font-size: 13px;
  color: var(--text-secondary);
  max-width: 320px;
  margin: 0 auto;
}

.footer {
  margin-top: auto;
  padding: 2rem 0 1rem;
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
  border-top: 1px solid var(--border-color);
}

/* Micro-animations */
.fade-in {
  animation: fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 968px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: center;
  }
  
  .tabs-nav {
    width: 100%;
    justify-content: center;
    order: 3;
  }
}

@media (max-width: 576px) {
  .header-stats {
    width: 100%;
    justify-content: flex-start;
  }
  .stat-pill {
    flex: 1;
    align-items: flex-start;
  }
}

/* Modal Scoped Styles */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: modalFadeIn 0.2s ease-out;
}

.modal-card {
  width: 90%;
  max-width: 440px;
  padding: 1.5rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  animation: modalScaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 0.75rem;
}

.warning-icon {
  font-size: 20px;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.modal-body {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 1.5rem;
  text-align: left;
}

.modal-body strong {
  color: var(--text-primary);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  padding: 10px 16px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--border-hover);
}

.btn-confirm-delete {
  background: var(--danger);
  border: none;
  color: #fff;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px var(--danger-glow);
}

.btn-confirm-delete:hover:not(:disabled) {
  background: #dc2626;
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
}

.btn-confirm-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes modalFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modalScaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* Time Travel Banner Styles */
.time-travel-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.25);
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.1);
  margin-bottom: 0.5rem;
}

.banner-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.banner-icon {
  font-size: 1.25rem;
}

.banner-text {
  font-size: 13.5px;
  color: var(--text-primary);
}

.banner-text strong {
  color: var(--primary);
}

.btn-reset-date {
  background: var(--primary);
  border: none;
  color: #fff;
  font-family: inherit;
  font-size: 11px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 4px 10px var(--primary-glow);
  transition: all 0.2s ease;
}

.btn-reset-date:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
}
</style>
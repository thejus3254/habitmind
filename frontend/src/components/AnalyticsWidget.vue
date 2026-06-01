<template>
  <div class="analytics-widgets">
    <!-- Top Stats Row -->
    <div class="stats-grid">
      <!-- Overall Score Card -->
      <div class="stat-card glass-panel">
        <div class="stat-header">
          <span class="stat-icon circle-icon">📈</span>
          <span class="stat-title">Overall Score</span>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ overallCompletionRate }}%</span>
          <span class="stat-sub">Average completion score</span>
        </div>
        <div class="progress-track">
          <div class="progress-bar" :style="{ width: `${overallCompletionRate}%` }"></div>
        </div>
      </div>

      <!-- Streak Leader Card -->
      <div class="stat-card glass-panel">
        <div class="stat-header">
          <span class="stat-icon flame-icon">🔥</span>
          <span class="stat-title">Streak Leader</span>
        </div>
        <div class="stat-content" v-if="streakLeader">
          <span class="stat-value">{{ streakLeader.streak }}d</span>
          <span class="stat-sub">Active on "{{ streakLeader.name }}"</span>
        </div>
        <div class="stat-content" v-else>
          <span class="stat-value">—</span>
          <span class="stat-sub">No active streaks yet</span>
        </div>
      </div>

      <!-- Total Completions Card -->
      <div class="stat-card glass-panel">
        <div class="stat-header">
          <span class="stat-icon check-icon">✅</span>
          <span class="stat-title">Log Volume</span>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ totalCompletions }}</span>
          <span class="stat-sub">Total checked actions (28d)</span>
        </div>
      </div>
    </div>

    <!-- Habit breakdown list -->
    <div class="breakdown-card glass-panel" v-if="habits.length">
      <h3 class="breakdown-title">Habit Efficiency Breakdown</h3>
      <div class="breakdown-list">
        <div v-for="habit in habits" :key="habit.id" class="breakdown-row">
          <div class="row-info">
            <span class="habit-name">{{ habit.name }}</span>
            <span class="habit-pct">{{ completionRates[habit.id] || 0 }}%</span>
          </div>
          <div class="row-track">
            <div
              class="row-bar"
              :style="{ width: `${completionRates[habit.id] || 0}%`, background: getHabitColor(habit.id) }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({ habits: Array })
const completionRates = ref({})
const totalCompletions = ref(0)

const colors = [
  '#6366f1', '#10b981', '#f59e0b', '#ec4899',
  '#8b5cf6', '#06b6d4', '#f97316', '#ef4444'
]

function calculateStats() {
  if (!props.habits || props.habits.length === 0) {
    completionRates.value = {}
    totalCompletions.value = 0
    return
  }

  let total = 0
  const rates = {}
  props.habits.forEach((habit) => {
    const count = (habit.history || []).length
    total += count
    rates[habit.id] = Math.round((count / 28) * 100)
  })
  totalCompletions.value = total
  completionRates.value = rates
}

watch(() => props.habits, calculateStats, { deep: true, immediate: true })

const streakLeader = computed(() => {
  if (!props.habits.length) return null
  let best = props.habits[0]
  props.habits.forEach((h) => {
    if (h.streak > best.streak) best = h
  })
  return best.streak > 0 ? best : null
})

const overallCompletionRate = computed(() => {
  if (!props.habits.length) return 0
  let sum = 0
  props.habits.forEach((h) => {
    sum += completionRates.value[h.id] || 0
  })
  return Math.round(sum / props.habits.length)
})

function getHabitColor(id) {
  const index = props.habits.findIndex((h) => h.id === id)
  return colors[index % colors.length]
}
</script>

<style scoped>
.analytics-widgets {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.stat-card {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-icon {
  font-size: 14px;
}

.stat-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.5px;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-sub {
  font-size: 11px;
  color: var(--text-secondary);
}

.progress-track {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
  margin-top: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--primary);
  box-shadow: 0 0 8px var(--primary-glow);
  border-radius: 2px;
  transition: width 0.4s ease;
}

.breakdown-card {
  padding: 1.5rem;
}

.breakdown-title {
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-secondary);
  letter-spacing: 0.5px;
  margin-bottom: 1.25rem;
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.breakdown-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.row-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.habit-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.habit-pct {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.row-track {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 3px;
  overflow: hidden;
}

.row-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>
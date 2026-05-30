<template>
  <div class="reminders-card glass-panel">
    <div class="card-header">
      <div class="title-area">
        <span class="bell-icon">🔔</span>
        <h3 class="card-title">Daily Orbit Alerts</h3>
      </div>
      <!-- Notification Enable Button -->
      <button 
        v-if="permission !== 'granted'" 
        class="btn-enable-alerts"
        @click="$emit('request-permission')"
        title="Enable desktop notifications"
      >
        Enable Alerts
      </button>
      <span v-else class="alerts-active-badge" title="Desktop notifications enabled">
        Active
      </span>
    </div>

    <!-- Active Reminders List -->
    <div class="reminders-timeline" v-if="todayReminders.length">
      <div 
        class="reminder-item" 
        v-for="rem in todayReminders" 
        :key="rem.id"
        :class="{ completed: rem.completed_today, missed: isMissed(rem.reminder_time) && !rem.completed_today }"
      >
        <div class="reminder-time-badge">
          {{ formatTime(rem.reminder_time) }}
        </div>
        <div class="reminder-details">
          <p class="reminder-name">{{ rem.name }}</p>
          <span class="reminder-meta">{{ rem.level }} · {{ rem.category }}</span>
        </div>
        <div class="reminder-status">
          <span v-if="rem.completed_today" class="status-icon success" title="Completed today">✓</span>
          <span v-else-if="isMissed(rem.reminder_time)" class="status-icon warning" title="Missed scheduled time">⚠️</span>
          <span v-else class="status-icon info" title="Scheduled upcoming">⏰</span>
        </div>
      </div>
    </div>
    <div class="placeholder-container" v-else>
      <p class="placeholder-text">No reminders scheduled for today's active orbit.</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  habits: Array,
  permission: String
})

defineEmits(['request-permission'])

const todayReminders = computed(() => {
  if (!props.habits || !props.habits.length) return []
  // Filter habits scheduled for today that have a reminder time set
  return props.habits
    .filter(h => h.scheduled_today && h.reminder_time)
    .sort((a, b) => a.reminder_time.localeCompare(b.reminder_time))
})

function formatTime(timeStr) {
  if (!timeStr) return ''
  const [hours, minutes] = timeStr.split(':')
  const h = parseInt(hours, 10)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const displayHour = h % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

function isMissed(timeStr) {
  if (!timeStr) return false
  const now = new Date()
  const [hours, minutes] = timeStr.split(':')
  const remTime = new Date()
  remTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0)
  return now > remTime
}
</script>

<style scoped>
.reminders-card {
  padding: 1.5rem;
  border-left: 4px solid var(--warning);
}

.title-area {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bell-icon {
  font-size: 15px;
}

.btn-enable-alerts {
  background: var(--warning-glow);
  border: 1px solid var(--warning);
  color: var(--warning);
  font-family: inherit;
  font-size: 10px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-enable-alerts:hover {
  background: var(--warning);
  color: #fff;
  box-shadow: 0 0 8px var(--warning-glow);
}

.alerts-active-badge {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--success);
  background: var(--success-glow);
  padding: 2px 6px;
  border-radius: 4px;
}

.reminders-timeline {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 6px;
}

.reminder-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.015);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  transition: all 0.25s ease;
}

.reminder-item:hover {
  background: rgba(255, 255, 255, 0.03);
  border-color: var(--border-hover);
}

.reminder-time-badge {
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 4px 8px;
  white-space: nowrap;
  letter-spacing: 0.5px;
}

.reminder-item.completed {
  opacity: 0.6;
}

.reminder-item.completed .reminder-time-badge {
  background: var(--success-glow);
  border-color: rgba(16, 185, 129, 0.2);
  color: var(--success);
}

.reminder-item.missed:not(.completed) .reminder-time-badge {
  background: var(--danger-glow);
  border-color: rgba(239, 68, 68, 0.2);
  color: var(--danger);
}

.reminder-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.reminder-name {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.reminder-item.completed .reminder-name {
  text-decoration: line-through;
  color: var(--text-muted);
}

.reminder-meta {
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.reminder-status {
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-icon {
  font-size: 14px;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.status-icon.success {
  background: var(--success-glow);
  color: var(--success);
  font-weight: bold;
}

.status-icon.warning {
  background: var(--danger-glow);
  color: var(--danger);
  font-size: 11px;
}

.status-icon.info {
  background: rgba(255, 255, 255, 0.03);
  color: var(--text-muted);
}

.placeholder-container {
  min-height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-text {
  color: var(--text-muted);
  font-size: 13px;
  font-style: italic;
  text-align: center;
}
</style>

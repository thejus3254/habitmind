<template>
  <div class="habit-card glass-panel" :style="{ borderLeftColor: color }" :class="{ completed: habit.completed_today }">
    <div class="card-main">
      <div class="left-section">
        <!-- Circular custom checkbox -->
        <button
          class="checkbox"
          @click="$emit('toggle', habit.id)"
          :class="{ checked: habit.completed_today }"
          :style="habit.completed_today ? { background: color, borderColor: color, boxShadow: `0 0 12px ${color}55` } : {}"
        >
          <svg v-if="habit.completed_today" class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>

        <div class="info-area">
          <p class="habit-name" :class="{ strikethrough: habit.completed_today }">{{ habit.name }}</p>
          <div class="meta-row">
            <span class="difficulty-badge" :class="difficultyClass">{{ habit.difficulty }}</span>
            <span class="streak-badge" v-if="habit.streak > 0">
              <span class="flame-icon">🔥</span>
              <span class="streak-count">{{ habit.streak }}d streak</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Delete Button (fades in on card hover) -->
      <button class="btn-delete" @click="$emit('delete', habit.id)" title="Delete Habit">
        <svg class="delete-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    <!-- 28-Day Heatmap contribution grid -->
    <div class="heatmap-section">
      <div class="heatmap-header">
        <span class="heatmap-label">Last 4 Weeks</span>
        <span class="heatmap-percentage" v-if="history.length">{{ completionRate }}% completion</span>
      </div>
      <DotGrid v-if="history.length >= 0" :completedDates="history" :color="color" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import DotGrid from './DotGrid.vue'

const props = defineProps({ habit: Object, color: String })
defineEmits(['toggle', 'delete'])

const history = computed(() => props.habit.history || [])

const difficultyClass = computed(() => {
  return props.habit.difficulty?.toLowerCase() || 'medium'
})

const completionRate = computed(() => {
  if (!history.value.length) return 0
  return Math.round((history.value.length / 28) * 100)
})
</script>

<style scoped>
.habit-card {
  padding: 1rem 1.25rem;
  border-left: 4px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--bg-secondary);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.habit-card:hover {
  transform: translateY(-2px);
  border-color: var(--border-hover);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
}

.card-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* Custom Checkbox */
.checkbox {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1.5px solid var(--text-muted);
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.checkbox:hover {
  border-color: var(--text-secondary);
  transform: scale(1.05);
}

.checkbox.checked {
  color: #ffffff;
}

.check-icon {
  width: 14px;
  height: 14px;
  animation: checkPop 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

@keyframes checkPop {
  from { transform: scale(0.6); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* Info Area */
.info-area {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.habit-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.habit-name.strikethrough {
  text-decoration: line-through;
  color: var(--text-muted);
}

/* Badges & Meta */
.meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.difficulty-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.difficulty-badge.easy {
  background: var(--success-glow);
  color: var(--success);
}

.difficulty-badge.medium {
  background: var(--warning-glow);
  color: var(--warning);
}

.difficulty-badge.hard {
  background: var(--danger-glow);
  color: var(--danger);
}

.streak-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.15);
  border-radius: 6px;
  padding: 1px 6px;
}

.flame-icon {
  font-size: 11px;
}

.streak-count {
  font-size: 11px;
  font-weight: 500;
  color: var(--warning);
}

/* Delete Button */
.btn-delete {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  opacity: 0;
}

.habit-card:hover .btn-delete {
  opacity: 1;
}

.btn-delete:hover {
  background: var(--danger-glow);
  color: var(--danger);
}

.delete-icon {
  width: 16px;
  height: 16px;
}

/* Heatmap Section */
.heatmap-section {
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  padding-top: 10px;
}

.heatmap-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.heatmap-label {
  font-size: 10px;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.5px;
}

.heatmap-percentage {
  font-size: 10px;
  color: var(--text-secondary);
}
</style>
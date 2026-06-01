<template>
  <div class="calendar-card glass-panel">
    <div class="card-header">
      <div class="title-area">
        <span class="cal-icon">📅</span>
        <h3 class="card-title">{{ currentMonthYear }} Orbit Log</h3>
      </div>
      <div class="legend">
        <span class="legend-text">Density:</span>
        <span class="legend-box level-0" title="0 completed"></span>
        <span class="legend-box level-1" title="1-2 completed"></span>
        <span class="legend-box level-2" title="3-4 completed"></span>
        <span class="legend-box level-3" title="5+ completed"></span>
      </div>
    </div>

    <div class="calendar-wrapper">
      <div class="weekdays-row">
        <span v-for="d in weekdays" :key="d" class="weekday-label">{{ d }}</span>
      </div>

      <div class="days-grid">
        <div
          v-for="(cell, i) in calendarDays"
          :key="i"
          class="day-cell"
          :class="[
            cell.isPadding ? 'padding' : '',
            cell.isToday ? 'today' : '',
            cell.date === selectedDate ? 'selected' : '',
            !cell.isPadding ? getDensityClass(cell.completions.length) : ''
          ]"
          :title="cell.isPadding ? '' : getTooltipText(cell.date, cell.completions)"
          @click="!cell.isPadding && $emit('select-date', cell.date)"
        >
          <span class="day-number" v-if="!cell.isPadding">{{ cell.dayNum }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  habits: Array,
  selectedDate: String
})

const emit = defineEmits(['select-date'])

const completionMap = ref({})
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const currentMonthYear = computed(() => {
  return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

function loadAllHistories() {
  if (!props.habits || props.habits.length === 0) {
    completionMap.value = {}
    return
  }

  const map = {}
  props.habits.forEach((habit) => {
    ;(habit.history || []).forEach((d) => {
      if (!map[d]) map[d] = []
      map[d].push(habit.name)
    })
  })
  completionMap.value = map
}

watch(() => props.habits, loadAllHistories, { deep: true, immediate: true })

const calendarDays = computed(() => {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()

  const firstDay = new Date(year, month, 1)
  const startDay = firstDay.getDay()
  const startOffset = startDay === 0 ? 6 : startDay - 1
  const totalDays = new Date(year, month + 1, 0).getDate()

  const cells = []

  for (let i = 0; i < startOffset; i++) {
    cells.push({ isPadding: true })
  }

  for (let i = 1; i <= totalDays; i++) {
    const d = new Date(year, month, i)
    const dateStr = d.toISOString().split('T')[0]
    const isToday = d.toDateString() === today.toDateString()

    cells.push({
      isPadding: false,
      dayNum: i,
      date: dateStr,
      isToday,
      completions: completionMap.value[dateStr] || []
    })
  }

  return cells
})

function getDensityClass(count) {
  if (count === 0) return 'density-0'
  if (count <= 2) return 'density-1'
  if (count <= 4) return 'density-2'
  return 'density-3'
}

function getTooltipText(dateStr, completions) {
  const options = { month: 'short', day: 'numeric', weekday: 'short' }
  const formattedDate = new Date(dateStr).toLocaleDateString('en-US', options)

  if (!completions.length) {
    return `${formattedDate}: No habits completed`
  }

  return `${formattedDate}: Completed (${completions.length})\n• ${completions.join('\n• ')}`
}
</script>

<style scoped>
.calendar-card {
  padding: 1.5rem;
}

.title-area {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cal-icon {
  font-size: 15px;
}

.legend {
  display: flex;
  align-items: center;
  gap: 4px;
}

.legend-text {
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-right: 4px;
}

.legend-box {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

.legend-box.level-0 { background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.02); }
.legend-box.level-1 { background: rgba(99, 102, 241, 0.2); }
.legend-box.level-2 { background: rgba(99, 102, 241, 0.5); }
.legend-box.level-3 { background: var(--primary); }

.calendar-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.weekdays-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
}

.weekday-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.5px;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.day-cell {
  aspect-ratio: 1;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
}

.day-cell.padding {
  background: transparent;
  border-color: transparent;
  cursor: default;
}

.day-number {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: color 0.2s;
}

.day-cell.density-0 { background: rgba(255, 255, 255, 0.03); }

.day-cell.density-1 {
  background: rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.1);
}
.day-cell.density-1 .day-number { color: rgba(255, 255, 255, 0.8); }

.day-cell.density-2 {
  background: rgba(99, 102, 241, 0.45);
  border-color: rgba(99, 102, 241, 0.25);
}
.day-cell.density-2 .day-number { color: #fff; font-weight: 600; }

.day-cell.density-3 {
  background: var(--primary);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 12px var(--primary-glow);
}
.day-cell.density-3 .day-number { color: #fff; font-weight: 700; }

.day-cell.today { border: 1.5px solid rgba(255, 255, 255, 0.6) !important; }

.day-cell:not(.padding):hover {
  transform: scale(1.1);
  z-index: 5;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

.day-cell.density-1:hover { box-shadow: 0 0 10px rgba(99, 102, 241, 0.25); }
.day-cell.density-2:hover { box-shadow: 0 0 14px rgba(99, 102, 241, 0.45); }
.day-cell.density-3:hover { box-shadow: 0 0 18px var(--primary); }

.day-cell.selected {
  outline: 2px solid var(--primary);
  outline-offset: 1px;
  box-shadow: 0 0 12px var(--primary-glow);
  z-index: 4;
}
</style>
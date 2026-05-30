<template>
  <div class="week-strip glass-panel">
    <div
      class="day-capsule"
      v-for="day in days"
      :key="day.date"
      :class="{ today: day.date === selectedDate, actualToday: day.isToday && day.date !== selectedDate, past: day.isPast && day.date !== selectedDate }"
      @click="$emit('select-date', day.date)"
    >
      <span class="day-name">{{ day.name }}</span>
      <span class="day-num">{{ day.num }}</span>
      <span class="today-indicator" v-if="day.isToday"></span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  selectedDate: String
})

const emit = defineEmits(['select-date'])

const days = computed(() => {
  const today = new Date()
  const startOfWeek = new Date(today)
  const day = today.getDay()
  const diff = day === 0 ? -6 : 1 - day
  startOfWeek.setDate(today.getDate() + diff)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    const isToday = d.toDateString() === today.toDateString()
    const isPast = d < today && !isToday
    return {
      name: d.toLocaleDateString('en', { weekday: 'short' }),
      num: d.getDate(),
      date: d.toISOString().split('T')[0],
      isToday,
      isPast
    }
  })
})
</script>

<style scoped>
.week-strip {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 1rem;
  width: 100%;
}

.day-capsule {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
  padding: 10px 6px;
  border-radius: 12px;
  border: 1px solid transparent;
  position: relative;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
}

.day-capsule:hover:not(.today) {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.05);
  transform: translateY(-1px);
}

.day-name {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.day-num {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-secondary);
}

/* Today Highlighter Capsule */
.day-capsule.today {
  background: rgba(99, 102, 241, 0.08);
  border-color: rgba(99, 102, 241, 0.25);
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.1);
  transform: translateY(-2px);
}

.day-capsule.today .day-name {
  color: var(--primary);
  font-weight: 600;
}

.day-capsule.today .day-num {
  color: #ffffff;
}

.today-indicator {
  position: absolute;
  bottom: 6px;
  width: 4px;
  height: 4px;
  background: var(--primary);
  border-radius: 50%;
  box-shadow: 0 0 8px var(--primary);
}

.day-capsule.past {
  opacity: 0.75;
}

.day-capsule.past .day-num {
  color: var(--text-muted);
}

@media (max-width: 480px) {
  .week-strip {
    padding: 0.75rem;
    gap: 4px;
  }
  .day-capsule {
    padding: 6px 4px;
  }
  .day-name {
    font-size: 9px;
  }
  .day-num {
    font-size: 14px;
  }
}
</style>
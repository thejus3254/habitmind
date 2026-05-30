<template>
  <div class="dot-grid">
    <div
      class="dot"
      v-for="(date, i) in last28Days"
      :key="i"
      :class="{ filled: completedDates.includes(date) }"
      :style="completedDates.includes(date) ? { background: color, color: color, boxShadow: `0 0 6px ${color}44` } : {}"
      :title="formatTooltip(date, completedDates.includes(date))"
    ></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  completedDates: Array,
  color: String
})

const last28Days = computed(() => {
  return Array.from({ length: 28 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (27 - i))
    return d.toISOString().split('T')[0]
  })
})

function formatTooltip(dateStr, isCompleted) {
  const options = { month: 'short', day: 'numeric', weekday: 'short' }
  const formattedDate = new Date(dateStr).toLocaleDateString('en-US', options)
  return `${formattedDate}: ${isCompleted ? 'Completed' : 'Not completed'}`
}
</script>

<style scoped>
.dot-grid {
  display: grid;
  grid-template-columns: repeat(14, 1fr);
  gap: 6px;
  margin-top: 6px;
  width: 100%;
}

.dot {
  aspect-ratio: 1;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.02);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
}

.dot:hover {
  transform: scale(1.3);
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.2);
  z-index: 10;
}

.dot.filled {
  border-color: transparent;
}

.dot.filled:hover {
  filter: brightness(1.2);
  box-shadow: 0 0 10px currentColor !important;
}
</style>
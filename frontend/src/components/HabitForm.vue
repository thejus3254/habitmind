<template>
  <div class="form-container">
    <div class="form-bar">
      <div class="input-wrapper">
        <input
          class="input"
          v-model="name"
          placeholder="Orbit a new habit..."
          @keyup.enter="submit"
          :disabled="adding"
        />
        <span class="input-glow"></span>
      </div>
      <button 
        type="button" 
        class="btn-customize" 
        :class="{ active: showCustomizer }"
        @click="showCustomizer = !showCustomizer"
        title="Customize Habit Orbit"
      >
        🔧 Customize
      </button>
      <button class="btn-submit" @click="submit" :disabled="!name.trim() || adding">
        <span v-if="adding" class="spinner"></span>
        <span v-else>🚀 Launch</span>
      </button>
    </div>

    <!-- Collapsible Advanced Drawer -->
    <transition name="slide-fade">
      <div class="customizer-drawer glass-panel" v-if="showCustomizer">
        <!-- Priority / Goal Level -->
        <div class="field">
          <label class="field-label">Goal Priority</label>
          <div class="pills">
            <button 
              type="button" 
              class="pill-btn" 
              :class="{ active: level === 'Mandatory', mandatory: level === 'Mandatory' }" 
              @click="level = 'Mandatory'"
            >
              Mandatory
            </button>
            <button 
              type="button" 
              class="pill-btn" 
              :class="{ active: level === 'Flexible', flexible: level === 'Flexible' }" 
              @click="level = 'Flexible'"
            >
              Flexible
            </button>
            <button 
              type="button" 
              class="pill-btn" 
              :class="{ active: level === 'Optional', optional: level === 'Optional' }" 
              @click="level = 'Optional'"
            >
              Optional
            </button>
          </div>
        </div>

        <!-- Schedule Rule -->
        <div class="field">
          <label class="field-label">Frequency Orbit</label>
          <div class="pills scrollable">
            <button 
              type="button" 
              class="pill-btn" 
              :class="{ active: rule === 'Daily' }" 
              @click="rule = 'Daily'"
            >
              Daily
            </button>
            <button 
              type="button" 
              class="pill-btn" 
              :class="{ active: rule === 'Odd Days' }" 
              @click="rule = 'Odd Days'"
              title="Can skip on even days"
            >
              Odd Days (Skip Evens)
            </button>
            <button 
              type="button" 
              class="pill-btn" 
              :class="{ active: rule === 'Twice a Week' }" 
              @click="rule = 'Twice a Week'"
            >
              Twice a Week
            </button>
            <button 
              type="button" 
              class="pill-btn" 
              :class="{ active: rule === 'Weekdays' }" 
              @click="rule = 'Weekdays'"
            >
              Weekdays
            </button>
            <button 
              type="button" 
              class="pill-btn" 
              :class="{ active: rule === 'Once' }" 
              @click="rule = 'Once'"
            >
              One-off Day Task
            </button>
          </div>
        </div>

        <!-- One-off Date Selector -->
        <div class="field fade-in" v-if="rule === 'Once'">
          <label class="field-label">Scheduled Date</label>
          <input type="date" class="form-input" v-model="onceDate" />
        </div>

        <!-- Reminder & Category row -->
        <div class="field-row">
          <div class="field half">
            <label class="field-label">Daily Reminder</label>
            <input type="time" class="form-input" v-model="reminderTime" />
          </div>
          <div class="field half">
            <label class="field-label">Category</label>
            <select class="form-input" v-model="category">
              <option value="General">General</option>
              <option value="Health">Health</option>
              <option value="Mind">Mind</option>
              <option value="Work">Work</option>
            </select>
          </div>
        </div>

        <!-- Notes -->
        <div class="field">
          <label class="field-label">Notes & Instructions</label>
          <textarea 
            class="form-textarea" 
            placeholder="Write reminders, links, daily notes..." 
            v-model="notes"
          ></textarea>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({ 
  adding: Boolean,
  selectedDate: String
})

const emit = defineEmits(['submit'])

const name = ref('')
const showCustomizer = ref(false)

// Advanced fields
const level = ref('Mandatory')
const rule = ref('Daily')
const onceDate = ref('')
const reminderTime = ref('')
const category = ref('General')
const notes = ref('')

// Update onceDate if selectedDate prop updates
watch(() => props.selectedDate, (newVal) => {
  if (newVal) {
    onceDate.value = newVal
  }
}, { immediate: true })

function submit() {
  if (!name.value.trim()) return

  // Format schedule object
  const schedule = {
    rule: rule.value,
    days: []
  }
  if (rule.value === 'Once') {
    schedule.date = onceDate.value
  }

  const payload = {
    name: name.value.trim(),
    level: level.value,
    schedule,
    reminder_time: reminderTime.value ? `${reminderTime.value}:00` : null,
    category: category.value,
    notes: notes.value.trim() || null
  }

  emit('submit', payload)

  // Reset form
  name.value = ''
  showCustomizer.value = false
  notes.value = ''
  reminderTime.value = ''
  level.value = 'Mandatory'
  rule.value = 'Daily'
}
</script>

<style scoped>
.form-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 1.5rem;
}

.form-bar {
  display: flex;
  gap: 12px;
}

.input-wrapper {
  flex: 1;
  position: relative;
}

.input {
  width: 100%;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 12px 16px;
  font-family: inherit;
  font-size: 14px;
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.02);
  outline: none;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.input:focus {
  border-color: rgba(99, 102, 241, 0.5);
  background: rgba(255, 255, 255, 0.04);
  box-shadow: 0 0 16px var(--primary-glow);
}

.input::placeholder {
  color: var(--text-muted);
}

.btn-customize {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  border-radius: 12px;
  padding: 0 16px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-customize:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-primary);
}

.btn-customize.active {
  border-color: var(--primary);
  background: var(--primary-glow);
  color: #fff;
}

.btn-submit {
  background: var(--primary);
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px var(--primary-glow);
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-submit:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.3);
}

.btn-submit:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  box-shadow: none;
}

.spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 0.8s linear infinite;
}

/* Drawer styles */
.customizer-drawer {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 1.25rem;
  background: rgba(17, 22, 37, 0.9);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-row {
  display: flex;
  gap: 12px;
}

.field.half {
  flex: 1;
}

.field-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.5px;
}

.pills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pills.scrollable {
  flex-wrap: wrap;
}

.pill-btn {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  border-radius: 8px;
  padding: 6px 12px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pill-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-primary);
}

.pill-btn.active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
  box-shadow: 0 4px 10px var(--primary-glow);
}

/* Colored Levels */
.pill-btn.active.mandatory {
  background: var(--danger);
  border-color: var(--danger);
  box-shadow: 0 4px 10px var(--danger-glow);
}
.pill-btn.active.flexible {
  background: var(--warning);
  border-color: var(--warning);
  box-shadow: 0 4px 10px var(--warning-glow);
}
.pill-btn.active.optional {
  background: var(--success);
  border-color: var(--success);
  box-shadow: 0 4px 10px var(--success-glow);
}

.form-input, .form-textarea {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  border-radius: 8px;
  padding: 8px 12px;
  font-family: inherit;
  font-size: 13px;
  outline: none;
  transition: all 0.2s ease;
}

.form-input:focus, .form-textarea:focus {
  border-color: rgba(99, 102, 241, 0.4);
  background: rgba(0, 0, 0, 0.3);
}

.form-textarea {
  min-height: 60px;
  resize: vertical;
}

/* Select element resetting styling */
select.form-input {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 14px;
  padding-right: 32px;
}

/* Animations */
.slide-fade-enter-active, .slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-fade-enter-from, .slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
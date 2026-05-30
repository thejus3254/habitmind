<template>
  <div class="coach-card glass-panel">
    <div class="card-header">
      <div class="title-area">
        <span class="coach-badge">AI</span>
        <h3 class="card-title">Daily Coach</h3>
      </div>
      <button class="btn-refresh" @click="$emit('refresh')" :disabled="loading">
        <span v-if="loading" class="spinner"></span>
        <span v-else>Sync Coach</span>
      </button>
    </div>
    
    <div class="message-container">
      <transition name="fade" mode="out-in">
        <p class="message" v-if="message" :key="message">{{ message }}</p>
        <p class="message placeholder" v-else>Calling Coach to orbit...</p>
      </transition>
    </div>
  </div>
</template>

<script setup>
defineProps({ message: String, loading: Boolean })
defineEmits(['refresh'])
</script>

<style scoped>
.coach-card {
  padding: 1.5rem;
  border-left: 4px solid var(--primary);
  position: relative;
  overflow: hidden;
}

.title-area {
  display: flex;
  align-items: center;
  gap: 8px;
}

.coach-badge {
  background: linear-gradient(135deg, var(--primary) 0%, #8b5cf6 100%);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.5px;
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.4);
}

.message-container {
  min-height: 54px;
}

.message {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.6;
  font-weight: 400;
}

.placeholder {
  color: var(--text-muted);
  font-style: italic;
}

/* Spinner Animation */
.spinner {
  display: inline-block;
  width: 10px;
  height: 10px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 0.8s linear infinite;
  margin-right: 4px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
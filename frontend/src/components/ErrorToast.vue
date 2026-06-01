<template>
  <Transition name="toast-slide">
    <div v-if="visible" class="error-toast glass-panel" @click="dismiss">
      <span class="toast-icon">⚠️</span>
      <span class="toast-message">{{ message }}</span>
      <button class="toast-close" @click.stop="dismiss">✕</button>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const visible = ref(false)
const message = ref('')
let dismissTimer = null

function showError(event) {
  message.value = event.detail?.message || 'Something went wrong'
  visible.value = true
  
  // Clear any existing timer
  if (dismissTimer) clearTimeout(dismissTimer)
  
  // Auto-dismiss after 5 seconds
  dismissTimer = setTimeout(() => {
    visible.value = false
  }, 5000)
}

function dismiss() {
  visible.value = false
  if (dismissTimer) clearTimeout(dismissTimer)
}

onMounted(() => {
  window.addEventListener('vue-error', showError)
})

onUnmounted(() => {
  window.removeEventListener('vue-error', showError)
  if (dismissTimer) clearTimeout(dismissTimer)
})
</script>

<style scoped>
.error-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  border-radius: 14px;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  max-width: 420px;
  cursor: pointer;
}

.toast-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.toast-message {
  font-size: 13px;
  font-weight: 500;
  color: #fca5a5;
  flex: 1;
  line-height: 1.4;
}

.toast-close {
  background: none;
  border: none;
  color: #fca5a5;
  font-size: 14px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.2s;
  flex-shrink: 0;
}

.toast-close:hover {
  background: rgba(239, 68, 68, 0.2);
}

/* Transition animations */
.toast-slide-enter-active {
  animation: toastIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-slide-leave-active {
  animation: toastOut 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes toastIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes toastOut {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
}
</style>

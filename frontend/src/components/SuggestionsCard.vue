<template>
  <div class="suggest-card glass-panel">
    <div class="card-header">
      <div class="title-area">
        <span class="suggest-icon">✨</span>
        <h3 class="card-title">AI Suggestions</h3>
      </div>
      <button class="btn-refresh" @click="$emit('refresh')" :disabled="loading">
        <span v-if="loading" class="spinner"></span>
        <span v-else>Generate</span>
      </button>
    </div>

    <div class="suggestions-list" v-if="suggestions.length">
      <div 
        class="suggestion-item" 
        v-for="(s, i) in suggestions" 
        :key="i" 
        @click="$emit('add', s)"
      >
        <span class="suggestion-text">{{ s }}</span>
        <div class="add-btn">
          <svg class="plus-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </div>
      </div>
    </div>
    <div class="placeholder-container" v-else>
      <p class="placeholder-text">{{ loading ? 'Formulating habit orbits...' : 'No suggestions available.' }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({ suggestions: Array, loading: Boolean })
defineEmits(['refresh', 'add'])
</script>

<style scoped>
.suggest-card {
  padding: 1.5rem;
}

.title-area {
  display: flex;
  align-items: center;
  gap: 8px;
}

.suggest-icon {
  font-size: 15px;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.suggestion-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.015);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.suggestion-item:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: var(--border-hover);
  transform: translateX(4px);
}

.suggestion-text {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}

.add-btn {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.03);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.suggestion-item:hover .add-btn {
  background: var(--primary);
  color: #fff;
  box-shadow: 0 0 8px var(--primary-glow);
}

.plus-icon {
  width: 12px;
  height: 12px;
}

.placeholder-container {
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-text {
  color: var(--text-muted);
  font-size: 13px;
  font-style: italic;
}

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
</style>
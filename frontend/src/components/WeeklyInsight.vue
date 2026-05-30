<template>
  <div class="insight-card glass-panel">
    <div class="card-header">
      <div class="title-area">
        <span class="insight-icon">📊</span>
        <h3 class="card-title">Weekly Insight</h3>
      </div>
      <button class="btn-refresh" @click="$emit('refresh')" :disabled="loading">
        <span v-if="loading" class="spinner"></span>
        <span v-else>Recalculate</span>
      </button>
    </div>

    <div class="content-container" v-if="insight">
      <p class="overall-text">{{ insight.overall }}</p>
      
      <div class="metrics-grid">
        <!-- Strongest Habit Widget -->
        <div class="metric-widget positive">
          <div class="widget-header">
            <span class="widget-icon">⭐</span>
            <span class="widget-label">Strongest Habit</span>
          </div>
          <p class="widget-value">{{ insight.strongest }}</p>
        </div>

        <!-- Needs Attention Widget -->
        <div class="metric-widget caution">
          <div class="widget-header">
            <span class="widget-icon">⚠️</span>
            <span class="widget-label">Needs Attention</span>
          </div>
          <p class="widget-value">{{ insight.needs_attention }}</p>
        </div>

        <!-- Tip for Next Week Widget -->
        <div class="metric-widget action">
          <div class="widget-header">
            <span class="widget-icon">💡</span>
            <span class="widget-label">Tip for Next Week</span>
          </div>
          <p class="widget-value">{{ insight.tip }}</p>
        </div>
      </div>
    </div>
    <div class="placeholder-container" v-else>
      <p class="placeholder-text">{{ loading ? 'Analyzing completions data...' : 'Weekly insights are waiting to launch.' }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({ insight: Object, loading: Boolean })
defineEmits(['refresh'])
</script>

<style scoped>
.insight-card {
  padding: 1.5rem;
}

.title-area {
  display: flex;
  align-items: center;
  gap: 8px;
}

.insight-icon {
  font-size: 15px;
}

.content-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.overall-text {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.metrics-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.metric-widget {
  background: rgba(255, 255, 255, 0.015);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: all 0.2s ease;
}

.metric-widget:hover {
  background: rgba(255, 255, 255, 0.03);
  border-color: var(--border-hover);
}

.widget-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.widget-icon {
  font-size: 13px;
}

.widget-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.5px;
}

.widget-value {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}

/* Accent Borders */
.metric-widget.positive {
  border-left: 3px solid var(--success);
}
.metric-widget.positive .widget-label {
  color: var(--success);
}

.metric-widget.caution {
  border-left: 3px solid var(--warning);
}
.metric-widget.caution .widget-label {
  color: var(--warning);
}

.metric-widget.action {
  border-left: 3px solid var(--primary);
}
.metric-widget.action .widget-label {
  color: var(--primary);
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
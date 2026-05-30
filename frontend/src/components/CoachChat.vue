<template>
  <div class="chat-card glass-panel">
    <div class="chat-header">
      <div class="title-area">
        <span class="chat-status-dot animate-pulse"></span>
        <h3 class="card-title">AI Habit Coach Chat</h3>
      </div>
      <button class="btn-clear" @click="clearChat" title="Reset Conversation">
        Reset
      </button>
    </div>

    <!-- Messages Container -->
    <div class="chat-messages" ref="messagesContainer">
      <div 
        v-for="(msg, i) in messages" 
        :key="i" 
        class="message-bubble" 
        :class="msg.role"
      >
        <div class="avatar" v-if="msg.role === 'assistant'">🤖</div>
        <div class="bubble-content">
          <p>{{ msg.content }}</p>
        </div>
      </div>
      
      <!-- Typing Indicator -->
      <div v-if="sending" class="message-bubble assistant">
        <div class="avatar">🤖</div>
        <div class="bubble-content typing">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>
    </div>

    <!-- Input Footer -->
    <div class="chat-input-area">
      <input 
        v-model="inputMessage" 
        placeholder="Ask for advice on consistency, routine building..." 
        @keyup.enter="sendMessage"
        :disabled="sending"
        class="chat-input"
      />
      <button 
        class="btn-send" 
        @click="sendMessage" 
        :disabled="sending || !inputMessage.trim()"
      >
        Send
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import axios from 'axios'

const messages = ref([
  { 
    role: 'assistant', 
    content: 'Welcome astronaut! I am your AI Habit Coach. How can I help you construct routines, conquer procrastination, or stick to your habits today?' 
  }
])
const inputMessage = ref('')
const sending = ref(false)
const messagesContainer = ref(null)

async function scrollToBottom() {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

async function sendMessage() {
  if (!inputMessage.value.trim() || sending.value) return
  
  const userText = inputMessage.value.trim()
  messages.value.push({ role: 'user', content: userText })
  inputMessage.value = ''
  sending.value = true
  await scrollToBottom()

  try {
    const chatHistory = messages.value.map(m => ({ role: m.role, content: m.content }))
    const res = await axios.post('http://localhost:3001/api/ai/chat', { messages: chatHistory })
    messages.value.push({ role: 'assistant', content: res.data.reply })
  } catch (e) {
    console.error('Failed to get coach reply:', e)
    messages.value.push({ 
      role: 'assistant', 
      content: 'Sorry, I lost connection to orbit. Please verify your internet and try again.' 
    })
  } finally {
    sending.value = false
    await scrollToBottom()
  }
}

function clearChat() {
  messages.value = [
    { 
      role: 'assistant', 
      content: 'Welcome astronaut! I am your AI Habit Coach. How can I help you construct routines, conquer procrastination, or stick to your habits today?' 
    }
  ]
}

onMounted(() => {
  scrollToBottom()
})
</script>

<style scoped>
.chat-card {
  display: flex;
  flex-direction: column;
  height: 520px;
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.title-area {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-status-dot {
  width: 8px;
  height: 8px;
  background: var(--success);
  border-radius: 50%;
  box-shadow: 0 0 8px var(--success);
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .4; }
}

.btn-clear {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 11px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-clear:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: var(--border-hover);
  color: var(--text-primary);
}

/* Messages container */
.chat-messages {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: rgba(0, 0, 0, 0.1);
}

.message-bubble {
  display: flex;
  gap: 12px;
  max-width: 80%;
  align-items: flex-start;
}

.message-bubble.assistant {
  align-self: flex-start;
}

.message-bubble.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.bubble-content {
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 14px;
  line-height: 1.5;
}

.assistant .bubble-content {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  border-top-left-radius: 2px;
}

.user .bubble-content {
  background: var(--primary);
  color: #ffffff;
  border-top-right-radius: 2px;
  box-shadow: 0 4px 12px var(--primary-glow);
}

/* Typing indicator */
.typing {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 18px;
}

.typing .dot {
  width: 6px;
  height: 6px;
  background: var(--text-secondary);
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.typing .dot:nth-child(1) { animation-delay: -0.32s; }
.typing .dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1.0); }
}

/* Input Area */
.chat-input-area {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color);
  background: rgba(255, 255, 255, 0.01);
  display: flex;
  gap: 12px;
}

.chat-input {
  flex: 1;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 12px 16px;
  font-family: inherit;
  font-size: 14px;
  color: var(--text-primary);
  outline: none;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.chat-input:focus {
  border-color: rgba(99, 102, 241, 0.5);
  background: rgba(255, 255, 255, 0.04);
  box-shadow: 0 0 16px var(--primary-glow);
}

.btn-send {
  background: var(--primary);
  border: none;
  border-radius: 12px;
  padding: 0 20px;
  color: #fff;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px var(--primary-glow);
  transition: all 0.2s;
}

.btn-send:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.3);
}

.btn-send:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  box-shadow: none;
}
</style>

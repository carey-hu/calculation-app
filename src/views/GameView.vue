<template>
  <div class="wrap game-root">
    <!-- 顶部栏 -->
    <div class="topbar safe-top">
      <button class="btn-back glass-btn" @click="$emit('back')">返回</button>
      <div class="top-stats">
        <div class="stat glass-pill">{{ progressText }}</div>
        <div class="stat glass-pill timer">⏱ {{ totalText }}</div>
      </div>
    </div>
    
    <!-- 题目区 -->
    <div class="game-main">
      <div class="card q-card glass-panel">
        <div :class="['q-text', isSmallFont ? 'q-text-small' : '']">{{ qText }}</div>
        <div class="q-note">{{ hintNote }}</div>
        <div class="ans-box glass-input">答案：{{ input || '—' }}</div>
        <div class="hint">{{ uiHint }}</div>
      </div>
    </div>
    
    <!-- 键盘 -->
    <NumKeypad 
      :left-text="leftText"
      @digit="$emit('digit', $event)"
      @clear="$emit('clear')"
      @backspace="$emit('backspace')"
      @left="$emit('left')"
      @confirm="$emit('confirm')"
    />
  </div>
</template>

<script setup>
import NumKeypad from '@/components/NumKeypad.vue'

defineProps({
  progressText: String,
  totalText: String,
  qText: String,
  hintNote: String,
  input: String,
  uiHint: String,
  isSmallFont: Boolean,
  leftText: String
})

defineEmits(['back', 'digit', 'clear', 'backspace', 'left', 'confirm'])
</script>

<style scoped>
.wrap {
  padding: 20px 16px 24px;
  box-sizing: border-box;
  position: relative;
  z-index: 1;
}

.game-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding-bottom: 0;
}

.topbar {
  padding-bottom: 12px;
  height: auto;
  box-sizing: content-box;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 5px;
}

.safe-top {
  padding-top: max(44px, env(safe-area-inset-top));
}

.btn-back {
  width: 80px;
  height: 44px;
  line-height: 44px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(0, 0, 0, 0.05);
  font-weight: 700;
  font-size: 16px;
  margin: 0;
  color: #1c1c1e;
  backdrop-filter: blur(10px);
}

.top-stats {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 16px;
  color: #333;
}

.game-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.card {
  padding: 18px 16px 20px;
}

.q-card {
  text-align: center;
  padding: 30px 20px;
}

.q-text {
  font-size: 64px;
  font-weight: 800;
  margin-top: 0;
  color: #1c1c1e;
  letter-spacing: -2px;
}

.q-text-small {
  font-size: 52px !important;
  letter-spacing: -1px !important;
  white-space: nowrap;
  margin-top: 10px;
  overflow: visible;
}

.q-note {
  margin-top: 8px;
  font-size: 16px;
  color: #8e8e93;
  font-weight: 500;
}

.ans-box {
  margin-top: 20px;
  padding: 15px;
  border-radius: 20px;
  font-size: 44px;
  font-weight: 800;
  min-height: 44px;
  color: #007aff;
}

.hint {
  margin-top: 15px;
  color: #8e8e93;
  font-size: 15px;
  font-weight: 600;
}
</style>

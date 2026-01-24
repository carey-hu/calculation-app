<template>
  <div class="wrap">
    <!-- 顶部栏 -->
    <div class="topbar">
      <button class="btn-back" @click="$emit('back')">返回</button>
      <div class="top-stats">
        <div class="stat-pill">{{ progressText }}</div>
        <div class="stat-pill timer">⏱ {{ totalText }}</div>
      </div>
    </div>
    
    <!-- 题目区 -->
    <div class="game-main">
      <div class="q-card">
        <div :class="['q-text', isSmallFont ? 'q-text-small' : '']">{{ qText }}</div>
        <div class="q-note">{{ hintNote }}</div>
        <div class="ans-box">答案：{{ input || '—' }}</div>
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
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 0 16px;
  position: relative;
  z-index: 1;
}

.topbar {
  padding-top: max(50px, env(safe-area-inset-top));
  padding-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-back {
  height: 44px;
  padding: 0 20px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  font-weight: 600;
  font-size: 15px;
  color: rgba(0, 0, 0, 0.75);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.04),
    inset 0 1px 1px rgba(255, 255, 255, 0.8);
  transition: all 0.15s ease;
}

.btn-back:active {
  transform: scale(0.96);
  background: rgba(255, 255, 255, 0.7);
}

.top-stats {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}

.stat-pill {
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 8px 16px;
  border-radius: 50px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  font-weight: 600;
  font-size: 15px;
  color: rgba(0, 0, 0, 0.7);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.game-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 10px 0;
}

/* 液态玻璃题目卡片 */
.q-card {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(60px) saturate(200%);
  -webkit-backdrop-filter: blur(60px) saturate(200%);
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.08),
    inset 0 1px 1px rgba(255, 255, 255, 0.9),
    inset 0 -1px 1px rgba(0, 0, 0, 0.03);
  padding: 32px 24px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.q-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.1) 50%, transparent 100%);
  pointer-events: none;
  border-radius: 28px 28px 0 0;
}

.q-text {
  font-size: 58px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.85);
  letter-spacing: -2px;
  position: relative;
  z-index: 1;
}

.q-text-small {
  font-size: 46px;
  letter-spacing: -1px;
}

.q-note {
  margin-top: 10px;
  font-size: 15px;
  color: rgba(0, 0, 0, 0.4);
  font-weight: 500;
  position: relative;
  z-index: 1;
}

.ans-box {
  margin-top: 24px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.55);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
  font-size: 40px;
  font-weight: 700;
  color: rgba(0, 122, 255, 0.9);
  position: relative;
  z-index: 1;
}

.hint {
  margin-top: 16px;
  color: rgba(0, 0, 0, 0.4);
  font-size: 14px;
  font-weight: 500;
  position: relative;
  z-index: 1;
}
</style>

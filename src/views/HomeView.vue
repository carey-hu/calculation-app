<template>
  <div class="wrap">
    <div class="header-area">
      <div class="title">计算助手</div>
      <div class="subtitle">专项练习：进位加、退位减、大九九除法</div>
    </div>

    <div class="card glass-panel">
      <!-- 模式选择器 -->
      <ModeSelector 
        :mode-groups="modeGroups"
        :current-mode="currentModeKey"
        @select="$emit('setMode', $event)"
        @select-divisor="$emit('toSelectDivisor')"
      />
      
      <!-- 3D 空间思维入口 -->
      <div class="row-label">空间思维专项</div>
      <div class="cubic-entry" @click="$emit('startCubic')">
        <span class="cubic-icon">🧊</span>
        <span class="cubic-title">立体拼合 / 积木训练</span>
      </div>

      <!-- 操作按钮 -->
      <button class="btn-primary" @click="$emit('start')">
        开始练习
      </button>
      <button class="btn-secondary" @click="$emit('openHistory')">
        历史记录
      </button>
    </div>
  </div>
</template>

<script setup>
import ModeSelector from '@/components/ModeSelector.vue'

defineProps({
  modeGroups: {
    type: Object,
    required: true
  },
  currentModeKey: {
    type: String,
    default: 'train'
  }
})

defineEmits(['setMode', 'toSelectDivisor', 'startCubic', 'start', 'openHistory'])
</script>

<style scoped>
.wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px 16px 40px;
  padding-top: max(60px, env(safe-area-inset-top));
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  position: relative;
  z-index: 1;
}

.wrap::-webkit-scrollbar {
  display: none;
}

.header-area {
  margin-bottom: 24px;
  text-align: center;
}

.title {
  font-size: 34px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.85);
  letter-spacing: -1px;
}

.subtitle {
  font-size: 15px;
  color: rgba(0, 0, 0, 0.45);
  margin-top: 6px;
  font-weight: 500;
}

/* 液态玻璃卡片 */
.glass-panel {
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(60px) saturate(200%);
  -webkit-backdrop-filter: blur(60px) saturate(200%);
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.08),
    inset 0 1px 1px rgba(255, 255, 255, 0.9),
    inset 0 -1px 1px rgba(0, 0, 0, 0.03);
  position: relative;
  overflow: hidden;
}

.glass-panel::before {
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

.card {
  padding: 20px 18px 24px;
}

.row-label {
  font-size: 13px;
  font-weight: 700;
  color: rgba(0, 122, 255, 0.9);
  margin: 18px 0 10px 8px;
  letter-spacing: 0.3px;
  position: relative;
  z-index: 1;
}

/* 3D入口 */
.cubic-entry {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  margin-bottom: 20px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(191, 90, 242, 0.12) 0%, rgba(175, 82, 222, 0.18) 100%);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(191, 90, 242, 0.25);
  box-shadow: 
    0 4px 16px rgba(191, 90, 242, 0.12),
    inset 0 1px 1px rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  z-index: 1;
}

.cubic-entry:active {
  transform: scale(0.98);
  background: linear-gradient(135deg, rgba(191, 90, 242, 0.18) 0%, rgba(175, 82, 222, 0.25) 100%);
}

.cubic-icon {
  font-size: 22px;
}

.cubic-title {
  font-size: 16px;
  font-weight: 600;
  color: rgba(175, 82, 222, 0.95);
}

/* 主按钮 */
.btn-primary {
  width: 100%;
  height: 56px;
  margin-top: 6px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(52, 199, 89, 0.85) 0%, rgba(48, 180, 80, 0.9) 100%);
  color: rgba(255, 255, 255, 0.95);
  font-size: 19px;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 
    0 8px 24px rgba(52, 199, 89, 0.35),
    inset 0 1px 1px rgba(255, 255, 255, 0.5),
    inset 0 -1px 1px rgba(0, 0, 0, 0.1);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
  transition: all 0.2s ease;
  z-index: 1;
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 100%);
  pointer-events: none;
}

.btn-primary:active {
  transform: scale(0.98);
  box-shadow: 0 4px 12px rgba(52, 199, 89, 0.3);
}

/* 次按钮 */
.btn-secondary {
  width: 100%;
  height: 52px;
  margin-top: 12px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(191, 90, 242, 0.12) 0%, rgba(175, 82, 222, 0.18) 100%);
  backdrop-filter: blur(20px);
  color: rgba(175, 82, 222, 0.95);
  font-size: 18px;
  font-weight: 600;
  border: 1px solid rgba(191, 90, 242, 0.25);
  box-shadow: 
    0 4px 16px rgba(191, 90, 242, 0.12),
    inset 0 1px 1px rgba(255, 255, 255, 0.5);
  position: relative;
  overflow: hidden;
  transition: all 0.2s ease;
  z-index: 1;
}

.btn-secondary::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%);
  pointer-events: none;
}

.btn-secondary:active {
  transform: scale(0.98);
  background: linear-gradient(135deg, rgba(191, 90, 242, 0.18) 0%, rgba(175, 82, 222, 0.25) 100%);
}
</style>

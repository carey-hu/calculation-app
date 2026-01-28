<template>
  <div class="wrap home-wrap">
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
      <div class="mode-row">
        <div 
          class="mode-item cubic-entry" 
          @click="$emit('startCubic')"
        >
          <span class="mode-title cubic-title">🧊 立体拼合 / 积木训练</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <button class="btn-primary glass-primary main-action-btn home-start-btn" @click="$emit('start')">
        开始练习
      </button>
      <button class="btn-history glass-btn main-action-btn" @click="$emit('openHistory')">
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
  padding: 20px 16px 24px;
  box-sizing: border-box;
  position: relative;
  z-index: 1;
}

.home-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-top: max(60px, env(safe-area-inset-top));
  padding-bottom: 40px;
  scrollbar-width: none;
}

.home-wrap::-webkit-scrollbar {
  display: none;
}

.header-area {
  margin-bottom: 20px;
  text-align: center;
  flex-shrink: 0;
}

.title {
  font-size: 32px;
  font-weight: 800;
  color: #1c1c1e;
  letter-spacing: -1px;
}

.subtitle {
  font-size: 14px;
  color: #8e8e93;
  margin-top: 6px;
  font-weight: 500;
}

.card {
  padding: 18px 16px 20px;
}

.row-label {
  font-size: 13px;
  font-weight: 700;
  color: #007aff;
  margin: 16px 0 8px 6px;
  opacity: 0.9;
  letter-spacing: 0.5px;
}

.mode-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.mode-item {
  flex: 1 0 30%;
  padding: 14px 4px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(0, 0, 0, 0.05);
  text-align: center;
  box-sizing: border-box;
  transition: all 0.1s;
  cursor: pointer;
}

.mode-item:active {
  transform: scale(0.97);
}

.cubic-entry {
  flex: 1 0 100%;
  background: rgba(88, 86, 214, 0.1);
  border-color: rgba(88, 86, 214, 0.2);
}

.mode-title {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: #1c1c1e;
}

.cubic-title {
  color: #5856d6;
}

.main-action-btn {
  font-size: 20px !important;
  height: 54px !important;
  line-height: 54px !important;
}

.home-start-btn {
  margin-top: 14px;
}
</style>

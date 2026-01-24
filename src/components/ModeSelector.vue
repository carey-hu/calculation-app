<template>
  <div class="mode-selector">
    <template v-for="(group, groupKey) in modeGroups" :key="groupKey">
      <!-- 分组标签 -->
      <div class="row-label" v-if="group.label">{{ group.label }}</div>
      
      <!-- 自定义入口 -->
      <div v-if="group.hasCustomEntry" class="custom-entry">
        <button class="glass-btn" @click="$emit('selectDivisor')">
          进入除数选择模式
        </button>
      </div>
      
      <!-- 模式按钮 -->
      <div class="mode-row" v-else>
        <div 
          v-for="modeKey in group.modes" 
          :key="modeKey"
          :class="['mode-item', currentMode === modeKey ? 'active' : '']" 
          @click="$emit('select', modeKey)"
        >
          <span class="mode-title">{{ getModeConfig(modeKey).name }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { getModeConfig } from '@/config/gameModes'

defineProps({
  modeGroups: {
    type: Object,
    required: true
  },
  currentMode: {
    type: String,
    default: 'train'
  }
})

defineEmits(['select', 'selectDivisor'])
</script>

<style scoped>
.mode-selector {
  position: relative;
}

.row-label {
  font-size: 13px;
  font-weight: 700;
  color: rgba(0, 122, 255, 0.9);
  margin: 18px 0 10px 8px;
  letter-spacing: 0.3px;
}

.row-label:first-child {
  margin-top: 0;
}

.mode-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.mode-item {
  flex: 1 0 30%;
  padding: 14px 6px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.7);
  text-align: center;
  box-sizing: border-box;
  transition: all 0.2s ease;
  cursor: pointer;
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.mode-item:active {
  transform: scale(0.97);
}

.mode-item.active {
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.9) 0%, rgba(0, 100, 220, 0.95) 100%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 
    0 8px 24px rgba(0, 122, 255, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.mode-title {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.75);
}

.mode-item.active .mode-title {
  color: #fff;
}

.custom-entry {
  margin-bottom: 10px;
}

.glass-btn {
  width: 100%;
  height: 48px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.7);
  color: rgba(0, 122, 255, 0.9);
  font-size: 16px;
  font-weight: 600;
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transition: all 0.2s ease;
  cursor: pointer;
}

.glass-btn:active {
  transform: scale(0.98);
  background: rgba(255, 255, 255, 0.7);
}
</style>

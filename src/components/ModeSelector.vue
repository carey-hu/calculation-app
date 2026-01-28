<template>
  <div class="mode-selector">
    <template v-for="(group, groupKey) in modeGroups" :key="groupKey">
      <!-- 分组标签 -->
      <div class="row-label" v-if="group.label">{{ group.label }}</div>
      
      <!-- 自定义入口（商首位专项） -->
      <div v-if="group.hasCustomEntry" style="margin-bottom: 10px;">
        <button 
          class="btn-ghost glass-btn" 
          style="margin-top:0; height:45px; line-height:45px; font-size:16px;" 
          @click="$emit('selectDivisor')"
        >
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
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.02);
}

.mode-item:active {
  transform: scale(0.97);
}

.mode-item.active {
  background: #007aff;
  border-color: transparent;
  box-shadow: 0 8px 20px rgba(0, 122, 255, 0.3);
}

.mode-title {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: #1c1c1e;
}

.mode-item.active .mode-title {
  color: #fff;
}
</style>

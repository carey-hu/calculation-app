<template>
  <div class="wrap full-height" style="padding:0; overflow:hidden;">
    <div id="three-container" style="width:100%; height:100%; display:block; outline:none; touch-action: none;"></div>

    <div class="cubic-ui safe-top">
      <!-- 工具栏 -->
      <div class="glass-panel toolbar">
        <button class="btn-back glass-btn small-btn" @click="$emit('quit')">🔙</button>
        <div class="divider"></div>
        
        <!-- 颜色选择 -->
        <div style="display:flex; gap:8px;">
          <div 
            v-for="c in colors" 
            :key="c" 
            :style="{backgroundColor: c, border: c === '#ffffff' ? '1px solid #ccc' : 'none'}"
            :class="['color-dot', selectedColor === c && !isDeleteMode ? 'active' : '']"
            @click="$emit('switchColor', c)"
          ></div>
        </div>

        <div class="divider"></div>

        <!-- 功能按钮 -->
        <button :class="['btn-icon', isDeleteMode ? 'active' : '']" @click="$emit('toggleDelete')">🗑️</button>
        <button :class="['btn-icon', isSliceMode ? 'active' : '']" @click="$emit('toggleSlice')">🔪</button>
        <button class="btn-icon" @click="$emit('clear')">🔄</button>
      </div>

      <!-- 视图选择器 -->
      <div class="view-selector glass-panel">
        <button class="view-btn" @click="$emit('setView', 'front')">正</button>
        <button class="view-btn" @click="$emit('setView', 'back')">后</button>
        <button class="view-btn" @click="$emit('setView', 'left')">左</button>
        <button class="view-btn" @click="$emit('setView', 'right')">右</button>
        <button class="view-btn" @click="$emit('setView', 'top')">俯</button>
        <button class="view-btn active-view" @click="$emit('setView', 'iso')">轴</button>
      </div>

      <!-- 切面控制面板 -->
      <div v-if="isSliceMode" class="glass-panel slice-panel">
        <div class="slice-row">
          <span class="slice-label">位置</span>
          <input 
            type="range" 
            min="-10" 
            max="15" 
            step="0.1" 
            :value="sliceConfig.constant"
            @input="$emit('updateSlice', { ...sliceConfig, constant: parseFloat($event.target.value) })"
            class="slice-slider"
          >
        </div>
        <div class="slice-row">
          <span class="slice-label">X轴倾斜</span>
          <input 
            type="range" 
            min="-1" 
            max="1" 
            step="0.1" 
            :value="sliceConfig.x"
            @input="$emit('updateSlice', { ...sliceConfig, x: parseFloat($event.target.value) })"
            class="slice-slider"
          >
        </div>
        <div class="slice-row">
          <span class="slice-label">Y轴倾斜</span>
          <input 
            type="range" 
            min="-1" 
            max="1" 
            step="0.1" 
            :value="sliceConfig.y"
            @input="$emit('updateSlice', { ...sliceConfig, y: parseFloat($event.target.value) })"
            class="slice-slider"
          >
        </div>
        <div class="slice-row">
          <span class="slice-label">Z轴倾斜</span>
          <input 
            type="range" 
            min="-1" 
            max="1" 
            step="0.1" 
            :value="sliceConfig.z"
            @input="$emit('updateSlice', { ...sliceConfig, z: parseFloat($event.target.value) })"
            class="slice-slider"
          >
        </div>
        <div style="text-align:center; margin-top:5px;">
          <button class="btn-ghost small-btn" style="height:28px; line-height:28px; font-size:12px;" @click="$emit('resetSlice')">
            重置切面
          </button>
        </div>
      </div>

      <!-- 提示 -->
      <div class="tip-toast" v-if="!isSliceMode">点击地面放置，点击方块叠加</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  colors: Array,
  selectedColor: String,
  isDeleteMode: Boolean,
  isSliceMode: Boolean,
  sliceConfig: Object
})

defineEmits(['quit', 'switchColor', 'toggleDelete', 'toggleSlice', 'clear', 'setView', 'updateSlice', 'resetSlice'])
</script>

<style scoped>
.wrap {
  position: relative;
  z-index: 1;
}

.full-height {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.cubic-ui {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding-left: 10px;
  padding-right: 10px;
  padding-bottom: 10px;
  padding-top: max(60px, calc(env(safe-area-inset-top) + 10px));
  box-sizing: border-box;
  pointer-events: none;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cubic-ui > * {
  pointer-events: auto;
}

.toolbar {
  padding: 8px 12px;
  display: flex;
  gap: 8px;
  align-items: center;
  border-radius: 24px;
  max-width: 95%;
}

.small-btn {
  width: auto !important;
  height: 36px !important;
  line-height: 36px !important;
  padding: 0 16px !important;
  font-size: 14px !important;
}

.btn-icon {
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  transition: all 0.2s;
}

.btn-icon.active {
  background: #007aff;
  color: white;
  box-shadow: 0 4px 10px rgba(0, 122, 255, 0.3);
}

.divider {
  width: 1px;
  height: 20px;
  background: rgba(0, 0, 0, 0.1);
  margin: 0 5px;
}

.color-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.color-dot:active {
  transform: scale(0.9);
}

.color-dot.active {
  transform: scale(1.1);
  border-color: #fff;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1), inset 0 0 0 2px rgba(255, 255, 255, 0.8);
}

.view-selector {
  margin-top: 8px;
  padding: 6px;
  display: flex;
  gap: 6px;
  border-radius: 20px;
  flex-wrap: wrap;
  justify-content: center;
}

.view-btn {
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.view-btn:active,
.view-btn.active-view {
  background: #007aff;
  color: white;
}

.slice-panel {
  margin-top: 8px;
  padding: 12px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 90%;
  max-width: 300px;
}

.slice-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

.slice-label {
  width: 50px;
  text-align: right;
}

.slice-slider {
  flex: 1;
  -webkit-appearance: none;
  height: 4px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  outline: none;
}

.slice-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #007aff;
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.tip-toast {
  margin-top: 10px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  backdrop-filter: blur(4px);
}
</style>

<template>
  <div class="wrap">
    <div id="three-container"></div>

    <div class="cubic-ui">
      <!-- 工具栏 -->
      <div class="toolbar glass-panel">
        <button class="btn-back" @click="$emit('quit')">🔙</button>
        <div class="divider"></div>
        
        <!-- 颜色选择 -->
        <div class="color-row">
          <div 
            v-for="c in colors" 
            :key="c" 
            :style="{backgroundColor: c}"
            :class="['color-dot', selectedColor === c && !isDeleteMode ? 'active' : '', c === '#ffffff' ? 'white-dot' : '']"
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
        <button class="view-btn active" @click="$emit('setView', 'iso')">轴</button>
      </div>

      <!-- 切面控制面板 -->
      <div v-if="isSliceMode" class="slice-panel glass-panel">
        <div class="slice-row">
          <span class="slice-label">位置</span>
          <input type="range" min="-10" max="15" step="0.1" :value="sliceConfig.constant"
            @input="$emit('updateSlice', { ...sliceConfig, constant: parseFloat($event.target.value) })" class="slice-slider">
        </div>
        <div class="slice-row">
          <span class="slice-label">X轴倾斜</span>
          <input type="range" min="-1" max="1" step="0.1" :value="sliceConfig.x"
            @input="$emit('updateSlice', { ...sliceConfig, x: parseFloat($event.target.value) })" class="slice-slider">
        </div>
        <div class="slice-row">
          <span class="slice-label">Y轴倾斜</span>
          <input type="range" min="-1" max="1" step="0.1" :value="sliceConfig.y"
            @input="$emit('updateSlice', { ...sliceConfig, y: parseFloat($event.target.value) })" class="slice-slider">
        </div>
        <div class="slice-row">
          <span class="slice-label">Z轴倾斜</span>
          <input type="range" min="-1" max="1" step="0.1" :value="sliceConfig.z"
            @input="$emit('updateSlice', { ...sliceConfig, z: parseFloat($event.target.value) })" class="slice-slider">
        </div>
        <button class="btn-reset" @click="$emit('resetSlice')">重置切面</button>
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
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

#three-container {
  width: 100%;
  height: 100%;
  display: block;
  outline: none;
  touch-action: none;
}

.cubic-ui {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: 10px;
  padding-top: max(60px, calc(env(safe-area-inset-top) + 10px));
  box-sizing: border-box;
  pointer-events: none;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cubic-ui > * { pointer-events: auto; }

.glass-panel {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.8);
}

.toolbar {
  padding: 10px 14px;
  display: flex;
  gap: 10px;
  align-items: center;
  border-radius: 24px;
  max-width: 95%;
}

.btn-back {
  height: 38px;
  padding: 0 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.7);
  font-size: 16px;
  transition: all 0.15s;
}

.btn-back:active { transform: scale(0.95); }

.divider {
  width: 1px;
  height: 24px;
  background: rgba(0, 0, 0, 0.1);
}

.color-row { display: flex; gap: 8px; }

.color-dot {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  transition: all 0.2s;
  cursor: pointer;
}

.white-dot { border: 2px solid rgba(0, 0, 0, 0.1); }

.color-dot:active { transform: scale(0.9); }

.color-dot.active {
  transform: scale(1.15);
  border-color: #fff;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.4), 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-icon {
  height: 38px;
  padding: 0 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.6);
  font-size: 16px;
  transition: all 0.2s;
}

.btn-icon.active {
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.85) 0%, rgba(0, 100, 220, 0.9) 100%);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.35);
}

.btn-icon:active { transform: scale(0.95); }

.view-selector {
  margin-top: 10px;
  padding: 8px;
  display: flex;
  gap: 6px;
  border-radius: 20px;
}

.view-btn {
  padding: 8px 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.6);
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.6);
  transition: all 0.15s;
}

.view-btn:active, .view-btn.active {
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.85) 0%, rgba(0, 100, 220, 0.9) 100%);
  color: white;
  border-color: rgba(255, 255, 255, 0.3);
}

.slice-panel {
  margin-top: 10px;
  padding: 14px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 90%;
  max-width: 300px;
}

.slice-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.6);
}

.slice-label { width: 60px; text-align: right; }

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
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #007aff 0%, #0066dd 100%);
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.btn-reset {
  margin-top: 6px;
  height: 32px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.6);
  font-size: 13px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.5);
}

.tip-toast {
  margin-top: 12px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(20px);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}
</style>

<template>
  <div class="keypad card glass-panel">
    <!-- 功能行 -->
    <div class="fn-row">
      <button class="k-fn style-skip" @click="$emit('left')">{{ leftText }}</button>
      <button class="k-fn style-clear" @click="$emit('clear')">清空</button>
      <button class="k-fn style-del" @click="$emit('backspace')">退格</button>
    </div>
    
    <!-- 数字键盘 -->
    <div class="grid">
      <button 
        v-for="num in [1,2,3,4,5,6,7,8,9]" 
        :key="num" 
        class="k glass-key" 
        @click="$emit('digit', num)"
      >
        {{ num }}
      </button>
      <button class="k wide glass-key" @click="$emit('digit', 0)">0</button>
      <button class="k confirm wide2 glass-key-confirm" @click="$emit('confirm')">确认</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  leftText: {
    type: String,
    default: '跳过'
  }
})

defineEmits(['digit', 'clear', 'backspace', 'left', 'confirm'])
</script>

<style scoped>
.keypad {
  border-radius: 28px;
  overflow: hidden;
  clip-path: inset(0 0 0 0 round 28px);
  margin-bottom: calc(6px + env(safe-area-inset-bottom));
  padding: 12px;
}

.fn-row {
  display: flex;
  gap: 9px;
  margin-bottom: 9px;
}

.k-fn {
  flex: 1;
  height: 65px;
  line-height: 65px;
  border-radius: 14px;
  font-size: 20px;
  font-weight: 900;
  margin: 0;
  color: #fff;
  border: 1px solid rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(10px);
}

.style-skip {
  background: #34c759;
  border-color: #248a3d;
}

.style-clear {
  background: #ff9500;
  border-color: #e08600;
}

.style-del {
  background: #ff3b30;
  border-color: #d63329;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
}

.k {
  width: 100%;
  height: 70px;
  line-height: 70px;
  border-radius: 14px;
  font-size: 30px;
  font-weight: 900;
  margin: 0;
  color: #000;
}

.k.wide {
  grid-column: 1 / 2;
}

.k.wide2 {
  grid-column: 2 / 4;
}

.glass-key-confirm {
  background: #34c759;
  color: #fff;
  border: none;
  font-size: 28px;
  box-shadow: 0 4px 0 #248a3d;
  border-radius: 11px;
}

.glass-key-confirm:active {
  background: #28a745;
  box-shadow: none;
  transform: translateY(4px);
}
</style>

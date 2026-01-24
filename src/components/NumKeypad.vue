<template>
  <div class="keypad">
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
        class="k" 
        @click="$emit('digit', num)"
      >
        {{ num }}
      </button>
      <button class="k" @click="$emit('digit', 0)">0</button>
      <button class="k confirm wide2" @click="$emit('confirm')">确认</button>
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
  background: rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(60px) saturate(200%);
  -webkit-backdrop-filter: blur(60px) saturate(200%);
  border-radius: 32px;
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.08),
    inset 0 1px 2px rgba(255, 255, 255, 0.9),
    inset 0 -1px 1px rgba(0, 0, 0, 0.03);
  margin-bottom: calc(10px + env(safe-area-inset-bottom));
  position: relative;
  overflow: hidden;
}

/* 键盘顶部光泽 */
.keypad::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40%;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 0.1) 60%,
    transparent 100%
  );
  pointer-events: none;
  border-radius: 32px 32px 0 0;
}

.fn-row {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
  position: relative;
  z-index: 1;
}

.k-fn {
  flex: 1;
  height: 52px;
  line-height: 52px;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  position: relative;
  overflow: hidden;
  transition: all 0.2s ease;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

/* 功能键液态玻璃效果 */
.k-fn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%);
  border-radius: 16px 16px 0 0;
  pointer-events: none;
}

.k-fn:active {
  transform: scale(0.96);
  filter: brightness(0.95);
}

.style-skip {
  background: linear-gradient(135deg, rgba(52, 199, 89, 0.85) 0%, rgba(48, 180, 80, 0.9) 100%);
  box-shadow: 
    0 4px 16px rgba(52, 199, 89, 0.35),
    inset 0 1px 1px rgba(255, 255, 255, 0.4),
    inset 0 -1px 1px rgba(0, 0, 0, 0.1);
}

.style-clear {
  background: linear-gradient(135deg, rgba(255, 159, 10, 0.85) 0%, rgba(240, 145, 0, 0.9) 100%);
  box-shadow: 
    0 4px 16px rgba(255, 159, 10, 0.35),
    inset 0 1px 1px rgba(255, 255, 255, 0.4),
    inset 0 -1px 1px rgba(0, 0, 0, 0.1);
}

.style-del {
  background: linear-gradient(135deg, rgba(255, 69, 58, 0.85) 0%, rgba(240, 60, 50, 0.9) 100%);
  box-shadow: 
    0 4px 16px rgba(255, 69, 58, 0.35),
    inset 0 1px 1px rgba(255, 255, 255, 0.4),
    inset 0 -1px 1px rgba(0, 0, 0, 0.1);
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  position: relative;
  z-index: 1;
}

/* 数字键液态玻璃 */
.k {
  height: 72px;
  line-height: 72px;
  border-radius: 18px;
  font-size: 32px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.75);
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.04),
    inset 0 1px 2px rgba(255, 255, 255, 0.9),
    inset 0 -1px 1px rgba(0, 0, 0, 0.03);
  position: relative;
  overflow: hidden;
  transition: all 0.15s ease;
}

/* 按键顶部光泽 */
.k::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.6) 0%,
    rgba(255, 255, 255, 0.1) 100%
  );
  border-radius: 18px 18px 0 0;
  pointer-events: none;
}

.k:active {
  transform: scale(0.95);
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 
    0 2px 6px rgba(0, 0, 0, 0.03),
    inset 0 1px 2px rgba(255, 255, 255, 1);
}

.k.wide2 {
  grid-column: 2 / 4;
}

/* 确认键 */
.confirm {
  background: linear-gradient(135deg, rgba(52, 199, 89, 0.8) 0%, rgba(48, 180, 80, 0.85) 100%);
  color: rgba(255, 255, 255, 0.95);
  font-size: 26px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 
    0 6px 20px rgba(52, 199, 89, 0.35),
    inset 0 1px 2px rgba(255, 255, 255, 0.5),
    inset 0 -1px 1px rgba(0, 0, 0, 0.1);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.confirm::before {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.35) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
}

.confirm:active {
  background: linear-gradient(135deg, rgba(48, 180, 80, 0.9) 0%, rgba(40, 160, 70, 0.95) 100%);
  box-shadow: 
    0 3px 10px rgba(52, 199, 89, 0.3),
    inset 0 1px 2px rgba(255, 255, 255, 0.6);
}
</style>

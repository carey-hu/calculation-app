<template>
  <div class="wrap">
    <div class="header-area">
      <div class="title">选择除数</div>
      <div class="subtitle">点击下方数字开始练习商首位</div>
    </div>
    
    <div class="card glass-panel">
      <div class="grid">
        <button 
          v-for="item in divisorList" 
          :key="item" 
          class="num-btn"
          @click="$emit('select', item)"
        >
          {{ item }}
        </button>
      </div>
      
      <button class="btn-back-home" @click="$emit('back')">
        返回主页
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  divisorList: {
    type: Array,
    required: true
  }
})

defineEmits(['select', 'back'])
</script>

<style scoped>
.wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px 16px 40px;
  padding-top: max(60px, env(safe-area-inset-top));
  overflow-y: auto;
  position: relative;
  z-index: 1;
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

.glass-panel {
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(60px) saturate(200%);
  -webkit-backdrop-filter: blur(60px) saturate(200%);
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.08),
    inset 0 1px 1px rgba(255, 255, 255, 0.9);
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
  background: linear-gradient(180deg, rgba(255,255,255,0.5) 0%, transparent 100%);
  pointer-events: none;
}

.card {
  padding: 20px 18px 24px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  position: relative;
  z-index: 1;
}

.num-btn {
  height: 56px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  font-size: 22px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.75);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.04),
    inset 0 1px 1px rgba(255, 255, 255, 0.8);
  transition: all 0.15s ease;
  position: relative;
  overflow: hidden;
}

.num-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(180deg, rgba(255,255,255,0.5) 0%, transparent 100%);
  pointer-events: none;
}

.num-btn:active {
  transform: scale(0.95);
  background: rgba(255, 255, 255, 0.7);
}

.btn-back-home {
  width: 100%;
  height: 52px;
  margin-top: 20px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  font-size: 17px;
  font-weight: 600;
  color: rgba(0, 122, 255, 0.9);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.04),
    inset 0 1px 1px rgba(255, 255, 255, 0.8);
  transition: all 0.2s ease;
  position: relative;
  z-index: 1;
}

.btn-back-home:active {
  transform: scale(0.98);
  background: rgba(255, 255, 255, 0.7);
}
</style>

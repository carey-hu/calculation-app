<template>
  <div class="wrap">
    <div class="header-area">
      <div class="title">{{ title }}</div>
      <div class="subtitle">{{ meta }}</div>
    </div>
    
    <div class="card glass-panel">
      <div class="result-scroll">
        <!-- 训练模式 -->
        <template v-if="isTrainMode">
          <div v-for="(item, index) in trainLog" :key="index" class="row">
            <span class="row-left">{{ index + 1 }}. {{ item.q }}</span>
            <span class="row-right">
              <span :class="parseFloat(item.usedStr) > 2 ? 'time-slow' : ''">
                {{ item.usedStr }}
              </span> 
              / 错{{ item.wrong }}{{ item.skipped ? '(跳)' : '' }}
            </span>
          </div>
        </template>
        
        <!-- 其他模式 -->
        <template v-else>
          <div v-for="(item, index) in results" :key="index" class="row">
            <span class="row-left">{{ index + 1 }}. {{ item.q }} = {{ item.yourAns }}</span>
            <span class="row-right">
              <span class="time-text">{{ item.usedStr }}</span>
              <span class="result-icon">{{ item.ok ? '✅' : '❌' }}</span>
              <span v-if="!item.ok" class="wrong-ans">({{ item.realAns }})</span>
            </span>
          </div>
        </template>
      </div>
      
      <div class="btn-group">
        <template v-if="isHistoryReview">
          <button class="btn-primary" @click="$emit('backToHistory')">
            返回列表
          </button>
        </template>
        <template v-else>
          <button class="btn-primary" @click="$emit('home')">
            返回主页
          </button>
          <button class="btn-secondary" @click="$emit('restart')">
            再来一局
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  meta: String,
  isTrainMode: Boolean,
  trainLog: Array,
  results: Array,
  isHistoryReview: Boolean
})

defineEmits(['home', 'restart', 'backToHistory'])
</script>

<style scoped>
.wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px 16px 40px;
  padding-top: max(60px, env(safe-area-inset-top));
  height: 100vh;
  position: relative;
  z-index: 1;
}

.header-area {
  margin-bottom: 20px;
  text-align: center;
  flex-shrink: 0;
}

.title {
  font-size: 30px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.85);
  letter-spacing: -0.5px;
}

.subtitle {
  font-size: 15px;
  color: rgba(0, 0, 0, 0.45);
  margin-top: 6px;
  font-weight: 500;
}

.glass-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(60px) saturate(200%);
  -webkit-backdrop-filter: blur(60px) saturate(200%);
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.08),
    inset 0 1px 1px rgba(255, 255, 255, 0.9);
  overflow: hidden;
  position: relative;
}

.glass-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40%;
  background: linear-gradient(180deg, rgba(255,255,255,0.5) 0%, transparent 100%);
  pointer-events: none;
}

.card {
  padding: 20px 18px 24px;
}

.result-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  position: relative;
  z-index: 1;
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  font-weight: 500;
  color: rgba(0, 0, 0, 0.75);
}

.row-left {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 8px;
  font-size: 15px;
}

.row-right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.time-text {
  color: rgba(0, 0, 0, 0.4);
}

.time-slow {
  color: rgba(255, 69, 58, 0.9);
}

.result-icon {
  font-size: 16px;
}

.wrong-ans {
  color: rgba(255, 69, 58, 0.9);
  font-size: 13px;
  font-weight: 600;
}

.btn-group {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.btn-primary {
  width: 100%;
  height: 54px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(52, 199, 89, 0.85) 0%, rgba(48, 180, 80, 0.9) 100%);
  color: rgba(255, 255, 255, 0.95);
  font-size: 18px;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 
    0 8px 24px rgba(52, 199, 89, 0.35),
    inset 0 1px 1px rgba(255, 255, 255, 0.5);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
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
}

.btn-secondary {
  width: 100%;
  height: 50px;
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
  overflow: hidden;
}

.btn-secondary:active {
  transform: scale(0.98);
  background: rgba(255, 255, 255, 0.7);
}
</style>

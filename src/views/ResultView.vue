<template>
  <div class="wrap full-height">
    <div class="header-area safe-header">
      <div class="title">{{ title }}</div>
      <div class="subtitle">{{ meta }}</div>
    </div>
    
    <div class="card full-flex glass-panel">
      <div class="result-scroll">
        <!-- 训练模式 -->
        <template v-if="isTrainMode">
          <div v-for="(item, index) in trainLog" :key="index" class="row">
            <span class="row-left">{{ index + 1 }}. {{ item.q }}</span>
            <span class="row-right">
              <span :style="{ color: parseFloat(item.usedStr) > 2 ? '#ff3b30' : 'inherit' }">
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
              <span style="margin-right:4px; font-size:13px; color:#666;">{{ item.usedStr }}</span>
              <span>{{ item.ok ? '✅' : '❌' }}</span>
              <span v-if="!item.ok" class="wrong-ans">({{ item.realAns }})</span>
            </span>
          </div>
        </template>
      </div>
      
      <div style="margin-top: 15px;">
        <div v-if="isHistoryReview">
          <button class="btn-primary glass-primary main-action-btn" @click="$emit('backToHistory')">
            返回列表
          </button>
        </div>
        <div v-else>
          <button class="btn-primary glass-primary main-action-btn" @click="$emit('home')">
            返回主页
          </button>
          <button 
            class="btn-ghost glass-btn main-action-btn" 
            @click="$emit('restart')" 
            style="margin-top:10px;"
          >
            再来一局
          </button>
        </div>
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
  padding: 20px 16px 24px;
  box-sizing: border-box;
  position: relative;
  z-index: 1;
}

.full-height {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.header-area {
  margin-bottom: 20px;
  text-align: center;
  flex-shrink: 0;
}

.safe-header {
  padding-top: max(44px, env(safe-area-inset-top));
  margin-bottom: 20px;
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

.full-flex {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-bottom: 20px;
}

.result-scroll {
  width: 100%;
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  font-weight: 600;
  white-space: nowrap;
  color: #1c1c1e;
}

.row-left {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 8px;
}

.row-right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  text-align: right;
  justify-content: flex-end;
}

.wrong-ans {
  color: #ff3b30;
  font-size: 13px;
  margin-left: 2px;
  font-weight: 700;
}

.main-action-btn {
  font-size: 20px !important;
  height: 54px !important;
  line-height: 54px !important;
}
</style>

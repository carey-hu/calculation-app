<template>
  <div class="wrap home-wrap">
    <div class="header-area">
      <div class="title">选择除数</div>
      <div class="subtitle">点击下方数字开始练习商首位</div>
    </div>
    
    <div class="card glass-panel">
      <div class="grid">
        <button 
          v-for="item in divisorList" 
          :key="item" 
          class="k glass-key"
          @click="$emit('select', item)"
        >
          {{ item }}
        </button>
      </div>
      
      <button 
        class="btn-ghost glass-btn main-action-btn" 
        style="margin-top: 20px;" 
        @click="$emit('back')"
      >
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

.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.k {
  font-size: 20px;
  height: 50px;
  line-height: 50px;
  border-radius: 14px;
  font-weight: 900;
  color: #000;
}

.main-action-btn {
  font-size: 20px !important;
  height: 54px !important;
  line-height: 54px !important;
}
</style>

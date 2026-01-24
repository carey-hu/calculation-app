<template>
  <div class="wrap">
    <div class="header-area">
      <div class="title">历史记录</div>
      <div class="subtitle">仅保留最近5000条训练数据</div>
    </div>
    
    <div class="card glass-panel">
      <!-- 图表区域 -->
      <div v-if="showChart" class="chart-container">
        <div class="chart-tabs">
          <div 
            v-for="m in availableModes" 
            :key="m"
            :class="['chart-tab', chartTab === m ? 'active' : '']"
            @click="$emit('switchChartTab', m)"
          >
            {{ m }}
          </div>
        </div>
        <div id="accChart" class="chart-area"></div>
        <button class="btn-small" @click="$emit('closeChart')">收起图表</button>
      </div>
      <div v-else class="chart-trigger">
        <button class="btn-chart" @click="$emit('initChart')">📊 按模块分析趋势</button>
      </div>

      <!-- 列表头 -->
      <div class="list-header">
        <span>时间 / 模式</span>
        <span>成绩 / 耗时</span>
      </div>
      
      <!-- 历史列表 -->
      <div class="result-scroll">
        <div v-if="historyList.length === 0" class="empty-tip">暂无记录，快去练习吧！</div>
        <div v-else>
          <div v-for="(item, index) in historyList" :key="item.ts" class="row" @click="$emit('viewDetail', index)">
            <div class="row-left">
              <span class="row-time">{{ item.timeStr }}</span>
              <span class="row-mode">{{ item.modeName }}</span>
            </div>
            <div class="row-right">
              <span class="row-summary">{{ item.summary }}</span>
              <span class="row-duration">{{ item.duration }} ›</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="btn-group">
        <button v-if="historyList.length > 1000" class="btn-warning" @click="$emit('clearOldest')">🗑️ 清理最早的 1000 条</button>
        <div class="btn-row">
          <button class="btn-danger" @click="$emit('clearAll')">清空全部</button>
          <button class="btn-primary" @click="$emit('close')">返回主页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  historyList: Array,
  showChart: Boolean,
  chartTab: String,
  availableModes: Array
})

defineEmits(['initChart', 'switchChartTab', 'closeChart', 'viewDetail', 'clearOldest', 'clearAll', 'close'])
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
}

.subtitle {
  font-size: 15px;
  color: rgba(0, 0, 0, 0.45);
  margin-top: 6px;
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
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.9);
  overflow: hidden;
  position: relative;
}

.glass-panel::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 35%;
  background: linear-gradient(180deg, rgba(255,255,255,0.5) 0%, transparent 100%);
  pointer-events: none;
}

.chart-container {
  padding: 16px;
  margin: 16px;
  margin-bottom: 0;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  position: relative;
  z-index: 1;
}

.chart-tabs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 4px;
  margin-bottom: 12px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 12px;
}

.chart-tabs::-webkit-scrollbar { display: none; }

.chart-tab {
  flex-shrink: 0;
  font-size: 13px;
  padding: 8px 14px;
  border-radius: 10px;
  color: rgba(0, 0, 0, 0.5);
  cursor: pointer;
  font-weight: 600;
}

.chart-tab.active {
  background: rgba(255, 255, 255, 0.9);
  color: rgba(0, 0, 0, 0.8);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.chart-area { width: 100%; height: 200px; }

.chart-trigger { padding: 16px; position: relative; z-index: 1; }

.btn-chart {
  width: 100%;
  height: 48px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  font-size: 16px;
  font-weight: 600;
  color: rgba(0, 122, 255, 0.9);
  transition: all 0.2s;
}

.btn-chart:active { transform: scale(0.98); background: rgba(255, 255, 255, 0.7); }

.btn-small {
  width: 100%;
  height: 36px;
  margin-top: 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.6);
  font-size: 13px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.5);
}

.list-header {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px 8px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.35);
  font-size: 13px;
  position: relative;
  z-index: 1;
}

.result-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px;
  position: relative;
  z-index: 1;
}

.empty-tip {
  text-align: center;
  padding: 40px 20px;
  color: rgba(0, 0, 0, 0.35);
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  cursor: pointer;
}

.row:active {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 12px;
  margin: 0 -8px;
  padding-left: 8px;
  padding-right: 8px;
}

.row-left { display: flex; flex-direction: column; gap: 3px; }
.row-time { font-size: 12px; color: rgba(0, 0, 0, 0.4); }
.row-mode { font-weight: 600; color: rgba(0, 0, 0, 0.8); font-size: 15px; }

.row-right { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }
.row-summary { font-size: 16px; color: rgba(0, 122, 255, 0.9); font-weight: 700; }
.row-duration { font-size: 12px; color: rgba(0, 0, 0, 0.4); }

.btn-group {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.btn-row { display: flex; gap: 12px; }

.btn-warning {
  width: 100%;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(255, 69, 58, 0.1) 0%, rgba(255, 59, 48, 0.15) 100%);
  border: 1px solid rgba(255, 69, 58, 0.2);
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 69, 58, 0.9);
}

.btn-warning:active { transform: scale(0.98); }

.btn-danger {
  flex: 1;
  height: 52px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(255, 69, 58, 0.12) 0%, rgba(255, 59, 48, 0.18) 100%);
  border: 1px solid rgba(255, 69, 58, 0.25);
  font-size: 17px;
  font-weight: 600;
  color: rgba(255, 69, 58, 0.9);
}

.btn-danger:active { transform: scale(0.98); }

.btn-primary {
  flex: 1;
  height: 52px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(52, 199, 89, 0.85) 0%, rgba(48, 180, 80, 0.9) 100%);
  color: rgba(255, 255, 255, 0.95);
  font-size: 17px;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 6px 20px rgba(52, 199, 89, 0.3);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 50%;
  background: linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%);
  pointer-events: none;
}

.btn-primary:active { transform: scale(0.98); }
</style>

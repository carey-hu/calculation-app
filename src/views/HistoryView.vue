<template>
  <div class="wrap full-height">
    <div class="header-area safe-header">
      <div class="title">历史记录</div>
      <div class="subtitle">仅保留最近5000条训练数据</div>
    </div>
    
    <div class="card full-flex glass-panel">
      <!-- 图表区域 -->
      <div v-if="showChart" class="chart-container glass-inner">
        <div class="chart-tabs">
          <div 
            v-for="m in availableModes" 
            :key="m"
            :class="['chart-tab-item', chartTab === m ? 'active' : '']"
            @click="$emit('switchChartTab', m)"
          >
            {{ m }}
          </div>
        </div>
        <div id="accChart" style="width: 100%; height: 220px;"></div>
        <button class="btn-ghost small" style="margin-top:5px; font-size:13px;" @click="$emit('closeChart')">
          收起图表
        </button>
      </div>
      <div v-else>
        <button 
          class="btn-ghost glass-btn" 
          style="height:44px; line-height:44px; font-size:16px; margin-bottom:15px; color:#007aff;" 
          @click="$emit('initChart')"
        >
          📊 按模块分析趋势
        </button>
      </div>

      <!-- 列表头 -->
      <div class="list-header">
        <span>时间 / 模式</span>
        <span>成绩 / 耗时</span>
      </div>
      
      <!-- 历史列表 -->
      <div class="result-scroll">
        <div v-if="historyList.length === 0" class="empty-tip">
          暂无记录，快去练习吧！
        </div>
        <div v-else>
          <div 
            v-for="(item, index) in historyList" 
            :key="item.ts" 
            class="row hover-row" 
            @click="$emit('viewDetail', index)"
          >
            <div class="row-left" style="display:flex; flex-direction:column;">
              <span style="font-size:12px; color:#8e8e93;">{{ item.timeStr }}</span>
              <span style="font-weight:700; color:#1d1d1f; font-size:15px;">{{ item.modeName }}</span>
            </div>
            <div class="row-right" style="display:flex; flex-direction:column; align-items:flex-end;">
              <span style="font-size:16px; color:#007aff; font-weight:800;">{{ item.summary }}</span>
              <span style="font-size:12px; color:#8e8e93;">{{ item.duration }} > </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div style="margin-top: 15px; display:flex; flex-direction: column; gap:10px;">
        <button 
          v-if="historyList.length > 1000" 
          class="btn-ghost glass-btn" 
          style="margin:0; height: 40px; font-size: 16px; color: #ff3b30; background: rgba(255,59,48,0.08); border-color: rgba(255,59,48,0.2);" 
          @click="$emit('clearOldest')"
        >
          🗑️ 清理最早的 1000 条
        </button>

        <div style="display:flex; gap:10px;">
          <button class="btn-danger glass-btn main-action-btn" style="margin:0; flex:1;" @click="$emit('clearAll')">
            清空全部
          </button>
          <button class="btn-primary glass-primary main-action-btn" style="margin:0; flex:1;" @click="$emit('close')">
            返回主页
          </button>
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

.chart-container {
  background: rgba(255, 255, 255, 0.4);
  border-radius: 20px;
  padding: 15px;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.chart-tabs {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  padding: 4px;
  margin-bottom: 12px;
  background: rgba(118, 118, 128, 0.12);
  border-radius: 12px;
  scrollbar-width: none;
}

.chart-tabs::-webkit-scrollbar {
  display: none;
}

.chart-tab-item {
  flex-shrink: 0;
  font-size: 13px;
  padding: 6px 14px;
  border-radius: 8px;
  color: #666;
  cursor: pointer;
  font-weight: 600;
  border: 1px solid transparent;
}

.chart-tab-item.active {
  background: #fff;
  color: #000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.list-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 0 8px;
  font-weight: 700;
  color: #8e8e93;
  font-size: 13px;
}

.result-scroll {
  width: 100%;
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}

.empty-tip {
  text-align: center;
  padding: 20px;
  color: rgba(0, 0, 0, 0.4);
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

.hover-row {
  cursor: pointer;
}

.hover-row:active {
  background: rgba(0, 0, 0, 0.03);
  border-radius: 12px;
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

.main-action-btn {
  font-size: 20px !important;
  height: 54px !important;
  line-height: 54px !important;
}
</style>

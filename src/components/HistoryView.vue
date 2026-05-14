<template>
  <div class="wrap full-height">
    <div class="header-area safe-header">
      <div class="title">历史记录</div>
      <div class="subtitle">仅保留最近5000条训练数据</div>
    </div>
    <div class="card full-flex glass-panel">
      <!-- Chart section -->
      <div v-if="showChart" class="chart-container glass-inner">
        <div class="chart-tabs">
          <div v-for="m in availableModes" :key="m" :class="['chart-tab-item', chartTab === m ? 'active' : '']" @click="$emit('switchChartTab', m)">{{ m }}</div>
        </div>
        <div id="accChart" style="width: 100%; height: 220px;"></div>
        <button class="btnGhost small" style="margin-top:5px; font-size:13px;" @click="$emit('closeChart')">收起图表</button>
      </div>
      <div v-else>
        <button class="btnGhost glass-btn" style="height:44px; line-height:44px; font-size:16px; margin-bottom:15px; color:#007aff;" @click="$emit('initChart')">📊 按模块分析趋势</button>
      </div>

      <!-- Export section -->
      <div v-if="showExport" class="chart-container glass-inner">
        <div style="font-weight:700; color:#1d1d1f; font-size:14px; margin-bottom:10px;">📥 导出区间数据</div>
        <div class="export-tabs">
          <div :class="['export-tab', exportFormat === 'csv' ? 'active' : '']" @click="$emit('setExportFormat', 'csv')">数据表格 (CSV)</div>
          <div :class="['export-tab', exportFormat === 'text' ? 'active' : '']" @click="$emit('setExportFormat', 'text')">练习统计 (文本)</div>
        </div>
        <div style="display:flex; gap:8px; align-items:center; margin-bottom:8px;">
          <input type="date" :value="exportStart" @input="$emit('update:exportStart', ($event.target as HTMLInputElement).value)" class="export-date-input" />
          <span style="font-size:13px; color:#8e8e93;">至</span>
          <input type="date" :value="exportEnd" @input="$emit('update:exportEnd', ($event.target as HTMLInputElement).value)" class="export-date-input" />
          <button class="export-quick-btn" @click="$emit('selectAllRange')">全部</button>
        </div>
        <div style="font-size:12px; color:#8e8e93; margin-bottom:6px;">
          所选区间共 <span style="color:#1d1d1f; font-weight:700;">{{ filteredCount }}</span> 条 / 全部 {{ totalCount }} 条
        </div>
        <div v-if="exportFormat === 'csv'" style="font-size:11px; color:#8e8e93; margin-bottom:10px; line-height:1.5;">
          CSV 通用格式，手机可直接预览，电脑用 Excel/WPS/Numbers 打开。
        </div>
        <div v-else style="font-size:11px; color:#8e8e93; margin-bottom:10px; line-height:1.5;">
          文本报告，按日汇总练习时间、组数和各模式正确率。
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btnGhost small" style="font-size:13px; flex:1; height:40px; line-height:40px;" @click="$emit('closeExport')">收起</button>
          <button class="btnPrimary" style="height:40px; line-height:40px; font-size:14px; flex:2; box-shadow:none;" @click="$emit('doExport')">
            {{ exportFormat === 'text' ? '导出 .txt' : '导出 .csv' }}
          </button>
        </div>
      </div>
      <div v-else>
        <button class="btnGhost glass-btn" style="height:44px; line-height:44px; font-size:16px; margin-bottom:15px; color:#34c759;" @click="$emit('openExport')">📥 导出区间数据 (表格 / 文本)</button>
      </div>

      <div style="display:flex; justify-content:space-between; margin-bottom:8px; padding:0 8px; font-weight:700; color:#8e8e93; font-size:13px;">
        <span>时间 / 模式</span><span>成绩 / 耗时</span>
      </div>
      <div class="resultScroll">
        <div v-if="historyList.length === 0" style="text-align:center; padding: 20px; color:rgba(0,0,0,0.4);">暂无记录，快去练习吧！</div>
        <div v-else>
          <div v-for="(item, index) in historyList" :key="item.ts" class="row hover-row" @click="$emit('viewHistoryDetail', index)" style="cursor:pointer;">
            <div class="rowLeft" style="display:flex; flex-direction:column;">
              <span style="font-size:12px; color:#8e8e93;">{{ item.timeStr }}</span>
              <span style="font-weight:700; color:#1d1d1f; font-size:15px;">{{ item.modeName }}</span>
            </div>
            <div class="rowRight" style="display:flex; flex-direction:column; align-items:flex-end;">
              <span style="font-size:16px; color:#007aff; font-weight:800;">{{ item.summary }}</span>
              <span style="font-size:12px; color:#8e8e93;">{{ item.duration }} > </span>
            </div>
          </div>
        </div>
      </div>
      <div style="margin-top: 15px; display:flex; flex-direction: column; gap:10px;">
        <button v-if="historyList.length > 1000" class="btnGhost glass-btn" style="margin:0; height: 40px; font-size: 16px; color: #ff3b30; background: rgba(255,59,48,0.08); border-color: rgba(255,59,48,0.2);" @click="$emit('clearOldest')">🗑️ 清理最早的 1000 条</button>
        <div style="display:flex; gap:10px;">
          <button class="btnDanger glass-btn main-action-btn" style="margin:0; flex:1;" @click="$emit('clearHistory')">清空全部</button>
          <button class="btnPrimary glass-primary main-action-btn" style="margin:0; flex:1;" @click="$emit('closeHistory')">返回主页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { HistoryRecord } from '../types';

defineProps<{
  historyList: HistoryRecord[];
  showChart: boolean;
  chartTab: string;
  availableModes: string[];
  showExport: boolean;
  exportFormat: string;
  exportStart: string;
  exportEnd: string;
  filteredCount: number;
  totalCount: number;
}>();

defineEmits<{
  switchChartTab: [modeName: string];
  closeChart: [];
  initChart: [];
  openExport: [];
  closeExport: [];
  setExportFormat: [f: string];
  selectAllRange: [];
  doExport: [];
  viewHistoryDetail: [index: number];
  clearOldest: [];
  clearHistory: [];
  closeHistory: [];
  'update:exportStart': [v: string];
  'update:exportEnd': [v: string];
}>();
</script>

<template>
  <div class="page">
    <div class="mesh-bg">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
    </div>

    <div v-if="toast.show" class="toast-mask">
      <div class="toast-content">{{ toast.title }}</div>
    </div>

    <HomeView
      v-if="viewState === 'home'"
      :modeGroups="modeGroups"
      :currentModeKey="currentModeKey"
      @setMode="setMode"
      @toSelectDivisor="toSelectDivisor"
      @startGame="startGame"
      @openHistory="openHistory"
      @startCubicMode="startCubicMode"
    />

    <SelectDivisorView
      v-if="viewState === 'selectDivisor'"
      :divisorList="divisorList"
      @selectDivisorAndStart="selectDivisorAndStart"
      @goHome="goHome"
    />

    <GameView
      v-if="viewState === 'game'"
      :currentModeKey="currentModeKey"
      :input="input"
      :inputArray="inputArray"
      :decompStep="decompStep"
      :uiHint="uiHint"
      :totalText="totalText"
      :progressText="progressText"
      :qText="qText"
      :leftText="leftText"
      :activeConfig="activeConfig"
      :isSmallFont="isSmallFont"
      @goHome="goHome"
      @pressDigit="pressDigit"
      @pressDot="pressDot"
      @clearInput="clearInput"
      @backspace="backspace"
      @leftAction="leftAction"
      @confirmAnswer="confirmAnswer"
    />

    <ResultView
      v-if="viewState === 'result'"
      :currentModeKey="currentModeKey"
      :resultTitle="resultTitle"
      :resultMeta="resultMeta"
      :trainLog="trainLog"
      :results="results"
      :isHistoryReview="isHistoryReview"
      @goHome="goHome"
      @startGame="startGame"
      @backToHistory="backToHistory"
    />

    <HistoryView
      v-if="viewState === 'history'"
      :historyList="historyList"
      :showChart="showChart"
      :chartTab="chartTab"
      :availableModes="availableModes"
      :showExport="showExport"
      :exportFormat="exportFormat"
      :exportStart="exportStart"
      :exportEnd="exportEnd"
      :filteredCount="filteredCount"
      :totalCount="totalCount"
      @switchChartTab="switchChartTab"
      @closeChart="closeChart"
      @initChart="initChart"
      @openExport="openExport"
      @closeExport="closeExport"
      @setExportFormat="setExportFormat"
      @selectAllRange="selectAllRange"
      @doExport="doExport"
      @viewHistoryDetail="viewHistoryDetail"
      @clearOldest="clearOldest"
      @clearHistory="clearHistory"
      @closeHistory="closeHistory"
      @update:exportStart="exportStart = $event"
      @update:exportEnd="exportEnd = $event"
    />

    <CubicView
      v-if="viewState === 'cubic'"
      :cubicMode="cubicMode"
      :isDeleteMode="isDeleteMode"
      :showShapeMenu="showShapeMenu"
      :sliceMenuCollapsed="sliceMenuCollapsed"
      :currentShapeName="currentShapeName"
      :colors="colors"
      :selectedColor="selectedColor"
      :sliceConfig="sliceConfig"
      :examShapes="examShapes"
      @quitCubicMode="quitCubicMode"
      @toggleShapeMenu="showShapeMenu = !showShapeMenu"
      @toggleSliceMenu="sliceMenuCollapsed = !sliceMenuCollapsed"
      @switchColor="switchColor"
      @toggleDeleteMode="toggleDeleteMode"
      @setCameraView="setThreeCameraView"
      @lookAtSection="lookAtSection"
      @loadExamShape="loadExamShape"
      @clearCubes="clearCubes"
      @resetSlice="resetSlice"
      @update:sliceConstant="sliceConfig.constant = $event"
      @update:sliceRotX="sliceConfig.rotX = $event"
      @update:sliceRotY="sliceConfig.rotY = $event"
      @update:sliceRotZ="sliceConfig.rotZ = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue';
import { MODE_GROUPS, DIVISOR_LIST, getModeConfig } from './lib/game-modes';
import { useToast } from './composables/useToast';
import { useHistory } from './composables/useHistory';
import { useChart } from './composables/useChart';
import { useGame } from './composables/useGame';
import { useThreeScene } from './composables/useThreeScene';
import { useExport } from './composables/useExport';
import HomeView from './components/HomeView.vue';
import SelectDivisorView from './components/SelectDivisorView.vue';
import GameView from './components/GameView.vue';
import ResultView from './components/ResultView.vue';
import HistoryView from './components/HistoryView.vue';
import CubicView from './components/CubicView.vue';

const viewState = ref('home');

const { toast, showToast } = useToast();
const history = useHistory();
const chart = useChart(history.list);
const game = useGame({ viewState, history });
const three = useThreeScene({ viewState });
const exportTool = useExport({ historyListRef: history.list, showToast });

// Game state + actions (exposed to template)
const {
  currentModeKey, input, inputArray, decompStep,
  uiHint, totalText, progressText, qText, leftText,
  trainLog, results, isHistoryReview,
  activeConfig, isSmallFont, resultTitle, resultMeta,
  setMode, toSelectDivisor, selectDivisorAndStart,
  startGame,
  pressDigit, pressDot, clearInput, backspace, leftAction,
  confirmAnswer,
  goHome,
} = game;

// History list + chart
const historyList = history.list;
const {
  showChart, chartTab, availableModes,
  switchChartTab, closeChart, initChart,
} = chart;

// Export to CSV / Text report
const {
  showExport, exportFormat, exportStart, exportEnd, filteredCount, totalCount,
  openExport, closeExport, setExportFormat, selectAllRange, doExport,
} = exportTool;

// 3D mode
const {
  cubicMode, isDeleteMode, showShapeMenu, sliceMenuCollapsed,
  currentShapeName, colors, selectedColor, sliceConfig,
  examShapes,
  startCubicMode, quitCubicMode,
  switchColor, toggleDeleteMode,
  setCameraView: setThreeCameraView, lookAtSection,
  loadExamShape, clearCubes, resetSlice,
} = three;

// Static menu data
const modeGroups = MODE_GROUPS;
const divisorList = DIVISOR_LIST;

// View-orchestrating actions
const openHistory = () => {
  viewState.value = 'history';
  chart.reopenIfActive();
};

const backToHistory = () => {
  viewState.value = 'history';
  chart.reopenIfActive();
};

const closeHistory = () => { viewState.value = 'home'; };

const viewHistoryDetail = (index: number) => {
  game.viewHistoryDetail(history.list.value[index]);
};

const clearOldest = () => {
  if (!confirm(`当前共有 ${history.list.value.length} 条记录。\n确定要清除【最早的 1000 条】数据吗？`)) return;
  history.clearOldest(1000);
  showToast('清理成功');
  if (chart.showChart.value) chart.initChart();
};

const clearHistory = () => {
  if (!confirm('【严重警告】\n确定要清空【所有】历史记录吗？\n此操作不可恢复！')) return;
  history.clearAll();
  showToast('所有记录已清空');
};

onBeforeUnmount(() => {
  three.cleanup();
});
</script>

<style>
.shape-menu-container {
  position: absolute;
  top: 60px;
  left: 10px;
  z-index: 50;
  pointer-events: auto;
}

.shape-menu {
  width: 260px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 15px rgba(0,0,0,0.15);
  border-radius: 24px;
  scrollbar-width: none;
}
.shape-menu::-webkit-scrollbar { display: none; }

.shape-group-title {
  font-size: 12px;
  color: #8e8e93;
  font-weight: 700;
  margin-top: 4px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  padding-bottom: 2px;
}
.shape-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.shape-item {
  background: rgba(240,240,245,0.8);
  padding: 8px 4px;
  font-size: 13px;
  text-align: center;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  border: 1px solid rgba(0,0,0,0.05);
  transition: all 0.2s;
}
.shape-item:active {
  background: #007aff;
  color: white;
  transform: scale(0.95);
}

.homeStartBtn{ margin-top: 14px; }
.page { height: 100vh; height: 100dvh; min-height: 100vh; background: radial-gradient(at 0% 0%, hsla(210,100%,94%,1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(260,100%,94%,1) 0, transparent 50%), radial-gradient(at 100% 100%, hsla(300,100%,94%,1) 0, transparent 50%), radial-gradient(at 0% 100%, hsla(180,100%,94%,1) 0, transparent 50%); background-color: #f2f2f7; color: #1c1c1e; display: flex; flex-direction: column; max-width: 480px; margin: 0 auto; box-shadow: 0 0 40px rgba(0,0,0,0.08); font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif; box-sizing: border-box; position: relative; overflow: hidden; }
.mesh-bg { position: absolute; top:0; left:0; width:100%; height:100%; z-index:0; pointer-events:none; }
.orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.7; animation: float 10s infinite alternate ease-in-out; }
.orb-1 { width: 350px; height: 350px; background: #a2d2ff; top: -100px; left: -100px; }
.orb-2 { width: 300px; height: 300px; background: #e2c2ff; bottom: -50px; right: -80px; animation-delay: -3s; }
.orb-3 { width: 200px; height: 200px; background: #ffdfba; top: 40%; left: 30%; opacity:0.5; animation-delay: -6s; }
@keyframes float { 0% { transform: translate(0, 0); } 100% { transform: translate(20px, 30px); } }
.toast-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; display: flex; justify-content: center; align-items: center; z-index: 999; pointer-events: none; }
.toast-content { background: rgba(0,0,0,0.7); backdrop-filter: blur(20px); color: #fff; padding: 12px 24px; border-radius: 50px; font-weight: 600; font-size: 15px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
.wrap { padding: 20px 16px 24px; box-sizing: border-box; position: relative; z-index: 1; }

.homeWrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  overflow: hidden;
  padding-top: max(60px, env(safe-area-inset-top));
  padding-bottom: 0;
  position: relative;
}

.header-area {
  margin-bottom: 10px;
  text-align: center;
  flex-shrink: 0;
}

.menu-area-fixed {
  flex: 1;
  overflow: hidden;
  padding: 0 16px;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  padding-bottom: 12px;
}

.full-menu-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 24px;
  margin-bottom: 0 !important;
  padding: 0 !important;
}

.menu-scroll-container {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px 16px 0 16px;
  scrollbar-width: none;
}
.menu-scroll-container::-webkit-scrollbar { display: none; }

.card-bottom-actions {
  flex-shrink: 0;
  padding: 16px;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.0);
  z-index: 10;
  display: flex;
  flex-direction: column;
  position: relative;
}

.separator-line {
  position: absolute;
  top: 0;
  left: 16px;
  right: 16px;
  height: 1px;
  background: rgba(0, 0, 0, 0.05);
}

.fixed-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0 16px;
  padding-bottom: calc(24px + env(safe-area-inset-bottom));
  z-index: 20;
  pointer-events: none;
}

.bottom-panel {
  padding: 16px;
  border-radius: 24px !important;
  pointer-events: auto;
  box-shadow: 0 -10px 40px rgba(0,0,0,0.1) !important;
}

.full-height { flex: 1; display: flex; flex-direction: column; height: 100vh; }
.full-flex { flex: 1; display: flex; flex-direction: column; overflow: hidden; margin-bottom: 20px; }
.title { font-size: 34px; font-weight: 900; margin: 0 0 6px; color: #000; letter-spacing: -0.5px; }
.subtitle { font-size: 15px; color: #8e8e93; font-weight: 500; }
.glass-panel { background: rgba(255, 255, 255, 0.65); backdrop-filter: blur(50px) saturate(200%); -webkit-backdrop-filter: blur(50px) saturate(200%); border: 1px solid rgba(255, 255, 255, 0.4); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(255,255,255,0.5); }
.card { border-radius: 28px; padding: 16px; }
.rowLabel { font-size: 13px; font-weight: 700; color: #007aff; margin: 16px 0 8px 6px; opacity: 0.9; letter-spacing: 0.5px; }
.modeRow { display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
.modeItem { flex: 1 0 30%; padding: 14px 4px; border-radius: 16px; background: rgba(255,255,255,0.5); border: 1px solid rgba(0,0,0,0.05); text-align: center; box-sizing: border-box; transition: all 0.1s; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.02); }
.modeItem:active { transform: scale(0.97); }
.modeItem.active { background: #007aff; border-color: transparent; box-shadow: 0 8px 20px rgba(0,122,255,0.3); }
.modeTitle { display: block; font-size: 16px; font-weight: 700; color: #1c1c1e; }
.modeItem.active .modeTitle { color: #fff; }
button { border: none; outline: none; cursor: pointer; font-family: inherit; }
.btnPrimary { width: 100%; height: 50px; line-height: 50px; border-radius: 16px; background: linear-gradient(135deg, #34c759 0%, #28a745 100%); color: #fff; font-size: 20px; font-weight: 700; box-shadow: 0 10px 25px rgba(0,122,255,0.25); transition: transform 0.1s; }
.btnPrimary:active { transform: scale(0.98); opacity: 0.9; }
.btnGhost { width: 100%; height: 48px; line-height: 48px; border-radius: 16px; background: rgba(255,255,255,0.5); border: 1px solid rgba(0,0,0,0.05); color: #007aff; font-size: 18px; font-weight: 600; box-shadow: 0 2px 10px rgba(0,0,0,0.02); transition: background 0.2s; }
.btnGhost:active { background: rgba(255,255,255,0.8); }
.btnHistory { width: 100%; height: 48px; line-height: 48px; margin-top: 9px; border-radius: 16px; background: rgba(88, 86, 214, 0.1); color: #5856d6; font-size: 20px; font-weight: 700; border: 1px solid rgba(88, 86, 214, 0.2); }
.btnHistory:active { background: rgba(88, 86, 214, 0.2); }
.btnDanger { width: 100%; height: 48px; line-height: 48px; border-radius: 16px; background: rgba(255, 59, 48, 0.1); color: #ff3b30; font-size: 20px; font-weight: 700; border: 1px solid rgba(255, 59, 48, 0.2); }
.btnDanger:active { background: rgba(255, 59, 48, 0.2); }
.main-action-btn { font-size: 20px !important; height: 54px !important; line-height: 54px !important; }
.gameRoot { min-height: 100vh; display: flex; flex-direction: column; padding-bottom: 0; }
.safe-top { padding-top: max(44px, env(safe-area-inset-top)); padding-bottom: 12px; height: auto; box-sizing: content-box; display: flex; align-items: center; gap: 12px; margin-bottom: 5px; }
.safe-header { padding-top: max(44px, env(safe-area-inset-top)); margin-bottom: 20px; }
.btnBack { width: 80px; height: 44px; line-height: 44px; border-radius: 14px; background: rgba(255,255,255,0.6); border: 1px solid rgba(0,0,0,0.05); font-weight: 700; font-size: 16px; margin: 0; color: #1c1c1e; backdrop-filter: blur(10px); }
.topStats { flex: 1; display: flex; justify-content: flex-end; align-items: center; gap: 8px; font-weight: 700; font-size: 16px; color: #333; }
.glass-pill { background: rgba(255,255,255,0.5); padding: 6px 14px; border-radius: 20px; border: 1px solid rgba(0,0,0,0.03); backdrop-filter: blur(10px); }
.gameMain { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.qCard { text-align: center; padding: 30px 20px; }
.qText { font-size: 64px; font-weight: 800; margin-top: 0; color: #1c1c1e; letter-spacing: -2px; }
.qNote { margin-top: 8px; font-size: 16px; color: #8e8e93; font-weight: 500; }
.ansBox { margin-top: 20px; padding: 15px; border-radius: 20px; background: rgba(255,255,255,0.5); font-size: 44px; font-weight: 800; min-height: 44px; color: #007aff; box-shadow: inset 0 2px 6px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.03); }
.hint { margin-top: 15px; color: #8e8e93; font-size: 15px; font-weight: 600; }
.keypad { border-radius: 28px; overflow: hidden; clip-path: inset(0 0 0 0 round 28px); margin-bottom: calc( 6px + env(safe-area-inset-bottom)); }
.fnRow { display: flex; gap: 9px; margin-bottom: 9px; }
.kFn { flex: 1; height: 65px; line-height: 65px; border-radius: 14px; font-size: 20px; font-weight: 900; margin: 0; color: #fff; border: 1px solid rgba(0,0,0,0.05); backdrop-filter: blur(10px); }
.style-skip { background: #34c759; border-color: #248a3d; }
.style-clear { background: #ff9500; border-color: #e08600; }
.style-del { background: #ff3b30; border-color: #d63329; }
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; }
.k { width: 100%; height: 70px; line-height: 70px; border-radius: 14px; background: rgba(255,255,255,0.85); border: 1px solid rgba(0,0,0,0.03); font-size: 30px; font-weight: 900; margin: 0; color: #000; box-shadow: 0 4px 0 rgba(0,0,0,0.04); transition: all 0.1s; }
.k:active { transform: translateY(4px); box-shadow: none; background: #fff; }
.glass-key-confirm { background: #34c759; color: #fff; border:none; font-size: 28px; box-shadow: 0 4px 0 #248a3d; border-radius: 11px; }
.glass-key-confirm:active { background: #28a745; box-shadow: none; transform: translateY(4px); }
.k.wide { grid-column: 1 / 2; }
.k.wide2 { grid-column: 2 / 4; }
.chart-container { background: rgba(255,255,255,0.4); border-radius: 20px; padding: 15px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.5); }
.chart-tabs { display: flex; gap: 4px; overflow-x: auto; padding: 4px; margin-bottom: 12px; background: rgba(118, 118, 128, 0.12); border-radius: 12px; scrollbar-width: none; }
.chart-tabs::-webkit-scrollbar { display: none; }
.chart-tab-item { flex-shrink: 0; font-size: 13px; padding: 6px 14px; border-radius: 8px; color: #666; cursor: pointer; font-weight: 600; border: 1px solid transparent; }
.chart-tab-item.active { background: #fff; color: #000; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.resultScroll { width: 100%; flex: 1; overflow-y: auto; padding-right: 4px; }
.row { display: flex; justify-content: space-between; align-items: center; padding: 18px 0; border-bottom: 1px solid rgba(0,0,0,0.05); font-weight: 600; white-space: nowrap; color: #1c1c1e; }
.hover-row:active { background: rgba(0,0,0,0.03); border-radius: 12px; }
.rowLeft { flex: 1; overflow: hidden; text-overflow: ellipsis; padding-right: 8px; }
.rowRight { flex-shrink: 0; display: flex; align-items: center; text-align: right; justify-content: flex-end; }
.qText-small { font-size: 52px !important; letter-spacing: -1px !important; white-space: nowrap; margin-top: 10px; overflow: visible; }

.cubic-ui { position: absolute; top: 0; left: 0; width: 100%; padding-left: 10px; padding-right: 10px; padding-bottom: 10px; padding-top: max(60px, calc(env(safe-area-inset-top) + 10px)); box-sizing: border-box; pointer-events: none; z-index: 10; display: flex; flex-direction: column; align-items: center; }
.cubic-ui > * { pointer-events: auto; }
.small-btn { width: auto !important; height: 36px !important; line-height: 36px !important; padding: 0 16px !important; font-size: 14px !important; }
.btnIcon { background: rgba(255,255,255,0.4); border: 1px solid rgba(0,0,0,0.05); border-radius: 12px; padding: 8px 12px; font-size: 14px; font-weight: 600; color: #333; transition: all 0.2s; }
.btnIcon.active { background: #007aff; color: white; box-shadow: 0 4px 10px rgba(0,122,255,0.3); }
.divider { width: 1px; height: 20px; background: rgba(0,0,0,0.1); margin: 0 5px; }
.tip-toast { margin-top: 10px; background: rgba(0,0,0,0.6); color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; backdrop-filter: blur(4px); }
.color-dot { width: 28px; height: 28px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.5); box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; }
.color-dot:active { transform: scale(0.9); }
.color-dot.active { transform: scale(1.1); border-color: #fff; box-shadow: 0 0 0 2px rgba(0,0,0,0.1), inset 0 0 0 2px rgba(255,255,255,0.8); }
.view-selector { margin-top: 8px; padding: 6px; display: flex; gap: 6px; border-radius: 20px; flex-wrap: wrap; justify-content: center; }
.view-btn { background: rgba(255,255,255,0.5); border: 1px solid rgba(0,0,0,0.05); border-radius: 12px; padding: 6px 14px; font-size: 13px; font-weight: 600; color: #333; }
.view-btn:active, .view-btn.active-view { background: #007aff; color: white; }

.slice-panel-container {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  width: 92%;
  max-width: 380px;
  transition: all 0.4s cubic-bezier(0.32, 0.72, 0, 1);
  z-index: 100;
}

.slice-panel-container.collapsed {
  transform: translateX(-50%) translateY(calc(100% - 60px));
}

.slice-panel-content {
  pointer-events: auto;
  padding: 0;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.75) !important;
  backdrop-filter: blur(30px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(30px) saturate(180%) !important;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  border-radius: 28px !important;
}

.panel-header {
  padding: 10px 20px 16px;
  background: transparent;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.sheet-handle {
  width: 36px;
  height: 5px;
  background: rgba(60, 60, 67, 0.3);
  border-radius: 3px;
  margin-bottom: 12px;
}

.header-row {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-size: 17px;
  font-weight: 600;
  color: #1c1c1e;
  letter-spacing: -0.4px;
}

.header-toggle-text {
  font-size: 13px;
  color: #007aff;
  font-weight: 600;
  background: rgba(0, 122, 255, 0.1);
  padding: 4px 10px;
  border-radius: 12px;
}

.controls-body {
  padding: 0 20px 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.slice-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slice-label {
  width: 48px;
  text-align: right;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 500;
  color: #8e8e93;
}

.slice-slider {
  flex: 1;
  -webkit-appearance: none;
  height: 24px;
  background: transparent;
  outline: none;
}

.slice-slider::-webkit-slider-runnable-track {
  width: 100%;
  height: 6px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 3px;
}

.slice-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 24px;
  width: 24px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15), 0 0 0 0.5px rgba(0,0,0,0.04);
  margin-top: -9px;
  cursor: pointer;
  transition: transform 0.1s;
}

.slice-slider::-webkit-slider-thumb:active {
  transform: scale(0.95);
}

.ios-reset-btn {
  width: 100%;
  height: 44px;
  line-height: 44px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 14px;
  color: #007aff;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.2s;
}

.ios-reset-btn:active {
  background: rgba(255, 255, 255, 0.8);
  transform: scale(0.98);
}

.export-date-input {
  flex: 1;
  min-width: 0;
  height: 38px;
  padding: 0 10px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.6);
  font-family: inherit;
  font-size: 14px;
  color: #1c1c1e;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  box-sizing: border-box;
}
.export-date-input:focus {
  border-color: rgba(0, 122, 255, 0.4);
  background: rgba(255, 255, 255, 0.85);
}

.export-tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  margin-bottom: 10px;
  background: rgba(118, 118, 128, 0.12);
  border-radius: 12px;
}
.export-tab {
  flex: 1;
  text-align: center;
  font-size: 13px;
  padding: 7px 6px;
  border-radius: 8px;
  color: #666;
  cursor: pointer;
  font-weight: 600;
  border: 1px solid transparent;
  transition: background 0.15s, color 0.15s;
}
.export-tab.active {
  background: #fff;
  color: #000;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
}

.export-quick-btn {
  flex-shrink: 0;
  height: 38px;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid rgba(0, 122, 255, 0.25);
  background: rgba(0, 122, 255, 0.08);
  color: #007aff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}
.export-quick-btn:active {
  background: rgba(0, 122, 255, 0.18);
}
</style>

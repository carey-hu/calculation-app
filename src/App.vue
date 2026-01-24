<template>
  <div class="page">
    <!-- 液态玻璃背景 -->
    <LiquidBackground />

    <!-- Toast 提示 -->
    <ToastMessage :show="toast.show" :message="toast.message" />

    <!-- 首页 -->
    <HomeView 
      v-if="viewState === 'home'"
      :mode-groups="modeGroups"
      :current-mode-key="game.currentModeKey.value"
      @set-mode="game.setMode"
      @to-select-divisor="viewState = 'selectDivisor'"
      @start-cubic="startCubicMode"
      @start="handleStartGame"
      @open-history="openHistory"
    />

    <!-- 除数选择 -->
    <SelectDivisorView 
      v-if="viewState === 'selectDivisor'"
      :divisor-list="divisorList"
      @select="selectDivisorAndStart"
      @back="viewState = 'home'"
    />

    <!-- 游戏界面 -->
    <GameView 
      v-if="viewState === 'game'"
      :progress-text="game.progressText.value"
      :total-text="game.totalText.value"
      :q-text="game.qText.value"
      :hint-note="game.activeConfig.value.hintNote || '精确到整数'"
      :input="game.input.value"
      :ui-hint="uiHint"
      :is-small-font="game.isSmallFont.value"
      :left-text="game.leftText.value"
      @back="goHome"
      @digit="game.pressDigit"
      @clear="game.clearInput"
      @backspace="game.backspace"
      @left="handleLeftAction"
      @confirm="handleConfirmAnswer"
    />

    <!-- 3D 积木 -->
    <CubicView 
      v-if="viewState === 'cubic'"
      :colors="cubic.colors"
      :selected-color="cubic.selectedColor.value"
      :is-delete-mode="cubic.isDeleteMode.value"
      :is-slice-mode="cubic.isSliceMode.value"
      :slice-config="cubic.sliceConfig"
      @quit="quitCubicMode"
      @switch-color="cubic.switchColor"
      @toggle-delete="cubic.toggleDeleteMode"
      @toggle-slice="cubic.toggleSliceMode"
      @clear="cubic.clearCubes"
      @set-view="cubic.setCameraView"
      @update-slice="handleUpdateSlice"
      @reset-slice="cubic.resetSlice"
    />

    <!-- 结果页面 -->
    <ResultView 
      v-if="viewState === 'result'"
      :title="game.activeConfig.value.title || '训练完成！'"
      :meta="resultMeta"
      :is-train-mode="game.currentModeKey.value === 'train'"
      :train-log="game.trainLog.value"
      :results="game.results.value"
      :is-history-review="isHistoryReview"
      @home="goHome"
      @restart="handleStartGame"
      @back-to-history="backToHistory"
    />

    <!-- 历史记录 -->
    <HistoryView 
      v-if="viewState === 'history'"
      :history-list="historyList"
      :show-chart="chart.showChart.value"
      :chart-tab="chart.chartTab.value"
      :available-modes="chart.availableModes.value"
      @init-chart="handleInitChart"
      @switch-chart-tab="handleSwitchChartTab"
      @close-chart="chart.closeChart"
      @view-detail="viewHistoryDetail"
      @clear-oldest="handleClearOldest"
      @clear-all="handleClearAll"
      @close="viewState = 'home'"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

// 组件
import LiquidBackground from '@/components/LiquidBackground.vue'
import ToastMessage from '@/components/ToastMessage.vue'
import HomeView from '@/views/HomeView.vue'
import SelectDivisorView from '@/views/SelectDivisorView.vue'
import GameView from '@/views/GameView.vue'
import CubicView from '@/views/CubicView.vue'
import ResultView from '@/views/ResultView.vue'
import HistoryView from '@/views/HistoryView.vue'

// 组合式函数
import { useGameState } from '@/composables/useGameState'
import { useToast } from '@/composables/useToast'
import { useCubicMode } from '@/composables/useCubicMode'
import { useChart } from '@/composables/useChart'

// 配置
import { MODE_GROUPS, DIVISOR_LIST } from '@/config/gameModes'

// 工具
import { getHistory, clearHistory as clearStorageHistory, clearOldestRecords } from '@/utils/storage'

// ============================================================
// 状态
// ============================================================

const viewState = ref('home')
const historyList = ref([])
const isHistoryReview = ref(false)
const uiHint = ref('请输入答案')
const totalSec = ref(0)

// 配置数据
const modeGroups = MODE_GROUPS
const divisorList = DIVISOR_LIST

// 组合式函数实例
const game = useGameState()
const toast = useToast()
const cubic = useCubicMode()
const chart = useChart()

// ============================================================
// 计算属性
// ============================================================

const resultMeta = computed(() => game.getResultMeta(totalSec.value))

// ============================================================
// 生命周期
// ============================================================

onMounted(() => {
  historyList.value = getHistory()
  window.addEventListener('resize', chart.resizeChart)
})

onUnmounted(() => {
  game.stopTimer()
  cubic.cleanup()
  window.removeEventListener('resize', chart.resizeChart)
})

// ============================================================
// 方法
// ============================================================

function handleStartGame() {
  if (game.startGame()) {
    viewState.value = 'game'
    uiHint.value = '请输入答案'
    isHistoryReview.value = false
    nextTick(() => { game.nextQuestion() })
  }
}

function selectDivisorAndStart(d) {
  game.setMode('firstSpec')
  game.setDivisor(d)
  handleStartGame()
}

function handleLeftAction() {
  if (game.currentModeKey.value !== 'train') {
    handleStartGame()
    return
  }
  if (!game.skipQuestion()) { finishGame() }
}

function handleConfirmAnswer() {
  const result = game.checkAnswer()
  if (!result) return
  
  if (game.currentModeKey.value === 'train') {
    if (game.recordTrainResult(result)) {
      toast.showToast('正确')
      if (!game.nextQuestion()) { finishGame() }
    } else {
      uiHint.value = `错误！答案是：${result.realAnsDisplay}`
    }
  } else {
    game.recordNormalResult(result)
    toast.showToast(result.correct ? '正确' : `错误(${result.realAnsDisplay})`)
    if (!game.nextQuestion()) { finishGame() }
  }
}

function finishGame() {
  const result = game.finishGame(historyList.value)
  totalSec.value = result.totalSec
  historyList.value = result.newHistory
  viewState.value = 'result'
  isHistoryReview.value = false
}

function goHome() {
  game.stopTimer()
  viewState.value = 'home'
}

function openHistory() {
  viewState.value = 'history'
  if (chart.showChart.value) {
    nextTick(() => { chart.renderChart(chart.chartTab.value, historyList.value) })
  }
}

function viewHistoryDetail(index) {
  const record = historyList.value[index]
  if (!record) return
  game.setMode(record.mode)
  totalSec.value = parseFloat(record.duration.replace('s', ''))
  if (record.mode === 'train') {
    game.trainLog.value = record.detail || []
    game.results.value = []
  } else {
    game.results.value = record.detail || []
    game.trainLog.value = []
  }
  viewState.value = 'result'
  isHistoryReview.value = true
}

function backToHistory() {
  viewState.value = 'history'
  if (chart.showChart.value) {
    nextTick(() => { chart.renderChart(chart.chartTab.value, historyList.value) })
  }
}

function handleInitChart() {
  chart.initChart(historyList.value)
  nextTick(() => { chart.renderChart(chart.chartTab.value, historyList.value) })
}

function handleSwitchChartTab(modeName) {
  chart.switchChartTab(modeName, historyList.value)
}

function handleClearOldest() {
  if (confirm(`当前共有 ${historyList.value.length} 条记录。\n确定要清除【最早的 1000 条】数据吗？`)) {
    historyList.value = clearOldestRecords(historyList.value, 1000)
    toast.showToast('清理成功')
    if (chart.showChart.value) { handleInitChart() }
  }
}

function handleClearAll() {
  if (confirm('【严重警告】\n确定要清空【所有】历史记录吗？\n此操作不可恢复！')) {
    clearStorageHistory()
    historyList.value = []
    toast.showToast('所有记录已清空')
  }
}

function startCubicMode() {
  viewState.value = 'cubic'
  nextTick(() => { cubic.initThree() })
}

function quitCubicMode() {
  cubic.cleanup()
  viewState.value = 'home'
}

function handleUpdateSlice(config) {
  Object.assign(cubic.sliceConfig, config)
  cubic.updateSlicePlane()
}
</script>

<style scoped>
.page {
  width: 100%;
  height: 100vh;
  height: 100dvh; /* 动态视口高度，更好支持移动端 */
  color: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  max-width: 480px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  /* iOS 26 液态背景 */
  background: 
    radial-gradient(ellipse at 20% 20%, rgba(100, 180, 255, 0.35) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 30%, rgba(200, 150, 255, 0.3) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 80%, rgba(255, 180, 200, 0.25) 0%, transparent 50%),
    radial-gradient(ellipse at 20% 70%, rgba(150, 230, 200, 0.25) 0%, transparent 50%),
    linear-gradient(160deg, #e6f0fa 0%, #f0e8f6 40%, #faf0ec 70%, #e8f6f0 100%);
}
</style>

/**
 * 游戏状态管理
 * 使用 Vue 3 Composition API
 */

import { ref, computed, reactive } from 'vue'
import { GAME_MODES, getDynamicModeConfig } from '@/config/gameModes'
import { msToTimeStr, formatTime } from '@/utils/math'
import { getHistory, addRecord } from '@/utils/storage'

export function useGameState() {
  // ============================================================
  // 状态
  // ============================================================
  
  const currentModeKey = ref('train')
  const selectedDivisor = ref(0)
  
  // 题目相关
  const pool = ref([])
  const idx = ref(0)
  const current = ref(null)
  const input = ref('')
  
  // 计时相关
  const totalStartTs = ref(0)
  const qStartTs = ref(0)
  const totalMs = ref(0)
  const timer = ref(null)
  
  // 统计相关
  const trainWrong = ref(0)
  const trainSkip = ref(0)
  const curWrongTries = ref(0)
  const trainLog = ref([])
  const results = ref([])
  
  // ============================================================
  // 计算属性
  // ============================================================
  
  const activeConfig = computed(() => {
    if (currentModeKey.value === 'firstSpec') {
      return getDynamicModeConfig('firstSpec', { divisor: selectedDivisor.value })
    }
    return GAME_MODES[currentModeKey.value] || {}
  })
  
  const totalText = computed(() => msToTimeStr(totalMs.value))
  
  const progressText = computed(() => `${idx.value}/${pool.value.length}`)
  
  const qText = computed(() => {
    if (!current.value) return '—'
    return `${current.value.dividend}${current.value.symbol}${current.value.divisor}`
  })
  
  const isSmallFont = computed(() => {
    return activeConfig.value.isSmallFont || 
           currentModeKey.value === 'fourSum' || 
           currentModeKey.value === 'tripleMix'
  })
  
  const leftText = computed(() => {
    return currentModeKey.value === 'train' ? '跳过' : '重开'
  })
  
  // ============================================================
  // 方法
  // ============================================================
  
  function setMode(mode) {
    currentModeKey.value = mode
  }
  
  function setDivisor(d) {
    selectedDivisor.value = d
  }
  
  function startGame() {
    const config = activeConfig.value
    if (!config.gen) return false
    
    // 生成题目
    pool.value = config.gen(10, { divisor: selectedDivisor.value })
    
    // 重置状态
    idx.value = 0
    input.value = ''
    trainWrong.value = 0
    trainSkip.value = 0
    curWrongTries.value = 0
    trainLog.value = []
    results.value = []
    
    // 开始计时
    totalStartTs.value = Date.now()
    totalMs.value = 0
    
    // 设置定时器
    if (timer.value) clearInterval(timer.value)
    timer.value = setInterval(() => {
      totalMs.value = Date.now() - totalStartTs.value
    }, 100)
    
    return true
  }
  
  function nextQuestion() {
    if (idx.value >= pool.value.length) {
      return false // 没有更多题目
    }
    
    current.value = pool.value[idx.value]
    qStartTs.value = Date.now()
    input.value = ''
    curWrongTries.value = 0
    idx.value++
    
    return true
  }
  
  function pressDigit(d) {
    if (input.value.length >= 6) return
    input.value += String(d)
  }
  
  function clearInput() {
    input.value = ''
  }
  
  function backspace() {
    input.value = input.value.slice(0, -1)
  }
  
  function skipQuestion() {
    const cur = current.value
    const used = (Date.now() - qStartTs.value) / 1000
    
    trainLog.value.push({
      q: `${cur.dividend}${cur.symbol}${cur.divisor}`,
      usedStr: used.toFixed(1) + 's',
      wrong: curWrongTries.value,
      skipped: true
    })
    
    trainSkip.value++
    return nextQuestion()
  }
  
  function checkAnswer() {
    if (!input.value) return null
    
    const cur = current.value
    const config = activeConfig.value
    const n = parseFloat(input.value)
    const used = (Date.now() - qStartTs.value) / 1000
    
    let correct = false
    let realAnsDisplay = cur.ans
    
    // 检查答案
    if (config.check) {
      const checkResult = config.check(n, cur.ans)
      correct = checkResult.ok
      realAnsDisplay = checkResult.display
    } else {
      correct = parseInt(input.value) === cur.ans
    }
    
    return {
      correct,
      realAnsDisplay,
      usedTime: used,
      question: `${cur.dividend}${cur.symbol}${cur.divisor}`,
      yourAnswer: input.value
    }
  }
  
  function recordTrainResult(result) {
    if (result.correct) {
      trainLog.value.push({
        q: result.question,
        usedStr: result.usedTime.toFixed(1) + 's',
        wrong: curWrongTries.value,
        skipped: false
      })
    } else {
      trainWrong.value++
      curWrongTries.value++
      input.value = ''
    }
    return result.correct
  }
  
  function recordNormalResult(result) {
    results.value.push({
      q: result.question,
      ok: result.correct,
      yourAns: result.yourAnswer,
      realAns: result.realAnsDisplay,
      usedStr: result.usedTime.toFixed(1) + 's'
    })
  }
  
  function finishGame(historyList) {
    if (timer.value) {
      clearInterval(timer.value)
      timer.value = null
    }
    
    const totalSec = (Date.now() - totalStartTs.value) / 1000
    
    // 构建记录
    let summary = ''
    let detailLog = []
    
    if (currentModeKey.value === 'train') {
      summary = `错${trainWrong.value}/跳${trainSkip.value}`
      detailLog = trainLog.value
    } else {
      const correctCount = results.value.filter(x => x.ok).length
      const totalCount = results.value.length
      summary = `正确率 ${Math.round((correctCount / totalCount) * 100)}%`
      detailLog = results.value
    }
    
    // 获取模式名称
    const modeName = currentModeKey.value === 'firstSpec'
      ? `商首位(除${selectedDivisor.value})`
      : (GAME_MODES[currentModeKey.value]?.name || '未知模式')
    
    const record = {
      ts: Date.now(),
      timeStr: formatTime(Date.now()),
      mode: currentModeKey.value,
      modeName,
      duration: totalSec.toFixed(1) + 's',
      summary,
      detail: detailLog
    }
    
    // 保存记录
    const newHistory = addRecord(record, historyList)
    
    return {
      totalSec,
      summary,
      detailLog,
      newHistory
    }
  }
  
  function stopTimer() {
    if (timer.value) {
      clearInterval(timer.value)
      timer.value = null
    }
  }
  
  function getResultMeta(totalSec) {
    if (currentModeKey.value === 'train') {
      return `用时：${totalSec.toFixed(1)}s｜错误：${trainWrong.value}｜跳过：${trainSkip.value}`
    } else {
      const correctCount = results.value.filter(x => x.ok).length
      const totalCount = results.value.length
      return `正确：${correctCount}/${totalCount}｜总用时：${totalSec.toFixed(1)}s`
    }
  }
  
  // ============================================================
  // 返回
  // ============================================================
  
  return {
    // 状态
    currentModeKey,
    selectedDivisor,
    pool,
    idx,
    current,
    input,
    trainWrong,
    trainSkip,
    trainLog,
    results,
    
    // 计算属性
    activeConfig,
    totalText,
    progressText,
    qText,
    isSmallFont,
    leftText,
    
    // 方法
    setMode,
    setDivisor,
    startGame,
    nextQuestion,
    pressDigit,
    clearInput,
    backspace,
    skipQuestion,
    checkAnswer,
    recordTrainResult,
    recordNormalResult,
    finishGame,
    stopTimer,
    getResultMeta
  }
}

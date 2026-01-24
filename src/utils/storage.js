/**
 * 本地存储相关工具
 */

const STORAGE_KEY = 'calc_history'
const MAX_RECORDS = 5000

/**
 * 获取历史记录
 */
export function getHistory() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (e) {
    console.error('读取历史记录失败:', e)
    return []
  }
}

/**
 * 保存历史记录
 */
export function saveHistory(history) {
  try {
    // 限制最大记录数
    const trimmed = history.slice(0, MAX_RECORDS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
    return trimmed
  } catch (e) {
    console.error('保存历史记录失败:', e)
    return history
  }
}

/**
 * 添加一条记录
 */
export function addRecord(record, currentHistory) {
  const history = [record, ...currentHistory]
  return saveHistory(history)
}

/**
 * 清空历史记录
 */
export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * 清理最早的N条记录
 */
export function clearOldestRecords(currentHistory, count = 1000) {
  const keepCount = Math.max(0, currentHistory.length - count)
  const newHistory = currentHistory.slice(0, keepCount)
  return saveHistory(newHistory)
}

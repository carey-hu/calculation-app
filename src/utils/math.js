/**
 * 数学相关工具函数
 */

/**
 * 随机整数 [min, max]
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * 洗牌算法
 */
export function shuffle(arr) {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * 构建大九九题库
 */
export function buildBasePool() {
  const arr = []
  for (let d = 11; d <= 19; d++) {
    for (let q = 1; q <= 9; q++) {
      arr.push({ dividend: d * q, divisor: d, ans: q, symbol: '÷' })
    }
  }
  return arr
}

/**
 * 毫秒转 MM:SS.S 格式
 */
export function msToTimeStr(ms) {
  const totalSec = ms / 1000
  const m = Math.floor(totalSec / 60)
  const s = (totalSec % 60).toFixed(1)
  return `${m}:${s < 10 ? '0' + s : s}`
}

/**
 * 时间戳格式化
 */
export function formatTime(ts) {
  const date = new Date(ts)
  const m = date.getMonth() + 1
  const d = date.getDate()
  const h = date.getHours()
  const min = date.getMinutes()
  const pad = n => (n < 10 ? '0' + n : n)
  return `${m}/${d} ${pad(h)}:${pad(min)}`
}

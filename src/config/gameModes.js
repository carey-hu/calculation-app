/**
 * 游戏模式配置
 * 添加新模式只需在这里配置即可
 */

import { shuffle, buildBasePool, randomInt } from '@/utils/math'

// ============================================================
// 模式定义
// ============================================================

export const GAME_MODES = {
  // 大九九/除法
  train: {
    name: '训练',
    title: '基础训练完成！',
    hintNote: '精确到整数',
    questionCount: 81,
    gen: () => shuffle(buildBasePool())
  },

  speed: {
    name: '竞速',
    title: '竞速完成！',
    hintNote: '精确到整数',
    questionCount: 10,
    gen: () => shuffle(buildBasePool()).slice(0, 10)
  },

  first: {
    name: '首位(随机)',
    title: '商首位完成！',
    hintNote: '目标：输入商的第一位数字',
    gen: (n) => {
      const pool = []
      for (let i = 0; i < n; i++) {
        const dr = randomInt(11, 19)
        const dd = randomInt(100, 999)
        const fd = parseInt(String(Math.floor(dd / dr))[0], 10)
        pool.push({ dividend: dd, divisor: dr, ans: fd, symbol: '÷' })
      }
      return pool
    }
  },

  firstSpec: {
    name: '商首位专项',
    title: '商首位专项完成！',
    isDynamic: true, // 标记为动态模式，需要额外参数
    gen: (n, { divisor = 12 }) => {
      const pool = []
      for (let i = 0; i < n; i++) {
        const dd = randomInt(divisor, 999)
        const fq = Math.floor(dd / divisor)
        const fd = parseInt(String(fq)[0], 10)
        pool.push({ dividend: dd, divisor, ans: fd, symbol: '÷' })
      }
      return pool
    }
  },

  // 一位数专项
  plus: {
    name: '进位加',
    title: '一位数进位加完成！',
    hintNote: '只填个位尾数',
    gen: (n) => {
      const pool = []
      for (let i = 0; i < n; i++) {
        let a, b
        do {
          a = randomInt(1, 9)
          b = randomInt(1, 9)
        } while (a + b < 10)
        pool.push({ dividend: a, divisor: b, ans: (a + b) % 10, symbol: '+' })
      }
      return pool
    }
  },

  minus: {
    name: '退位减',
    title: '一位数退位减完成！',
    hintNote: '只填个位尾数',
    gen: (n) => {
      const pool = []
      for (let i = 0; i < n; i++) {
        let a, b
        do {
          a = randomInt(1, 9)
          b = randomInt(1, 9)
        } while (a >= b)
        pool.push({ dividend: a, divisor: b, ans: 10 + a - b, symbol: '-' })
      }
      return pool
    }
  },

  // 两位数专项
  doublePlus: {
    name: '双进位加',
    title: '双进位加完成！',
    hintNote: '个位十位均需进位',
    gen: (n) => {
      const pool = []
      for (let i = 0; i < n; i++) {
        let a, b, a1, a2, b1, b2
        do {
          a = randomInt(10, 99)
          b = randomInt(10, 99)
          a1 = Math.floor(a / 10)
          a2 = a % 10
          b1 = Math.floor(b / 10)
          b2 = b % 10
        } while (a2 + b2 < 10 || a1 + b1 < 10)
        pool.push({ dividend: a, divisor: b, ans: a + b, symbol: '+' })
      }
      return pool
    }
  },

  doubleMinus: {
    name: '双退位减',
    title: '双退位减完成！',
    hintNote: '个位退，十位不退',
    gen: (n) => {
      const pool = []
      for (let i = 0; i < n; i++) {
        let a, b, a1, a2, b1, b2
        do {
          a = randomInt(10, 99)
          b = randomInt(10, 99)
          a1 = Math.floor(a / 10)
          a2 = a % 10
          b1 = Math.floor(b / 10)
          b2 = b % 10
        } while (!(a2 < b2 && a1 - 1 >= b1))
        pool.push({ dividend: a, divisor: b, ans: a - b, symbol: '-' })
      }
      return pool
    }
  },

  fourSum: {
    name: '四数相加',
    title: '四数相加完成！',
    hintNote: '计算准确和',
    isSmallFont: true,
    gen: (n) => {
      const pool = []
      for (let i = 0; i < n; i++) {
        const a = randomInt(10, 99)
        const b = randomInt(10, 99)
        const c = randomInt(10, 99)
        const d = randomInt(10, 99)
        pool.push({ dividend: `${a}+${b}+${c}`, divisor: d, ans: a + b + c + d, symbol: '+' })
      }
      return pool
    }
  },

  // 三位数专项
  triplePlus: {
    name: '三进位加',
    title: '三进位加完成！',
    hintNote: '个位十位百位均需进位',
    gen: (n) => {
      const pool = []
      for (let i = 0; i < n; i++) {
        let a, b, a1, a2, a3, b1, b2, b3
        do {
          a = randomInt(100, 999)
          b = randomInt(100, 999)
          a1 = Math.floor(a / 100)
          a2 = Math.floor((a % 100) / 10)
          a3 = a % 10
          b1 = Math.floor(b / 100)
          b2 = Math.floor((b % 100) / 10)
          b3 = b % 10
        } while (a3 + b3 < 10 || a2 + b2 < 10 || a1 + b1 < 10)
        pool.push({ dividend: a, divisor: b, ans: a + b, symbol: '+' })
      }
      return pool
    }
  },

  tripleMinus: {
    name: '三退位减',
    title: '三退位减完成！',
    hintNote: '个十退，百不退',
    gen: (n) => {
      const pool = []
      for (let i = 0; i < n; i++) {
        let a, b, a1, a2, a3, b1, b2, b3
        do {
          a = randomInt(100, 999)
          b = randomInt(100, 999)
          a1 = Math.floor(a / 100)
          a2 = Math.floor((a % 100) / 10)
          a3 = a % 10
          b1 = Math.floor(b / 100)
          b2 = Math.floor((b % 100) / 10)
          b3 = b % 10
        } while (!(a3 < b3 && (a2 - 1) < b2 && (a1 - 1) >= b1))
        pool.push({ dividend: a, divisor: b, ans: a - b, symbol: '-' })
      }
      return pool
    }
  },

  tripleAnyPlus: {
    name: '任意加',
    title: '任意三数加完成！',
    hintNote: '任意三位数加法',
    gen: (n) => {
      const pool = []
      for (let i = 0; i < n; i++) {
        const a = randomInt(100, 999)
        const b = randomInt(100, 999)
        pool.push({ dividend: a, divisor: b, ans: a + b, symbol: '+' })
      }
      return pool
    }
  },

  tripleAnyMinus: {
    name: '任意减',
    title: '任意三数减完成！',
    hintNote: '任意三位数减法',
    gen: (n) => {
      const pool = []
      for (let i = 0; i < n; i++) {
        let a = randomInt(100, 999)
        let b = randomInt(100, 999)
        if (a < b) [a, b] = [b, a]
        pool.push({ dividend: a, divisor: b, ans: a - b, symbol: '-' })
      }
      return pool
    }
  },

  tripleMix: {
    name: '加减混合',
    title: '三数加减混合完成！',
    hintNote: '三数加减混合 (结果为正)',
    isSmallFont: true,
    gen: (n) => {
      const pool = []
      for (let i = 0; i < n; i++) {
        let a, b, c, op1, op2, ans
        do {
          a = randomInt(100, 999)
          b = randomInt(100, 999)
          c = randomInt(100, 999)
          op1 = Math.random() > 0.5 ? '+' : '-'
          op2 = Math.random() > 0.5 ? '+' : '-'
          const step1 = op1 === '+' ? a + b : a - b
          ans = op2 === '+' ? step1 + c : step1 - c
        } while (ans < 0)
        pool.push({ dividend: `${a}${op1}${b}`, divisor: c, ans, symbol: op2 })
      }
      return pool
    }
  },

  tripleMult: {
    name: '三乘一',
    title: '三乘一完成！',
    hintNote: '计算准确积',
    gen: (n) => {
      const pool = []
      for (let i = 0; i < n; i++) {
        const a = randomInt(100, 999)
        const b = randomInt(2, 9)
        pool.push({ dividend: a, divisor: b, ans: a * b, symbol: '×' })
      }
      return pool
    }
  },

  tripleDiv: {
    name: '三除一',
    title: '三除一完成！',
    hintNote: '若为小数，填相邻整数均对',
    check: (v, t) => {
      if (Number.isInteger(t)) {
        return { ok: v === t, display: t }
      }
      const f = Math.floor(t)
      const c = Math.ceil(t)
      return { ok: v === f || v === c, display: `${f}或${c} (${t.toFixed(2)})` }
    },
    gen: (n) => {
      const pool = []
      for (let i = 0; i < n; i++) {
        const a = randomInt(100, 999)
        const b = randomInt(2, 9)
        pool.push({ dividend: a, divisor: b, ans: a / b, symbol: '÷' })
      }
      return pool
    }
  },

  // 五除三专项
  divSpecA: {
    name: '反向放缩',
    title: '反向放缩完成！',
    hintNote: '除数111-199 (误差3%内)',
    check: (v, t) => {
      const r = Math.abs(v - t) / t
      return { ok: r <= 0.03, display: Math.round(t) }
    },
    gen: (n) => {
      const pool = []
      for (let i = 0; i < n; i++) {
        const dr = randomInt(111, 199)
        const dd = randomInt(10000, 99999)
        pool.push({ dividend: dd, divisor: dr, ans: dd / dr, symbol: '÷' })
      }
      return pool
    }
  },

  divSpecB: {
    name: '平移法',
    title: '平移法完成！',
    hintNote: '商90-111 (误差3%内)',
    check: (v, t) => {
      const r = Math.abs(v - t) / t
      return { ok: r <= 0.03, display: Math.round(t) }
    },
    gen: (n) => {
      const pool = []
      let c = 0
      while (c < n) {
        const dr = randomInt(100, 999)
        const tq = randomInt(90, 111)
        const dd = dr * tq + randomInt(0, dr - 1)
        if (dd >= 10000 && dd <= 99999) {
          pool.push({ dividend: dd, divisor: dr, ans: dd / dr, symbol: '÷' })
          c++
        }
      }
      return pool
    }
  },

  divSpecC: {
    name: '任意五除三',
    title: '任意五除三完成！',
    hintNote: '五位数除以三位数 (误差3%内)',
    check: (v, t) => {
      const r = Math.abs(v - t) / t
      return { ok: r <= 0.03, display: Math.round(t) }
    },
    gen: (n) => {
      const pool = []
      for (let i = 0; i < n; i++) {
        const dr = randomInt(100, 999)
        const dd = randomInt(10000, 99999)
        pool.push({ dividend: dd, divisor: dr, ans: dd / dr, symbol: '÷' })
      }
      return pool
    }
  }
}

// ============================================================
// 模式分组配置
// ============================================================

export const MODE_GROUPS = {
  basic: {
    label: '大九九/除法',
    modes: ['train', 'speed', 'first']
  },
  divSelect: {
    label: '商首位专项',
    modes: [],
    hasCustomEntry: true // 标记有自定义入口
  },
  single: {
    label: '一位数专项 (仅填尾数)',
    modes: ['plus', 'minus']
  },
  double: {
    label: '两位数专项 (完整答案)',
    modes: ['doublePlus', 'doubleMinus', 'fourSum']
  },
  triple: {
    label: '三位数专项 (完整答案)',
    modes: ['triplePlus', 'tripleMinus', 'tripleAnyPlus', 'tripleAnyMinus', 'tripleMix', 'tripleMult', 'tripleDiv']
  },
  spec: {
    label: '五除三专项 (允许3%误差)',
    modes: ['divSpecA', 'divSpecB', 'divSpecC']
  }
}

// ============================================================
// 除数列表（用于商首位专项）
// ============================================================

export const DIVISOR_LIST = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]

// ============================================================
// 辅助函数
// ============================================================

/**
 * 获取模式配置
 */
export function getModeConfig(key) {
  return GAME_MODES[key] || { name: key }
}

/**
 * 获取动态模式的完整配置
 */
export function getDynamicModeConfig(key, params = {}) {
  const base = GAME_MODES[key]
  if (!base) return { name: key }

  if (key === 'firstSpec' && params.divisor) {
    return {
      ...base,
      name: `商首位(除${params.divisor})`,
      title: `商首位(除${params.divisor})完成！`,
      hintNote: `除数${params.divisor}专项：只填商首位`
    }
  }

  return base
}

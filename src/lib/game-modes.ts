import type { Question, CheckResult, DecompAddAnswer, GameModeConfig, ModeGroup } from '../types';
import { shuffle, randInt, rejectSample, genN } from './random';

type Ans = Question['ans'];

interface Digits3 {
  hundreds: number;
  tens: number;
  units: number;
}

const buildBasePool = (): Question[] => {
  const pool: Question[] = [];
  for (let d = 11; d <= 19; d++) {
    for (let q = 1; q <= 9; q++) {
      pool.push({ dividend: d * q, divisor: d, ans: q, symbol: '÷' });
    }
  }
  return pool;
};

const digits3 = (n: number): Digits3 => ({
  hundreds: Math.floor(n / 100),
  tens: Math.floor((n % 100) / 10),
  units: n % 10,
});

const estimateCheck = (v: number, t: Ans): CheckResult => {
  const num = t as number;
  const r = Math.abs(v - num) / num;
  return { ok: r <= 0.03, display: String(Math.round(num)) };
};

export const GAME_MODES: Record<string, GameModeConfig> = {
  train: {
    name: '训练',
    title: '基础训练完成！',
    hintNote: '精确到整数',
    gen: () => shuffle(buildBasePool()),
  },

  speed: {
    name: '竞速',
    title: '竞速完成！',
    hintNote: '精确到整数',
    gen: () => shuffle(buildBasePool()).slice(0, 10),
  },

  first: {
    name: '首位(随机)',
    title: '商首位完成！',
    hintNote: '目标：输入商的第一位数字',
    gen: (n) => genN(n, (): Question => {
      const divisor = randInt(11, 19);
      const dividend = randInt(100, 999);
      const firstDigit = parseInt(String(Math.floor(dividend / divisor))[0], 10);
      return { dividend, divisor, ans: firstDigit, symbol: '÷' };
    }),
  },

  firstSpec: {
    name: '商首位专项',
    title: '商首位专项完成！',
    gen: (n, ex) => {
      const d = ex?.divisor ?? 12;
      return genN(n, (): Question => {
        const dividend = randInt(d, 999);
        const firstQ = Math.floor(dividend / d);
        const firstDigit = parseInt(String(firstQ)[0], 10);
        return { dividend, divisor: d, ans: firstDigit, symbol: '÷' };
      });
    },
  },

  plus: {
    name: '进位加',
    title: '一位数进位加完成！',
    hintNote: '只填个位尾数',
    gen: (n) => genN(n, (): Question => {
      const { a, b } = rejectSample(
        () => ({ a: randInt(1, 9), b: randInt(1, 9) }),
        ({ a, b }) => a + b >= 10,
      );
      return { dividend: a, divisor: b, ans: (a + b) % 10, symbol: '+' };
    }),
  },

  minus: {
    name: '退位减',
    title: '一位数退位减完成！',
    hintNote: '只填个位尾数',
    gen: (n) => genN(n, (): Question => {
      const { a, b } = rejectSample(
        () => ({ a: randInt(1, 9), b: randInt(1, 9) }),
        ({ a, b }) => a < b,
      );
      return { dividend: a, divisor: b, ans: 10 + a - b, symbol: '-' };
    }),
  },

  fourSingleSum: {
    name: '四数连加',
    title: '四数连加(一位)完成！',
    hintNote: '计算准确和',
    isSmallFont: true,
    gen: (n) => genN(n, (): Question => {
      const a = randInt(1, 9);
      const b = randInt(1, 9);
      const c = randInt(1, 9);
      const d = randInt(1, 9);
      return { dividend: `${a}+${b}+${c}`, divisor: d, ans: a + b + c + d, symbol: '+' };
    }),
  },

  doublePlus: {
    name: '双进位加',
    title: '双进位加完成！',
    hintNote: '个位十位均需进位',
    gen: (n) => genN(n, (): Question => {
      const { a, b } = rejectSample(
        () => ({ a: randInt(10, 99), b: randInt(10, 99) }),
        ({ a, b }) => (a % 10) + (b % 10) >= 10 && Math.floor(a / 10) + Math.floor(b / 10) >= 10,
      );
      return { dividend: a, divisor: b, ans: a + b, symbol: '+' };
    }),
  },

  doubleMinus: {
    name: '双退位减',
    title: '双退位减完成！',
    hintNote: '个位退，十位不退',
    gen: (n) => genN(n, (): Question => {
      const { a, b } = rejectSample(
        () => ({ a: randInt(10, 99), b: randInt(10, 99) }),
        ({ a, b }) => {
          const a1 = Math.floor(a / 10);
          const a2 = a % 10;
          const b1 = Math.floor(b / 10);
          const b2 = b % 10;
          return a2 < b2 && a1 - 1 >= b1;
        },
      );
      return { dividend: a, divisor: b, ans: a - b, symbol: '-' };
    }),
  },

  fourSum: {
    name: '四数相加',
    title: '四数相加完成！',
    hintNote: '计算准确和',
    isSmallFont: true,
    gen: (n) => genN(n, (): Question => {
      const a = randInt(10, 99);
      const b = randInt(10, 99);
      const c = randInt(10, 99);
      const d = randInt(10, 99);
      return { dividend: `${a}+${b}+${c}`, divisor: d, ans: a + b + c + d, symbol: '+' };
    }),
  },

  decompAdd: {
    name: '拆解连加',
    title: '拆解连加完成！',
    hintNote: '依次输入: 十位之和、个位之和、总和',
    isSmallFont: true,
    check: (v, t, inputStr, inputArray): CheckResult => {
      const target = t as DecompAddAnswer;
      if (!inputArray || inputArray.length < 3) {
        return { ok: false, display: `十位:${target.tens} 个位:${target.units} 总:${target.total}` };
      }
      const ok = parseInt(inputArray[0], 10) === target.tens
        && parseInt(inputArray[1], 10) === target.units
        && parseInt(inputArray[2], 10) === target.total;
      return { ok, display: `十:${target.tens} 个:${target.units} 总:${target.total}` };
    },
    gen: (n) => genN(n, (): Question => {
      const a = randInt(10, 99);
      const b = randInt(10, 99);
      const c = randInt(10, 99);
      const d = randInt(10, 99);
      const tensSum = (Math.floor(a / 10) + Math.floor(b / 10) + Math.floor(c / 10) + Math.floor(d / 10)) * 10;
      const unitsSum = (a % 10) + (b % 10) + (c % 10) + (d % 10);
      const total = a + b + c + d;
      return {
        dividend: `${a}+${b}+${c}+${d}`,
        divisor: '',
        ans: { tens: tensSum, units: unitsSum, total },
        symbol: '',
      };
    }),
  },

  triplePlus: {
    name: '三进位加',
    title: '三进位加完成！',
    hintNote: '个位十位百位均需进位',
    gen: (n) => genN(n, (): Question => {
      const { a, b } = rejectSample(
        () => ({ a: randInt(100, 999), b: randInt(100, 999) }),
        ({ a, b }) => {
          const A = digits3(a);
          const B = digits3(b);
          return A.units + B.units >= 10
            && A.tens + B.tens >= 10
            && A.hundreds + B.hundreds >= 10;
        },
      );
      return { dividend: a, divisor: b, ans: a + b, symbol: '+' };
    }),
  },

  tripleMinus: {
    name: '三退位减',
    title: '三退位减完成！',
    hintNote: '个十退，百不退',
    gen: (n) => genN(n, (): Question => {
      const { a, b } = rejectSample(
        () => ({ a: randInt(100, 999), b: randInt(100, 999) }),
        ({ a, b }) => {
          const A = digits3(a);
          const B = digits3(b);
          return A.units < B.units
            && (A.tens - 1) < B.tens
            && (A.hundreds - 1) >= B.hundreds;
        },
      );
      return { dividend: a, divisor: b, ans: a - b, symbol: '-' };
    }),
  },

  tripleAnyPlus: {
    name: '任意加',
    title: '任意三数加完成！',
    hintNote: '任意三位数加法',
    gen: (n) => genN(n, (): Question => {
      const a = randInt(100, 999);
      const b = randInt(100, 999);
      return { dividend: a, divisor: b, ans: a + b, symbol: '+' };
    }),
  },

  tripleAnyMinus: {
    name: '任意减',
    title: '任意三数减完成！',
    hintNote: '任意三位数减法',
    gen: (n) => genN(n, (): Question => {
      let a = randInt(100, 999);
      let b = randInt(100, 999);
      if (a < b) [a, b] = [b, a];
      return { dividend: a, divisor: b, ans: a - b, symbol: '-' };
    }),
  },

  tripleMix: {
    name: '加减混合',
    title: '三数加减混合完成！',
    hintNote: '三数加减混合 (结果为正)',
    isSmallFont: true,
    gen: (n) => genN(n, (): Question => {
      while (true) {
        const a = randInt(100, 999);
        const b = randInt(100, 999);
        const c = randInt(100, 999);
        const op1 = Math.random() > 0.5 ? '+' : '-';
        const op2 = Math.random() > 0.5 ? '+' : '-';
        const step1 = op1 === '+' ? a + b : a - b;
        const ans = op2 === '+' ? step1 + c : step1 - c;
        if (ans >= 0) {
          return { dividend: `${a}${op1}${b}`, divisor: c, ans, symbol: op2 };
        }
      }
    }),
  },

  tripleMult: {
    name: '三乘一',
    title: '三乘一完成！',
    hintNote: '计算准确积',
    gen: (n) => genN(n, (): Question => {
      const a = randInt(100, 999);
      const b = randInt(2, 9);
      return { dividend: a, divisor: b, ans: a * b, symbol: '×' };
    }),
  },

  tripleDiv: {
    name: '三除一',
    title: '三除一完成！',
    hintNote: '若为小数，填相邻整数均对',
    check: (v: number, t: Ans): CheckResult => {
      const ansNum = t as number;
      if (Number.isInteger(ansNum)) return { ok: v === ansNum, display: String(ansNum) };
      const f = Math.floor(ansNum);
      const c = Math.ceil(ansNum);
      return { ok: v === f || v === c, display: `${f}或${c} (${ansNum.toFixed(2)})` };
    },
    gen: (n) => genN(n, (): Question => {
      const a = randInt(100, 999);
      const b = randInt(2, 9);
      return { dividend: a, divisor: b, ans: a / b, symbol: '÷' };
    }),
  },

  carryJudge: {
    name: '判进位',
    title: '判进位完成！',
    hintNote: '百位、十位是否接收低位进位(1/0)',
    check: (v, t, inputStr, inputArray): CheckResult => {
      const target = t as string;
      if (!inputArray || inputArray.length < 2) {
        return { ok: false, display: target.replace(',', ' ') + ' 0' };
      }
      return { ok: inputArray.join(',') === target, display: target.replace(',', ' ') + ' 0' };
    },
    gen: (n) => genN(n, (): Question => {
      const a = randInt(100, 999);
      const b = randInt(100, 999);
      const c10 = (a % 10) + (b % 10) >= 10 ? '1' : '0';
      const c100 = (a % 100) + (b % 100) >= 100 ? '1' : '0';
      return { dividend: a, divisor: b, ans: `${c100},${c10}`, symbol: '+' };
    }),
  },

  borrowJudge: {
    name: '判退位',
    title: '判退位完成！',
    hintNote: '百位、十位是否向低位提供借位(-1/0)',
    check: (v, t, inputStr, inputArray): CheckResult => {
      const target = t as string;
      if (!inputArray || inputArray.length < 2) {
        return { ok: false, display: target.replace(',', ' ') + ' 0' };
      }
      return { ok: inputArray.join(',') === target, display: target.replace(',', ' ') + ' 0' };
    },
    gen: (n) => genN(n, (): Question => {
      let a = randInt(100, 999);
      let b = randInt(100, 999);
      if (a < b) [a, b] = [b, a];
      const c10 = a % 10 < b % 10 ? '-1' : '0';
      const c100 = a % 100 < b % 100 ? '-1' : '0';
      return { dividend: a, divisor: b, ans: `${c100},${c10}`, symbol: '-' };
    }),
  },

  digitDetermine: {
    name: '确本位',
    title: '确本位完成！',
    hintNote: '依次输入:千/百位(1~2位), 十位, 个位',
    check: (v, t, inputStr): CheckResult => {
      if (!inputStr) return { ok: false, display: String(t) };
      return { ok: parseInt(inputStr, 10) === (t as number), display: String(t) };
    },
    gen: (n) => genN(n, (): Question => {
      const a = randInt(100, 999);
      const b = randInt(100, 999);
      return { dividend: a, divisor: b, ans: a + b, symbol: '+' };
    }),
  },

  sumTruncated: {
    name: '和去尾',
    title: '三位数和去尾完成！',
    hintNote: '计算和并去掉个位数',
    gen: (n) => genN(n, (): Question => {
      const a = randInt(100, 999);
      const b = randInt(100, 999);
      return { dividend: a, divisor: b, ans: Math.floor((a + b) / 10), symbol: '+' };
    }),
  },

  diffTruncated: {
    name: '差去尾',
    title: '三位数差去尾完成！',
    hintNote: '计算差并去掉个位数',
    gen: (n) => genN(n, (): Question => {
      let a = randInt(100, 999);
      let b = randInt(100, 999);
      if (a < b) [a, b] = [b, a];
      return { dividend: a, divisor: b, ans: Math.floor((a - b) / 10), symbol: '-' };
    }),
  },

  divSpecA: {
    name: '反向放缩',
    title: '反向放缩完成！',
    hintNote: '除数111-199 (误差3%内)',
    check: estimateCheck,
    gen: (n) => genN(n, (): Question => {
      const divisor = randInt(111, 199);
      const dividend = randInt(10000, 99999);
      return { dividend, divisor, ans: dividend / divisor, symbol: '÷' };
    }),
  },

  divSpecB: {
    name: '平移法',
    title: '平移法完成！',
    hintNote: '商90-111 (误差3%内)',
    check: estimateCheck,
    gen: (n) => {
      const pool: Question[] = [];
      while (pool.length < n) {
        const divisor = randInt(100, 999);
        const targetQ = randInt(90, 111);
        const dividend = divisor * targetQ + Math.floor(Math.random() * divisor);
        if (dividend >= 10000 && dividend <= 99999) {
          pool.push({ dividend, divisor, ans: dividend / divisor, symbol: '÷' });
        }
      }
      return pool;
    },
  },

  divSpecC: {
    name: '任意五除三',
    title: '任意五除三完成！',
    hintNote: '五位数除以三位数 (误差3%内)',
    check: estimateCheck,
    gen: (n) => genN(n, (): Question => {
      const divisor = randInt(100, 999);
      const dividend = randInt(10000, 99999);
      return { dividend, divisor, ans: dividend / divisor, symbol: '÷' };
    }),
  },

  divScale: {
    name: '放缩被除数',
    title: '放缩被除数完成！',
    hintNote: '估算并连续输入三位数和一位数',
    check: (v, t, inputStr): CheckResult => {
      const target = t as number;
      if (!inputStr || inputStr.length < 4) {
        return { ok: false, display: '需填满三位数和一位数', exactAns: target.toFixed(2), errorRate: '格式错' };
      }
      const a = parseInt(inputStr.slice(0, 3), 10);
      const b = parseInt(inputStr.slice(3, 4), 10);
      if (b === 0) {
        return { ok: false, display: '除数不能为0', exactAns: target.toFixed(2), errorRate: '无效' };
      }
      const userVal = a / b;
      const ratio = userVal / target;
      const p10 = Math.round(Math.log10(ratio));
      const adjustedExact = target * Math.pow(10, p10);
      const r = Math.abs(userVal - adjustedExact) / adjustedExact;
      const exactDividend = (b * adjustedExact).toFixed(1);
      return {
        ok: r <= 0.03,
        display: target.toFixed(2),
        exactAns: target.toFixed(2),
        exactDividend,
        errorRate: (r * 100).toFixed(2) + '%',
      };
    },
    gen: (n) => genN(n, (): Question => {
      const divisor = randInt(201, 999);
      const dividend = randInt(10000, 99999);
      return { dividend, divisor, ans: dividend / divisor, symbol: '÷' };
    }),
  },
};

export const MODE_GROUPS: Record<string, ModeGroup> = {
  basic: { label: '大九九/除法', modes: ['train', 'speed', 'first'] },
  divSelect: { label: '商首位专项', modes: [] },
  single: { label: '一位数专项', modes: ['plus', 'minus', 'fourSingleSum'] },
  double: { label: '两位数专项 (完整答案)', modes: ['doublePlus', 'doubleMinus', 'fourSum', 'decompAdd'] },
  triple: {
    label: '三位数专项 (完整答案)',
    modes: [
      'carryJudge', 'borrowJudge', 'digitDetermine',
      'triplePlus', 'tripleMinus', 'tripleAnyPlus', 'tripleAnyMinus',
      'tripleMix', 'tripleMult', 'tripleDiv',
      'sumTruncated', 'diffTruncated',
    ],
  },
  spec: { label: '五除三专项 (允许3%误差)', modes: ['divSpecA', 'divSpecB', 'divSpecC', 'divScale'] },
};

export const DIVISOR_LIST = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

export const ESTIMATE_MODES = ['tripleDiv', 'divSpecA', 'divSpecB', 'divSpecC'];

export const getModeConfig = (key: string): GameModeConfig =>
  GAME_MODES[key] || { name: key };

export const resolveActiveConfig = (
  modeKey: string,
  selectedDivisor: number,
): GameModeConfig => {
  if (modeKey === 'firstSpec') {
    return {
      name: `商首位(除${selectedDivisor})`,
      title: `商首位(除${selectedDivisor})完成！`,
      hintNote: `除数${selectedDivisor}专项：只填商首位`,
      gen: GAME_MODES.firstSpec.gen,
    };
  }
  return GAME_MODES[modeKey] || {};
};

export const getModeName = (modeKey: string, selectedDivisor: number): string => {
  if (modeKey === 'firstSpec') return `商首位(除${selectedDivisor})`;
  return GAME_MODES[modeKey]?.name || '未知模式';
};

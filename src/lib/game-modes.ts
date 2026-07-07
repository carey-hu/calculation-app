import type { Question, CheckResult, DecompAddAnswer, PairAnswer, GameModeConfig, ModeGroup } from '../types';
import { shuffle, randInt, rejectSample, genN } from './random';

type Ans = Question['ans'];

interface Digits3 {
  hundreds: number;
  tens: number;
  units: number;
}

interface Fraction {
  n: number;
  d: number;
}

const VAR_NAMES = ['甲', '乙', '丙', '丁'];

const gcd = (a: number, b: number): number => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x || 1;
};

const simplifyIntRatio = (values: number[]): number[] => {
  const g = values.reduce((acc, value) => gcd(acc, value));
  return values.map((value) => value / g);
};

const fraction = (n: number, d: number): Fraction => {
  if (d === 0) return { n: 0, d: 1 };
  const sign = d < 0 ? -1 : 1;
  const g = gcd(n, d);
  return { n: (n / g) * sign, d: Math.abs(d / g) };
};

const fractionSub = (a: Fraction, b: Fraction): Fraction =>
  fraction(a.n * b.d - b.n * a.d, a.d * b.d);

const canUsePercent = (f: Fraction): boolean => {
  const percent = (f.n * 100) / f.d;
  return Number.isInteger(percent) || Number.isInteger(percent * 10);
};

const formatPercent = (f: Fraction): string => {
  const percent = (f.n * 100) / f.d;
  return `${Number.isInteger(percent) ? percent : percent.toFixed(1)}%`;
};

const formatRatioValue = (f: Fraction, preferPercent = Math.random() < 0.45): string => {
  if (preferPercent && canUsePercent(f)) return formatPercent(f);
  if (f.d === 1) return `${f.n * 100}%`;
  return `${f.n}/${f.d}`;
};

const joinVars = (indices: number[]): string => indices.map((index) => VAR_NAMES[index]).join('、');

const relationIs = (left: number[], right: number[], leftValue: number, rightValue: number): string => {
  const leftText = left.length === 1 ? VAR_NAMES[left[0]] : `${joinVars(left)}的和`;
  const rightText = right.length === 1 ? VAR_NAMES[right[0]] : `${joinVars(right)}的和`;
  return `${leftText}是${rightText}的${formatRatioValue(fraction(leftValue, rightValue))}`;
};

const relationDelta = (left: number[], right: number[], leftValue: number, rightValue: number): string => {
  const leftText = left.length === 1 ? VAR_NAMES[left[0]] : `${joinVars(left)}的和`;
  const rightText = right.length === 1 ? VAR_NAMES[right[0]] : `${joinVars(right)}的和`;
  if (leftValue === rightValue) return `${leftText}和${rightText}相等`;
  if (leftValue > rightValue) {
    const delta = fractionSub(fraction(leftValue, rightValue), fraction(1, 1));
    return `${leftText}比${rightText}多${formatRatioValue(delta)}`;
  }
  const delta = fractionSub(fraction(1, 1), fraction(leftValue, rightValue));
  return `${leftText}比${rightText}少${formatRatioValue(delta)}`;
};

const sumValues = (values: number[], indices: number[]): number =>
  indices.reduce((sum, index) => sum + values[index], 0);

const buildRelation = (values: number[], left: number[], right: number[], preferDelta = Math.random() < 0.35): string => {
  const leftValue = sumValues(values, left);
  const rightValue = sumValues(values, right);
  if (preferDelta && leftValue !== rightValue) return relationDelta(left, right, leftValue, rightValue);
  return relationIs(left, right, leftValue, rightValue);
};

const sampleRatioValues = (count: number): number[] => {
  while (true) {
    const values = genN(count, () => randInt(1, 15));
    const simplified = simplifyIntRatio(values);
    if (simplified.every((value) => value <= 15)) return simplified;
  }
};

const generateRatioQuestion = (): Question => {
  const count = Math.random() < 0.58 ? 3 : 4;
  const values = sampleRatioValues(count);
  const answer = values.join(',');
  const relationSets = count === 3
    ? [
        () => [
          buildRelation(values, [0], [1], true),
          buildRelation(values, [2], [0]),
        ],
        () => [
          buildRelation(values, [1], [0], true),
          buildRelation(values, [0, 2], [1]),
        ],
        () => [
          buildRelation(values, [0], [1]),
          buildRelation(values, [0], [1, 2]),
        ],
        () => [
          buildRelation(values, [0, 1], [2]),
          buildRelation(values, [1], [0], true),
        ],
      ]
    : [
        () => [
          buildRelation(values, [1], [0], true),
          buildRelation(values, [2], [0]),
          buildRelation(values, [3], [1]),
        ],
        () => [
          buildRelation(values, [1], [0], true),
          buildRelation(values, [0, 1], [2], true),
          buildRelation(values, [3], [1]),
        ],
        () => [
          buildRelation(values, [0], [1]),
          buildRelation(values, [0], [2]),
          buildRelation(values, [3], [0, 1, 2]),
        ],
        () => [
          buildRelation(values, [1, 2], [0]),
          buildRelation(values, [0, 1, 3], [2]),
          buildRelation(values, [3], [0]),
        ],
      ];
  const relations = relationSets[randInt(0, relationSets.length - 1)]();
  const names = VAR_NAMES.slice(0, count).join('');
  return {
    dividend: `${names}是${count}个整数，${relations.join('，')}。求它们的比例。（逗号分隔）`,
    divisor: '',
    ans: answer,
    symbol: '',
  };
};

const checkRatioAnswer = (_v: number, t: Ans, inputStr = ''): CheckResult => {
  const target = String(t);
  const parse = (value: string): number[] => value
    .replaceAll('，', ',')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => Number(part));
  const targetParts = parse(target);
  const inputParts = parse(inputStr);
  const ok = inputParts.length === targetParts.length
    && inputParts.every(Number.isInteger)
    && inputParts.every((value, index) => value === targetParts[index]);
  return { ok, display: target };
};

const generateRelationQuestion = (count = 3): Question => {
  while (true) {
    const baseIndex = randInt(0, count - 1);
    const otherIndices = Array.from({ length: count }, (_, index) => index).filter((index) => index !== baseIndex);
    const offsets = new Map<number, number>(
      otherIndices.map((index) => [index, randInt(1, 9) * (Math.random() < 0.5 ? 1 : -1)]),
    );
    const candidatePairs: [number, number][] = [];
    otherIndices.forEach((left) => {
      otherIndices.forEach((right) => {
        const diff = (offsets.get(left) ?? 0) - (offsets.get(right) ?? 0);
        if (left !== right && diff !== 0 && Math.abs(diff) <= 9) candidatePairs.push([left, right]);
      });
    });
    if (candidatePairs.length === 0) continue;

    const [aIndex, bIndex] = candidatePairs[randInt(0, candidatePairs.length - 1)];
    const answerDiff = (offsets.get(aIndex) ?? 0) - (offsets.get(bIndex) ?? 0);
    if (answerDiff === 0 || Math.abs(answerDiff) > 9) continue;

    const sentenceFor = (index: number): string => {
      const offset = offsets.get(index) ?? 0;
      return `${VAR_NAMES[index]}比${VAR_NAMES[baseIndex]}${offset > 0 ? '多' : '少'}${Math.abs(offset)}`;
    };
    const sentences = shuffle(otherIndices.map(sentenceFor));
    const names = VAR_NAMES.slice(0, count).join('');

    return {
      dividend: `${names}是${count}个整数，${sentences.join('，')}。问${VAR_NAMES[aIndex]}比${VAR_NAMES[bIndex]}？`,
      divisor: '',
      ans: `${answerDiff > 0 ? '多' : '少'}${Math.abs(answerDiff)}`,
      symbol: '',
    };
  }
};

const checkRelationAnswer = (_v: number, t: Ans, inputStr = ''): CheckResult => {
  const target = String(t);
  const targetKind = target.includes('多') ? '多' : '少';
  const targetNum = Number(target.replace(/[多少]/g, ''));
  const raw = inputStr.replace(/\s/g, '');
  const inputKind = raw.includes('多') ? '多' : raw.includes('少') ? '少' : '';
  const numberMatch = raw.match(/[1-9]/);
  const inputNum = numberMatch ? Number(numberMatch[0]) : NaN;
  return {
    ok: inputKind === targetKind && inputNum === targetNum,
    display: target,
  };
};

const RELATION_V1_NAMES = ['甲', '乙', '丙'];

const formatRelationDiff = (diff: number): string =>
  `${diff > 0 ? '多' : '少'}${Math.abs(diff)}`;

const generateFlexibleRelationQuestion = (): Question => {
  while (true) {
    const values = genN(RELATION_V1_NAMES.length, () => randInt(0, 18));
    const pairs = shuffle(
      RELATION_V1_NAMES.flatMap((_, left) =>
        RELATION_V1_NAMES.map((__, right) => [left, right] as [number, number]),
      ).filter(([left, right]) => left !== right),
    );
    const relationCandidates = pairs
      .map(([left, right]) => {
        const diff = values[left] - values[right];
        if (diff === 0 || Math.abs(diff) > 9) return null;
        return {
          key: `${left}:${right}`,
          text: `${RELATION_V1_NAMES[left]}比${RELATION_V1_NAMES[right]}${formatRelationDiff(diff)}`,
        };
      })
      .filter((item): item is { key: string; text: string } => item !== null);

    if (relationCandidates.length < 2) continue;

    const conditions = relationCandidates.slice(0, 2);
    const conditionKeys = new Set(conditions.map((item) => item.key));
    const questionCandidates = pairs
      .map(([left, right]) => ({ left, right, diff: values[left] - values[right] }))
      .filter(({ left, right, diff }) =>
        diff !== 0
        && Math.abs(diff) <= 9
        && !conditionKeys.has(`${left}:${right}`),
      );

    if (questionCandidates.length === 0) continue;

    const question = questionCandidates[randInt(0, questionCandidates.length - 1)];
    return {
      dividend: `${RELATION_V1_NAMES.join('')}是3个整数，${conditions.map((item) => item.text).join('，')}。问${RELATION_V1_NAMES[question.left]}比${RELATION_V1_NAMES[question.right]}？`,
      divisor: '',
      ans: formatRelationDiff(question.diff),
      symbol: '',
    };
  }
};

const checkFlexibleRelationAnswer = (_v: number, t: Ans, inputStr = ''): CheckResult => {
  const target = String(t);
  const targetKind = target.includes('多') ? '多' : '少';
  const targetNum = Number(target.replace(/[多少]/g, ''));
  const raw = inputStr.replace(/\s/g, '');
  const inputKind = raw.includes('多') ? '多' : raw.includes('少') ? '少' : '';
  const numberMatch = raw.match(/[1-9]/);
  const inputNum = numberMatch ? Number(numberMatch[0]) : NaN;
  return {
    ok: inputKind === targetKind && inputNum === targetNum,
    display: target,
  };
};

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

  ratioExpr: {
    name: '比例表达式',
    title: '比例表达式完成',
    hintNote: '按题目顺序输入最简整数比，逗号分隔',
    isSmallFont: true,
    check: checkRatioAnswer,
    gen: (n) => genN(n, generateRatioQuestion),
  },

  relationExpr: {
    name: '关系表达式',
  },

  relationExprV1: {
    name: '关系表达式 1.0',
    title: '关系表达式完成',
    hintNote: '输入多/少和差值，顺序不限',
    isSmallFont: true,
    check: checkFlexibleRelationAnswer,
    gen: (n) => genN(n, generateFlexibleRelationQuestion),
  },

  relationExprV2: {
    name: '关系表达式 2.0',
    title: '关系表达式 2.0完成',
    hintNote: '输入多/少和差值，顺序不限',
    isSmallFont: true,
    check: checkRelationAnswer,
    gen: (n) => genN(n, () => generateRelationQuestion(4)),
  },

  pairMult: {
    name: '大九九对子',
    title: '大九九对子完成！',
    hintNote: '先左后右，依次输入两个乘积',
    isSmallFont: true,
    check: (v, t, inputStr, inputArray): CheckResult => {
      const target = t as PairAnswer;
      if (!inputArray || inputArray.length < 2) {
        return { ok: false, display: `${target.ans1}, ${target.ans2}` };
      }
      const ok = parseInt(inputArray[0], 10) === target.ans1
        && parseInt(inputArray[1], 10) === target.ans2;
      return { ok, display: `${target.ans1}, ${target.ans2}` };
    },
    gen: (n) => {
      const pairs: [number, number][] = [];
      for (let x = 2; x <= 9; x++) {
        for (let y = x + 1; y <= 9; y++) {
          pairs.push([x, y]);
        }
      }
      const selected = shuffle(pairs).slice(0, n);
      return selected.map(([x, y]) => {
        const flip = Math.random() > 0.5;
        const a = flip ? x : y;
        const b = flip ? y : x;
        return {
          dividend: `${10 + a}×${b}`,
          divisor: `${10 + b}×${a}`,
          ans: { ans1: (10 + a) * b, ans2: (10 + b) * a } as PairAnswer,
          symbol: '  |  ',
        };
      });
    },
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

  bigNineDivSpec: {
    name: '大九九除法专项',
    title: '大九九除法专项完成！',
    hintNote: '三位数除以12-19 (误差3%内)',
    check: estimateCheck,
    gen: (n, ex) => {
      const d = ex?.divisor ?? 12;
      return genN(n, (): Question => {
        const dividend = randInt(100, 999);
        return { dividend, divisor: d, ans: dividend / d, symbol: '÷' };
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

  firstDiffBorrow: {
    name: '首位差与退位',
    title: '首位差与退位完成！',
    hintNote: '先填准确差，确认后填退位差',
    check: (v, t, inputStr, inputArray): CheckResult => {
      const target = t as PairAnswer;
      if (!inputArray || inputArray.length < 2) {
        return { ok: false, display: `准确 ${target.ans1}, 退位 ${target.ans2}` };
      }
      const ok = parseInt(inputArray[0], 10) === target.ans1
        && parseInt(inputArray[1], 10) === target.ans2;
      return { ok, display: `准确 ${target.ans1}, 退位 ${target.ans2}` };
    },
    gen: (n) => genN(n, (): Question => {
      const { a, b } = rejectSample(
        () => ({ a: randInt(1, 9), b: randInt(1, 9) }),
        ({ a, b }) => a > b && a - b >= 2,
      );
      return { dividend: a, divisor: b, ans: { ans1: a - b, ans2: a - 1 - b }, symbol: '−' };
    }),
  },

  middleDiffBorrow: {
    name: '次位差与退位',
    title: '次位差与退位完成！',
    hintNote: '先填直接差，确认后填被借位后的差',
    check: (v, t, inputStr, inputArray): CheckResult => {
      const target = t as PairAnswer;
      if (!inputArray || inputArray.length < 2) {
        return { ok: false, display: `直接 ${target.ans1}, 借位后 ${target.ans2}` };
      }
      const ok = parseInt(inputArray[0], 10) === target.ans1
        && parseInt(inputArray[1], 10) === target.ans2;
      return { ok, display: `直接 ${target.ans1}, 借位后 ${target.ans2}` };
    },
    gen: (n) => genN(n, (): Question => {
      const a = randInt(0, 9);
      const b = randInt(0, 9);
      const computeDiff = (x: number, y: number): number =>
        x >= y ? x - y : x + 10 - y;
      return {
        dividend: a,
        divisor: b,
        ans: { ans1: computeDiff(a, b), ans2: computeDiff(a - 1, b) },
        symbol: '−',
      };
    }),
  },

  lastDiff: {
    name: '末位差与退位',
    title: '末位差与退位完成！',
    hintNote: '个位差，需退位则加10',
    gen: (n) => genN(n, (): Question => {
      const a = randInt(0, 9);
      const b = randInt(0, 9);
      const ans = a >= b ? a - b : a + 10 - b;
      return { dividend: a, divisor: b, ans, symbol: '−' };
    }),
  },
};

export const MODE_GROUPS: Record<string, ModeGroup> = {
  basic: { label: '大九九/除法', modes: ['train', 'speed', 'first', 'pairMult'] },
  reasoning: { label: '数量关系专项', modes: ['ratioExpr', 'relationExpr'] },
  divSelect: { label: '商首位专项', modes: [] },
  bigNineDivSelect: { label: '大九九除法专项', modes: [] },
  single: { label: '一位数专项', modes: ['plus', 'minus', 'fourSingleSum'] },
  double: { label: '两位数专项 (完整答案)', modes: ['doublePlus', 'doubleMinus', 'fourSum', 'decompAdd'] },
  triple: {
    label: '三位数专项 (完整答案)',
    modes: [
      'carryJudge', 'borrowJudge', 'digitDetermine',
      'triplePlus', 'tripleMinus', 'tripleAnyPlus', 'tripleAnyMinus',
      'tripleMix', 'tripleMult', 'tripleDiv',
      'sumTruncated', 'diffTruncated',
      'firstDiffBorrow', 'middleDiffBorrow', 'lastDiff',
    ],
  },
  spec: { label: '五除三专项 (允许3%误差)', modes: ['divSpecA', 'divSpecB', 'divSpecC', 'divScale'] },
};

export const DIVISOR_LIST = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
export const BIG_NINE_DIVISOR_LIST = [12, 13, 14, 15, 16, 17, 18, 19];

export const ESTIMATE_MODES = ['tripleDiv', 'bigNineDivSpec', 'divSpecA', 'divSpecB', 'divSpecC'];

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
  if (modeKey === 'bigNineDivSpec') {
    return {
      name: `除数${selectedDivisor}`,
      title: `除数${selectedDivisor}完成！`,
      hintNote: `三位数除以${selectedDivisor}：商误差3%内`,
      check: GAME_MODES.bigNineDivSpec.check,
      gen: GAME_MODES.bigNineDivSpec.gen,
    };
  }
  return GAME_MODES[modeKey] || {};
};

export const getModeName = (modeKey: string, selectedDivisor: number): string => {
  if (modeKey === 'firstSpec') return `商首位(除${selectedDivisor})`;
  if (modeKey === 'bigNineDivSpec') return `大九九除法(除${selectedDivisor})`;
  return GAME_MODES[modeKey]?.name || '未知模式';
};

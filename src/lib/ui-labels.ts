export const GROUP_LABELS: Record<string, string> = {
  basic: '大九九与除法',
  divSelect: '商首位专项',
  bigNineDivSelect: '大九九除法专项',
  single: '一位数专项',
  double: '两位数专项',
  triple: '三位数专项',
  spec: '五位数除三位数',
};

export const MODE_LABELS: Record<string, string> = {
  train: '基础训练',
  speed: '竞速',
  pairMult: '大九九对乘',
  first: '商首位',
  firstSpec: '商首位专项',
  bigNineDivSpec: '大九九除法',
  plus: '进位加',
  minus: '退位减',
  fourSingleSum: '四数相加',
  doublePlus: '两位进位加',
  doubleMinus: '两位退位减',
  fourSum: '四数相加',
  decompAdd: '分解加法',
  carryJudge: '进位判断',
  borrowJudge: '退位判断',
  digitDetermine: '数位判断',
  triplePlus: '三位进位加',
  tripleMinus: '三位退位减',
  tripleAnyPlus: '任意三位加',
  tripleAnyMinus: '任意三位减',
  tripleMix: '加减混合',
  tripleMult: '三乘一',
  tripleDiv: '三除一',
  sumTruncated: '和去尾',
  diffTruncated: '差去尾',
  divSpecA: '反向放缩',
  divSpecB: '平移法',
  divSpecC: '任意五除三',
  divScale: '放缩被除数',
};

export const SHAPE_GROUP_LABELS: Record<string, string> = {
  basic: '基础柱体',
  curved: '曲面体',
  hollow: '挖空题',
  composite: '组合体',
  special: '异形结构',
};

export const prettyModeName = (modeKey: string, selectedDivisor?: number) => {
  if (modeKey === 'firstSpec' && selectedDivisor) return `商首位 · 除以 ${selectedDivisor}`;
  if (modeKey === 'bigNineDivSpec' && selectedDivisor) return `大九九除法 · 除以 ${selectedDivisor}`;
  return MODE_LABELS[modeKey] || modeKey;
};

export const prettyExpression = (value: string) =>
  value
    .replaceAll('梅', '÷')
    .replaceAll('脳', '×')
    .replaceAll('鈥?', '—')
    .replaceAll('路', '·');

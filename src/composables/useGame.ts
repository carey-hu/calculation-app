import { ref, computed, onBeforeUnmount } from 'vue';
import type { Ref, ComputedRef } from 'vue';
import type {
  Question, CheckResult, ResultItem, TrainLogItem,
  GameModeConfig, ViewState,
} from '../types';
import {
  resolveActiveConfig, getModeName,
  GAME_MODES, ESTIMATE_MODES,
} from '../lib/game-modes';
import { msToMMSS } from '../lib/formatters';

const MULTI_BOX_MODES = ['carryJudge', 'borrowJudge'];
const STEPPED_MODES = ['decompAdd', 'pairMult'];
const STAGE_TIMED_MODES = ['digitDetermine'];

interface HistoryComposable {
  list: Ref<{ mode: string; modeName: string; duration: string; summary: string; detail: unknown[] }[]>;
  addRecord: (payload: {
    modeKey: string;
    modeName: string;
    totalSec: number;
    summary: string;
    detail: (ResultItem | TrainLogItem)[];
  }) => void;
}

interface GameContext {
  viewState: Ref<ViewState>;
  history: HistoryComposable;
}

interface DetailTimesResult {
  detailTimes?: string;
}

export function useGame({ viewState, history }: GameContext) {
  const currentModeKey = ref('train');
  const selectedDivisor = ref(0);

  const pool = ref<Question[]>([]);
  const idx = ref(0);
  const current = ref<Question | null>(null);

  const input = ref('');
  const inputArray = ref<string[]>([]);
  const decompStep = ref(0);

  const uiHint = ref('');
  const totalText = ref('0:00.0');
  const progressText = ref('1/81');
  const qText = ref('—');
  const leftText = ref('跳过');

  const totalStartTs = ref(0);
  const qStartTs = ref(0);
  const totalSec = ref(0);

  // Non-reactive: per-question segment timing.
  let boxTimes: number[] = [];
  let lastInputTs = 0;

  const trainWrong = ref(0);
  const trainSkip = ref(0);
  const curWrongTries = ref(0);
  const trainLog = ref<TrainLogItem[]>([]);
  const results = ref<ResultItem[]>([]);
  const isHistoryReview = ref(false);

  let timerId: ReturnType<typeof setInterval> | null = null;

  const activeConfig: ComputedRef<GameModeConfig> = computed(() =>
    resolveActiveConfig(currentModeKey.value, selectedDivisor.value),
  );

  const isSmallFont = computed(() => !!activeConfig.value.isSmallFont);

  const resultTitle = computed(() => activeConfig.value.title || '训练完成！');

  const resultMeta = computed(() => {
    const s = totalSec.value || 0;
    if (currentModeKey.value === 'train') {
      return `用时：${s.toFixed(1)}s｜错误：${trainWrong.value}｜跳过：${trainSkip.value}`;
    }
    const correct = results.value.filter((x) => x.ok).length;
    const total = results.value.length;
    return `正确：${correct}/${total}｜总用时：${s.toFixed(1)}s`;
  });

  const setMode = (mode: string) => { currentModeKey.value = mode; };

  const toSelectDivisor = () => { viewState.value = 'selectDivisor'; };

  const selectDivisorAndStart = (d: number) => {
    currentModeKey.value = 'firstSpec';
    selectedDivisor.value = d;
    startGame();
  };

  const _tick = () => {
    const diff = Date.now() - totalStartTs.value;
    totalText.value = msToMMSS(diff);
  };

  const _setQuestion = (q: Question, shownIdx: number) => {
    current.value = q;
    qStartTs.value = Date.now();
    lastInputTs = Date.now();
    boxTimes = [];
    input.value = '';
    inputArray.value = [];
    decompStep.value = 0;
    curWrongTries.value = 0;
    uiHint.value = '';
    qText.value = `${q.dividend}${q.symbol}${q.divisor}`;
    progressText.value = `${shownIdx}/${pool.value.length}`;
  };

  const _nextQuestion = () => {
    if (idx.value >= pool.value.length) {
      _finish();
      return;
    }
    _setQuestion(pool.value[idx.value], idx.value + 1);
    idx.value += 1;
  };

  function startGame() {
    const cfg = activeConfig.value;
    if (!cfg.gen) return;
    pool.value = cfg.gen(10, { divisor: selectedDivisor.value });
    if (timerId) clearInterval(timerId);
    viewState.value = 'game';
    idx.value = 0;
    input.value = '';
    inputArray.value = [];
    uiHint.value = '';
    leftText.value = currentModeKey.value === 'train' ? '跳过' : '重开';
    totalStartTs.value = Date.now();
    qStartTs.value = 0;
    trainWrong.value = 0;
    trainSkip.value = 0;
    curWrongTries.value = 0;
    trainLog.value = [];
    results.value = [];
    isHistoryReview.value = false;
    _nextQuestion();
    timerId = setInterval(_tick, 100);
  }

  const pressDigit = (d: number | string) => {
    const mode = currentModeKey.value;

    if (MULTI_BOX_MODES.includes(mode)) {
      if (inputArray.value.length >= 2) return;
      const now = Date.now();
      boxTimes.push(now - lastInputTs);
      lastInputTs = now;
      inputArray.value = [...inputArray.value, String(d)];
      input.value = inputArray.value.join(',');
      return;
    }

    let cur = input.value || '';
    let maxLen = 6;
    if (mode === 'divScale' || mode === 'digitDetermine') maxLen = 4;
    if (cur.length >= maxLen) return;

    if (STAGE_TIMED_MODES.includes(mode)) {
      const now = Date.now();
      boxTimes.push(now - lastInputTs);
      lastInputTs = now;
    }

    input.value = cur + String(d);
  };

  const pressDot = () => {
    const mode = currentModeKey.value;
    if (mode === 'divScale' || MULTI_BOX_MODES.includes(mode)
        || mode === 'digitDetermine' || STEPPED_MODES.includes(mode)) return;
    let cur = input.value || '';
    if (cur.length >= 6) return;
    if (cur.includes('.')) return;
    if (cur === '') cur += '0';
    input.value = cur + '.';
  };

  const clearInput = () => {
    const mode = currentModeKey.value;
    input.value = '';
    if (MULTI_BOX_MODES.includes(mode) || mode === 'digitDetermine') {
      inputArray.value = [];
      boxTimes = [];
      lastInputTs = Date.now();
    } else if (STEPPED_MODES.includes(mode)) {
      lastInputTs = Date.now();
    }
  };

  const backspace = () => {
    const mode = currentModeKey.value;

    if (MULTI_BOX_MODES.includes(mode)) {
      if (inputArray.value.length > 0) {
        inputArray.value = inputArray.value.slice(0, -1);
        input.value = inputArray.value.join(',');
        boxTimes.pop();
        lastInputTs = Date.now();
      }
      return;
    }

    if (STEPPED_MODES.includes(mode)) {
      if ((input.value || '').length > 0) {
        input.value = input.value.slice(0, -1);
      } else if (decompStep.value > 0) {
        decompStep.value -= 1;
        const arr = inputArray.value.slice();
        const popped = arr.pop();
        input.value = popped ?? '';
        inputArray.value = arr;
        boxTimes.pop();
        lastInputTs = Date.now();
      }
      return;
    }

    if (mode === 'digitDetermine') {
      if ((input.value || '').length > 0) {
        boxTimes.pop();
        lastInputTs = Date.now();
        input.value = input.value.slice(0, -1);
      }
      return;
    }

    input.value = (input.value || '').slice(0, -1);
  };

  const leftAction = () => {
    if (currentModeKey.value !== 'train') {
      startGame();
      return;
    }
    const cur = current.value!;
    const used = (Date.now() - qStartTs.value) / 1000;
    trainLog.value = trainLog.value.concat([{
      q: `${cur.dividend}${cur.symbol}${cur.divisor}`,
      usedStr: used.toFixed(1) + 's',
      wrong: curWrongTries.value,
      skipped: true,
    }]);
    trainSkip.value += 1;
    _nextQuestion();
  };

  const _buildDetailTimes = (mode: string): DetailTimesResult => {
    if (MULTI_BOX_MODES.includes(mode)) {
      const t1 = (boxTimes[0] || 0) / 1000;
      const t2 = (boxTimes[1] || 0) / 1000;
      return { detailTimes: `百:${t1.toFixed(1)}s 十:${t2.toFixed(1)}s (个位默认0)` };
    }
    if (mode === 'digitDetermine') {
      let tH = 0; let tT = 0; let tO = 0;
      if (input.value.length === 4) {
        tH = ((boxTimes[0] || 0) + (boxTimes[1] || 0)) / 1000;
        tT = (boxTimes[2] || 0) / 1000;
        tO = (boxTimes[3] || 0) / 1000;
      } else {
        tH = (boxTimes[0] || 0) / 1000;
        tT = (boxTimes[1] || 0) / 1000;
        tO = (boxTimes[2] || 0) / 1000;
      }
      return { detailTimes: `千百:${tH.toFixed(1)}s 十:${tT.toFixed(1)}s 个:${tO.toFixed(1)}s` };
    }
    if (mode === 'decompAdd') {
      const t1 = (boxTimes[0] || 0) / 1000;
      const t2 = (boxTimes[1] || 0) / 1000;
      const t3 = (boxTimes[2] || 0) / 1000;
      return { detailTimes: `十位:${t1.toFixed(1)}s 个位:${t2.toFixed(1)}s 总和:${t3.toFixed(1)}s` };
    }
    if (mode === 'pairMult') {
      const t1 = (boxTimes[0] || 0) / 1000;
      const t2 = (boxTimes[1] || 0) / 1000;
      return { detailTimes: `左边:${t1.toFixed(1)}s 右边:${t2.toFixed(1)}s` };
    }
    return {};
  };

  const _resetCurrentInput = (mode: string) => {
    input.value = '';
    inputArray.value = [];
    if (MULTI_BOX_MODES.includes(mode) || STEPPED_MODES.includes(mode)) {
      boxTimes = [];
      lastInputTs = Date.now();
    }
    if (STEPPED_MODES.includes(mode)) decompStep.value = 0;
  };

  const confirmAnswer = () => {
    const mode = currentModeKey.value;
    const cur = current.value!;
    const cfg = activeConfig.value;

    // Stepped modes (decompAdd: 3 steps, pairMult: 2 steps): collect segmented inputs before grading.
    if (STEPPED_MODES.includes(mode)) {
      if (!input.value) return;
      const now = Date.now();
      boxTimes.push(now - lastInputTs);
      lastInputTs = now;
      inputArray.value = [...inputArray.value, input.value];
      input.value = '';
      const maxStep = mode === 'decompAdd' ? 2 : 1;
      if (decompStep.value < maxStep) {
        decompStep.value += 1;
        return;
      }
    }

    if (!input.value && !MULTI_BOX_MODES.includes(mode) && !STEPPED_MODES.includes(mode)) return;
    if (MULTI_BOX_MODES.includes(mode) && inputArray.value.length === 0) return;

    const numericInput = mode === 'decompAdd' ? 0 : parseFloat(input.value);
    const used = (Date.now() - qStartTs.value) / 1000;
    let yourAnsStr = input.value;
    let extraInfo: Record<string, unknown> = {};

    if (MULTI_BOX_MODES.includes(mode) && inputArray.value.length < 2) {
      uiHint.value = '请填满百位和十位选项';
      return;
    }
    if (MULTI_BOX_MODES.includes(mode)) {
      yourAnsStr = inputArray.value.join(' ') + ' 0';
    }
    if (mode === 'decompAdd') {
      yourAnsStr = `${inputArray.value[0]}, ${inputArray.value[1]}, ${inputArray.value[2]}`;
    }
    if (mode === 'pairMult') {
      yourAnsStr = `${inputArray.value[0]}, ${inputArray.value[1]}`;
    }

    const dtResult = _buildDetailTimes(mode);
    if (dtResult.detailTimes) extraInfo.detailTimes = dtResult.detailTimes;

    if (mode === 'divScale') {
      if (input.value.length < 4) {
        uiHint.value = '请填满三位数和一位数';
        return;
      }
      yourAnsStr = `${input.value.slice(0, 3)}÷${input.value.slice(3, 4)}`;
    }

    let correct = false;
    let realAnsDisplay = String(cur.ans);

    if (cfg.check) {
      const checkResult: CheckResult = cfg.check(numericInput, cur.ans, input.value, inputArray.value);
      correct = checkResult.ok;
      realAnsDisplay = checkResult.display;
      if (checkResult.exactAns !== undefined) {
        extraInfo = { ...extraInfo, exactAns: checkResult.exactAns, errorRate: checkResult.errorRate };
        if (checkResult.exactDividend !== undefined) {
          extraInfo.exactDividend = checkResult.exactDividend;
        }
      }
    } else {
      correct = parseInt(input.value, 10) === cur.ans;
    }

    if (mode === 'train') {
      if (correct) {
        trainLog.value = trainLog.value.concat([{
          q: `${cur.dividend}${cur.symbol}${cur.divisor}`,
          usedStr: used.toFixed(1) + 's',
          wrong: curWrongTries.value,
          skipped: false,
        }]);
        _nextQuestion();
      } else {
        trainWrong.value += 1;
        curWrongTries.value += 1;
        _resetCurrentInput(mode);
        uiHint.value = `错误！答案是：${realAnsDisplay}`;
      }
      return;
    }

    if (ESTIMATE_MODES.includes(mode)) {
      const exact = (cur.dividend as number) / (cur.divisor as number);
      const error = Math.abs(numericInput - exact) / exact;
      const exactStr = Number.isInteger(exact) ? String(exact) : exact.toFixed(1);
      extraInfo = { ...extraInfo, exactAns: exactStr, errorRate: (error * 100).toFixed(2) + '%' };
    }

    const resultItem: ResultItem = {
      q: `${cur.dividend}${cur.symbol}${cur.divisor}`,
      ok: correct,
      yourAns: yourAnsStr,
      realAns: realAnsDisplay,
      usedStr: used.toFixed(1) + 's',
      exactAns: extraInfo.exactAns as string | undefined,
      errorRate: extraInfo.errorRate as string | undefined,
      exactDividend: extraInfo.exactDividend as string | undefined,
      detailTimes: extraInfo.detailTimes as string | undefined,
    };

    results.value = results.value.concat([resultItem]);
    _nextQuestion();
  };

  function _finish() {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
    totalSec.value = (Date.now() - totalStartTs.value) / 1000;

    let summary: string;
    let detail: (ResultItem | TrainLogItem)[];
    if (currentModeKey.value === 'train') {
      summary = `错${trainWrong.value}/跳${trainSkip.value}`;
      detail = trainLog.value;
    } else {
      const correct = results.value.filter((x) => x.ok).length;
      const total = results.value.length;
      summary = `正确率 ${Math.round((correct / total) * 100)}%`;
      detail = results.value;
    }

    viewState.value = 'result';
    isHistoryReview.value = false;
    history.addRecord({
      modeKey: currentModeKey.value,
      modeName: getModeName(currentModeKey.value, selectedDivisor.value),
      totalSec: totalSec.value,
      summary,
      detail,
    });
  }

  const goHome = () => {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
    viewState.value = 'home';
  };

  const viewHistoryDetail = (record: {
    mode: string;
    modeName: string;
    duration: string;
    summary: string;
    detail: (ResultItem | TrainLogItem)[];
  }) => {
    if (!record) return;
    currentModeKey.value = record.mode;
    totalSec.value = parseFloat(record.duration.replace('s', ''));
    if (record.mode === 'train') {
      trainLog.value = (record.detail || []) as TrainLogItem[];
      results.value = [];
    } else {
      results.value = (record.detail || []) as ResultItem[];
      trainLog.value = [];
    }
    viewState.value = 'result';
    isHistoryReview.value = true;
  };

  onBeforeUnmount(() => {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  });

  return {
    // state
    currentModeKey, selectedDivisor,
    input, inputArray, decompStep,
    uiHint, totalText, progressText, qText, leftText,
    trainLog, results, isHistoryReview,
    // computed
    activeConfig, isSmallFont, resultTitle, resultMeta,
    // actions
    setMode, toSelectDivisor, selectDivisorAndStart,
    startGame,
    pressDigit, pressDot, clearInput, backspace, leftAction,
    confirmAnswer,
    goHome,
    viewHistoryDetail,
    // exposed for menu rendering
    getModeConfig: (key: string) => GAME_MODES[key] || { name: key },
  };
}

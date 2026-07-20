import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts';
import type { EChartsType } from 'echarts';
import type {
  BuildRecordPayload,
  CheckResult,
  ExamShapeDef,
  GameModeConfig,
  HistoryRecord,
  Question,
  ResultItem,
  SliceConfig,
  TrainLogItem,
  ViewState,
} from './types';
import {
  ESTIMATE_MODES,
  GAME_MODES,
  getModeName,
  resolveActiveConfig,
} from './lib/game-modes';
import { msToMMSS } from './lib/formatters';
import {
  buildRecord,
  clearAllHistory,
  enqueuePendingSyncRecord,
  hasCompletedAuthoritativeSync,
  hasCompletedFullRemoteSync,
  historyRecordKey,
  loadHistory,
  loadHistorySyncSince,
  loadLastHistorySyncedAt,
  loadPendingSyncRecords,
  markAuthoritativeSyncComplete,
  markFullRemoteSyncComplete,
  mergeHistory,
  prependRecord,
  removeLowAccuracyHistory,
  removePendingSyncRecords,
  saveHistory,
  saveHistorySyncSince,
  saveLastHistorySyncedAt,
  trimOldest,
} from './lib/history';
import {
  clearRemoteHistory,
  clearRemoteLowAccuracy,
  clearRemoteOldest,
  fetchRemoteHistory,
  saveRemoteRecord,
  saveRemoteRecords,
} from './lib/history-api';
import { aggregateChartData, buildChartOption } from './lib/chart';
import { todayStr, oldestRecordDateStr } from './lib/date-utils';
import {
  buildCsv,
  buildExportFilename,
  downloadCsvFile,
  filterByDateRange,
} from './lib/export-excel';
import {
  buildTextFilename,
  buildTextReport,
  downloadTextFile,
} from './lib/export-text';
import type { ThreeHandle } from './three/types';
import {
  animateLoop,
  clearVoxels,
  createScene,
  disposeScene,
  handleVoxelClick,
  setCameraView as sceneSetCameraView,
} from './three/scene';
import { loadShape, lookAtSection as csgLookAtSection, updateSlice } from './three/section';
import { EXAM_SHAPES } from './three/shapes';

const MULTI_BOX_MODES = ['carryJudge', 'borrowJudge'];
const STEPPED_MODES = ['decompAdd', 'pairMult', 'firstDiffBorrow', 'middleDiffBorrow'];
const STAGE_TIMED_MODES = ['digitDetermine'];
const RATIO_EXPR_MODE = 'ratioExpr';
const RELATION_EXPR_ENTRY_MODE = 'relationExpr';
const RELATION_EXPR_MODES = ['relationExprV1', 'relationExprV2'];
const LOW_ACCURACY_THRESHOLD = 30;
const SYNC_THROTTLE_MS = 60000;
// 为设备时钟偏差和并发写入保留重叠窗口，重复数据由统一记录 ID 去重。
const SYNC_SINCE_REFETCH_BUFFER_MS = 5 * 60 * 1000;
const DEFAULT_SLICE: SliceConfig = { constant: 0, rotX: 90, rotY: 0, rotZ: 0 };

export function useToast() {
  const [toast, setToast] = useState({ show: false, title: '' });
  const timerRef = useRef<number | null>(null);

  const showToast = useCallback((title: string) => {
    setToast({ show: true, title });
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setToast({ show: false, title: '' }), 1400);
  }, []);

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  return { toast, showToast };
}

export function useHistoryStore() {
  const [list, setList] = useState<HistoryRecord[]>(() => loadHistory());
  const listRef = useRef(list);
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'ok' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const [pendingCount, setPendingCount] = useState(() => loadPendingSyncRecords().length);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(() => loadLastHistorySyncedAt());
  const syncPromiseRef = useRef<Promise<void> | null>(null);
  const lastSyncStartedAtRef = useRef(0);

  useEffect(() => {
    listRef.current = list;
  }, [list]);

  const errorMessage = (error: unknown) => error instanceof Error ? error.message : String(error);
  const latestRecordTs = (records: HistoryRecord[]) =>
    records.reduce((latest, record) => Math.max(latest, record.ts || 0), 0);
  const refreshPendingCount = useCallback(() => {
    setPendingCount(loadPendingSyncRecords().length);
  }, []);
  const markSyncOk = useCallback(() => {
    const syncedAt = Date.now();
    saveLastHistorySyncedAt(syncedAt);
    setLastSyncedAt(syncedAt);
    setPendingCount(loadPendingSyncRecords().length);
    setSyncState('ok');
    setSyncMessage('');
  }, []);

  const uploadMissingRecords = useCallback(async (records: HistoryRecord[], remoteList: HistoryRecord[]) => {
    if (records.length === 0) return remoteList;
    const remoteKeys = new Set(remoteList.map(historyRecordKey));
    const missingRecords = records.filter((record) => !remoteKeys.has(historyRecordKey(record)));
    if (missingRecords.length === 0) return remoteList;
    await saveRemoteRecords(missingRecords);
    return mergeHistory(remoteList, missingRecords);
  }, []);

  const runRefreshRemote = useCallback(async () => {
    setSyncState('syncing');
    setSyncMessage('');
    try {
      const remoteSince = hasCompletedFullRemoteSync() ? loadHistorySyncSince() : null;
      const remoteResult = await fetchRemoteHistory(remoteSince);
      const deletedIDs = new Set(remoteResult.deletedIDs);
      const isDeleted = (record: HistoryRecord) => deletedIDs.has(historyRecordKey(record));
      let remoteList = remoteResult.records.filter((record) => !isDeleted(record));
      const localList = listRef.current.filter((record) => !isDeleted(record));
      const shouldMigrateLocalHistory =
        localList.length > 0 && !hasCompletedAuthoritativeSync();

      if (shouldMigrateLocalHistory) {
        remoteList = await uploadMissingRecords(localList, remoteList);
        markAuthoritativeSyncComplete();
      }

      const allPendingRecords = loadPendingSyncRecords();
      const deletedPendingRecords = allPendingRecords.filter(isDeleted);
      if (deletedPendingRecords.length > 0) removePendingSyncRecords(deletedPendingRecords);
      const pendingRecords = allPendingRecords.filter((record) => !isDeleted(record));
      remoteList = await uploadMissingRecords(pendingRecords, remoteList);
      removePendingSyncRecords(pendingRecords);

      // 同步期间用户可能刚完成一组练习；最终合并重新读取最新本机状态，
      // 避免较早的同步快照覆盖这条刚创建的记录。
      const latestLocalList = listRef.current.filter((record) => !isDeleted(record));
      const mergedList = mergeHistory(remoteList, latestLocalList);
      listRef.current = mergedList;
      setList(mergedList);
      saveHistory(mergedList);
      if (remoteSince === null) markFullRemoteSyncComplete();
      saveHistorySyncSince(Math.max(1, latestRecordTs(mergedList) - SYNC_SINCE_REFETCH_BUFFER_MS));
      markSyncOk();
    } catch (e) {
      console.error('Failed to sync remote history:', e);
      setSyncState('error');
      setSyncMessage(errorMessage(e));
    } finally {
      syncPromiseRef.current = null;
    }
  }, [markSyncOk, uploadMissingRecords]);

  const refreshRemote = useCallback((options: { force?: boolean } = {}) => {
    if (syncPromiseRef.current) return syncPromiseRef.current;
    const now = Date.now();
    if (!options.force && lastSyncStartedAtRef.current > 0 && now - lastSyncStartedAtRef.current < SYNC_THROTTLE_MS) {
      return Promise.resolve();
    }
    lastSyncStartedAtRef.current = now;
    syncPromiseRef.current = runRefreshRemote();
    return syncPromiseRef.current;
  }, [runRefreshRemote]);

  useEffect(() => {
    void refreshRemote({ force: true });
    const handleOnline = () => {
      void refreshRemote({ force: true });
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshRemote({ force: true });
      }
    };

    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshRemote]);

  const addRecord = useCallback(async (payload: BuildRecordPayload) => {
    const record = buildRecord(payload);
    const next = prependRecord(listRef.current, record);
    listRef.current = next;
    setList(next);
    saveHistory(next);
    enqueuePendingSyncRecord(record);
    refreshPendingCount();
    try {
      await saveRemoteRecord(record);
      removePendingSyncRecords([record]);
      if (hasCompletedFullRemoteSync()) {
        saveHistorySyncSince(Math.max(
          loadHistorySyncSince() || 0,
          record.ts - SYNC_SINCE_REFETCH_BUFFER_MS,
        ));
      }
      markSyncOk();
    } catch (e) {
      console.error('Failed to save remote history:', e);
      setSyncState('error');
      setSyncMessage(errorMessage(e));
    }
    return record;
  }, [markSyncOk, refreshPendingCount]);

  const clearOldest = useCallback(async (count: number) => {
    const removedRecords = listRef.current.slice(-count);
    const next = trimOldest(listRef.current, count);
    listRef.current = next;
    setList(next);
    saveHistory(next);
    removePendingSyncRecords(removedRecords);
    refreshPendingCount();
    try {
      await clearRemoteOldest(count);
      markSyncOk();
    } catch (e) {
      console.error('Failed to clear remote history:', e);
      setSyncState('error');
      setSyncMessage(errorMessage(e));
    }
  }, [markSyncOk, refreshPendingCount]);

  const clearAll = useCallback(async () => {
    const pendingRecords = loadPendingSyncRecords();
    if (pendingRecords.length > 0) {
      try {
        await saveRemoteRecords(pendingRecords);
      } catch (e) {
        console.error('Failed to upload pending records before clearing:', e);
      }
    }
    clearAllHistory();
    listRef.current = [];
    setList([]);
    setPendingCount(0);
    setLastSyncedAt(null);
    try {
      await clearRemoteHistory();
      markSyncOk();
    } catch (e) {
      console.error('Failed to clear remote history:', e);
      setSyncState('error');
      setSyncMessage(errorMessage(e));
    }
  }, [markSyncOk]);

  const clearLowAccuracy = useCallback(async () => {
    const oldList = listRef.current;
    const next = removeLowAccuracyHistory(oldList, LOW_ACCURACY_THRESHOLD);
    listRef.current = next;
    setList(next);
    saveHistory(next);
    const keptKeys = new Set(next.map(historyRecordKey));
    removePendingSyncRecords(oldList.filter((record) => !keptKeys.has(historyRecordKey(record))));
    refreshPendingCount();
    try {
      await clearRemoteLowAccuracy(LOW_ACCURACY_THRESHOLD);
      markSyncOk();
    } catch (e) {
      console.error('Failed to clear low accuracy remote history:', e);
      setSyncState('error');
      setSyncMessage(errorMessage(e));
    }
  }, [markSyncOk, refreshPendingCount]);

  return {
    list,
    listRef,
    syncState,
    syncMessage,
    pendingCount,
    lastSyncedAt,
    refreshRemote,
    addRecord,
    clearOldest,
    clearAll,
    clearLowAccuracy,
  };
}

export function useChart(historyList: HistoryRecord[]) {
  const [showChart, setShowChart] = useState(false);
  const [chartTab, setChartTab] = useState('');
  const [availableModes, setAvailableModes] = useState<string[]>([]);
  const chartInstanceRef = useRef<EChartsType | null>(null);

  const renderChart = useCallback((modeName: string) => {
    const dom = document.getElementById('accChart');
    if (!dom || !modeName) return;
    if (chartInstanceRef.current) chartInstanceRef.current.dispose();
    chartInstanceRef.current = echarts.init(dom);
    const data = aggregateChartData(historyList, modeName);
    chartInstanceRef.current.setOption(buildChartOption(data));
  }, [historyList]);

  const initChart = useCallback(() => {
    const modes = Array.from(new Set(historyList.map((item) => item.modeName)));
    const first = chartTab || modes[0] || '';
    setShowChart(true);
    setAvailableModes(modes);
    setChartTab(first);
    window.setTimeout(() => renderChart(first), 0);
  }, [chartTab, historyList, renderChart]);

  const switchChartTab = useCallback((modeName: string) => {
    setChartTab(modeName);
    renderChart(modeName);
  }, [renderChart]);

  const closeChart = useCallback(() => {
    setShowChart(false);
    if (chartInstanceRef.current) {
      chartInstanceRef.current.dispose();
      chartInstanceRef.current = null;
    }
  }, []);

  const reopenIfActive = useCallback(() => {
    if (showChart) window.setTimeout(() => renderChart(chartTab), 0);
  }, [chartTab, renderChart, showChart]);

  useEffect(() => {
    const onResize = () => chartInstanceRef.current?.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chartInstanceRef.current?.dispose();
      chartInstanceRef.current = null;
    };
  }, []);

  return { showChart, chartTab, availableModes, initChart, switchChartTab, closeChart, reopenIfActive };
}

export function useExportTool(historyList: HistoryRecord[], showToast?: (title: string) => void) {
  const [showExport, setShowExport] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'text'>('csv');
  const [exportStart, setExportStart] = useState(() => oldestRecordDateStr(historyList));
  const [exportEnd, setExportEnd] = useState(() => todayStr());

  const filteredRecords = useMemo(
    () => filterByDateRange(historyList, exportStart, exportEnd),
    [exportEnd, exportStart, historyList],
  );

  const selectAllRange = useCallback(() => {
    setExportStart(oldestRecordDateStr(historyList));
    setExportEnd(todayStr());
  }, [historyList]);

  const doExport = useCallback(() => {
    if (exportStart && exportEnd && exportStart > exportEnd) {
      showToast?.('起始日期不能晚于结束日期');
      return;
    }
    if (filteredRecords.length === 0) {
      showToast?.('所选时间段没有记录');
      return;
    }
    if (exportFormat === 'text') {
      downloadTextFile(buildTextFilename(exportStart, exportEnd), buildTextReport(filteredRecords, exportStart, exportEnd));
    } else {
      downloadCsvFile(buildExportFilename(exportStart, exportEnd), buildCsv(filteredRecords));
    }
    showToast?.(`已导出 ${filteredRecords.length} 条`);
  }, [exportEnd, exportFormat, exportStart, filteredRecords, showToast]);

  return {
    showExport,
    exportFormat,
    exportStart,
    exportEnd,
    filteredCount: filteredRecords.length,
    totalCount: historyList.length,
    openExport: () => setShowExport(true),
    closeExport: () => setShowExport(false),
    setExportFormat,
    setExportStart,
    setExportEnd,
    selectAllRange,
    doExport,
  };
}

export function useGame(context: {
  viewState: ViewState;
  setViewState: (view: ViewState) => void;
  addRecord: (payload: BuildRecordPayload) => void;
}) {
  const { setViewState, addRecord } = context;
  const [currentModeKey, setCurrentModeKey] = useState('train');
  const [selectedDivisor, setSelectedDivisor] = useState(0);
  const [pool, setPool] = useState<Question[]>([]);
  const poolRef = useRef<Question[]>([]);
  const idxRef = useRef(0);
  const [current, setCurrent] = useState<Question | null>(null);
  const currentRef = useRef<Question | null>(null);
  const [input, setInput] = useState('');
  const inputRef = useRef('');
  const [inputArray, setInputArray] = useState<string[]>([]);
  const inputArrayRef = useRef<string[]>([]);
  const [decompStep, setDecompStep] = useState(0);
  const decompStepRef = useRef(0);
  const [uiHint, setUiHint] = useState('');
  const [totalText, setTotalText] = useState('0:00.0');
  const [progressText, setProgressText] = useState('1/81');
  const [qText, setQText] = useState('—');
  const [leftText, setLeftText] = useState('跳过');
  const [totalSec, setTotalSec] = useState(0);
  const [trainWrong, setTrainWrong] = useState(0);
  const trainWrongRef = useRef(0);
  const [trainSkip, setTrainSkip] = useState(0);
  const trainSkipRef = useRef(0);
  const curWrongTriesRef = useRef(0);
  const [trainLog, setTrainLog] = useState<TrainLogItem[]>([]);
  const trainLogRef = useRef<TrainLogItem[]>([]);
  const [results, setResults] = useState<ResultItem[]>([]);
  const resultsRef = useRef<ResultItem[]>([]);
  const [isHistoryReview, setIsHistoryReview] = useState(false);
  const totalStartTsRef = useRef(0);
  const qStartTsRef = useRef(0);
  const boxTimesRef = useRef<number[]>([]);
  const lastInputTsRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const modeRef = useRef(currentModeKey);
  const selectedDivisorRef = useRef(selectedDivisor);

  useEffect(() => { modeRef.current = currentModeKey; }, [currentModeKey]);
  useEffect(() => { selectedDivisorRef.current = selectedDivisor; }, [selectedDivisor]);

  const activeConfig = useMemo(
    () => resolveActiveConfig(currentModeKey, selectedDivisor),
    [currentModeKey, selectedDivisor],
  );
  const isSmallFont = !!activeConfig.isSmallFont;

  const setInputValue = (value: string) => {
    inputRef.current = value;
    setInput(value);
  };
  const setInputArrayValue = (value: string[]) => {
    inputArrayRef.current = value;
    setInputArray(value);
  };
  const setDecompStepValue = (value: number) => {
    decompStepRef.current = value;
    setDecompStep(value);
  };
  const setResultsValue = (value: ResultItem[]) => {
    resultsRef.current = value;
    setResults(value);
  };
  const setTrainLogValue = (value: TrainLogItem[]) => {
    trainLogRef.current = value;
    setTrainLog(value);
  };

  const tick = useCallback(() => {
    setTotalText(msToMMSS(Date.now() - totalStartTsRef.current));
  }, []);

  const setQuestion = useCallback((q: Question, shownIdx: number) => {
    currentRef.current = q;
    setCurrent(q);
    qStartTsRef.current = Date.now();
    lastInputTsRef.current = Date.now();
    boxTimesRef.current = [];
    setInputValue('');
    setInputArrayValue([]);
    setDecompStepValue(0);
    curWrongTriesRef.current = 0;
    setUiHint('');
    setQText(`${q.dividend}${q.symbol}${q.divisor}`);
    setProgressText(`${shownIdx}/${poolRef.current.length}`);
  }, []);

  const finish = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const seconds = (Date.now() - totalStartTsRef.current) / 1000;
    setTotalSec(seconds);
    const mode = modeRef.current;
    let summary: string;
    let detail: (ResultItem | TrainLogItem)[];
    if (mode === 'train') {
      summary = `错 ${trainWrongRef.current} / 跳 ${trainSkipRef.current}`;
      detail = trainLogRef.current;
    } else {
      const correct = resultsRef.current.filter((x) => x.ok).length;
      const total = resultsRef.current.length;
      summary = `正确率 ${Math.round((correct / total) * 100)}%`;
      detail = resultsRef.current;
    }
    setViewState('result');
    setIsHistoryReview(false);
    addRecord({
      modeKey: mode,
      modeName: getModeName(mode, selectedDivisorRef.current),
      totalSec: seconds,
      summary,
      detail,
    });
  }, [addRecord, setViewState]);

  const nextQuestion = useCallback(() => {
    if (idxRef.current >= poolRef.current.length) {
      finish();
      return;
    }
    setQuestion(poolRef.current[idxRef.current], idxRef.current + 1);
    idxRef.current += 1;
  }, [finish, setQuestion]);

  const startGame = useCallback((overrideMode?: string, overrideDivisor?: number) => {
    const mode = overrideMode || modeRef.current;
    if (mode === RELATION_EXPR_ENTRY_MODE) {
      setViewState('selectRelationVersion');
      return;
    }
    const divisor = overrideDivisor ?? selectedDivisorRef.current;
    const cfg = resolveActiveConfig(mode, divisor);
    if (!cfg.gen) return;
    const nextPool = cfg.gen(10, { divisor });
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    modeRef.current = mode;
    selectedDivisorRef.current = divisor;
    setCurrentModeKey(mode);
    setSelectedDivisor(divisor);
    setViewState('game');
    poolRef.current = nextPool;
    setPool(nextPool);
    idxRef.current = 0;
    setInputValue('');
    setInputArrayValue([]);
    setUiHint('');
    setLeftText(mode === 'train' ? '跳过' : '重开');
    totalStartTsRef.current = Date.now();
    qStartTsRef.current = 0;
    setTotalSec(0);
    trainWrongRef.current = 0;
    trainSkipRef.current = 0;
    setTrainWrong(0);
    setTrainSkip(0);
    curWrongTriesRef.current = 0;
    setTrainLogValue([]);
    setResultsValue([]);
    setIsHistoryReview(false);
    timerRef.current = window.setInterval(tick, 100);
    setQuestion(nextPool[0], 1);
    idxRef.current = 1;
  }, [setQuestion, setViewState, tick]);

  const selectDivisorAndStart = useCallback((d: number) => startGame('firstSpec', d), [startGame]);
  const selectBigNineDivisorAndStart = useCallback((d: number) => startGame('bigNineDivSpec', d), [startGame]);
  const selectRelationVersionAndStart = useCallback((version: '1.0' | '2.0') => {
    startGame(version === '1.0' ? 'relationExprV1' : 'relationExprV2');
  }, [startGame]);

  const pressDigit = useCallback((d: number | string) => {
    const mode = modeRef.current;
    if (MULTI_BOX_MODES.includes(mode)) {
      if (inputArrayRef.current.length >= 2) return;
      const now = Date.now();
      boxTimesRef.current.push(now - lastInputTsRef.current);
      lastInputTsRef.current = now;
      const next = [...inputArrayRef.current, String(d)];
      setInputArrayValue(next);
      setInputValue(next.join(','));
      return;
    }
    const cur = inputRef.current || '';
    let maxLen = 6;
    if (mode === 'divScale' || mode === 'digitDetermine') maxLen = 4;
    if (mode === RATIO_EXPR_MODE) maxLen = 14;
    if (RELATION_EXPR_MODES.includes(mode)) maxLen = 2;
    if (cur.length >= maxLen) return;
    if (RELATION_EXPR_MODES.includes(mode) && !/^[1-9]$/.test(String(d))) return;
    if (STAGE_TIMED_MODES.includes(mode)) {
      const now = Date.now();
      boxTimesRef.current.push(now - lastInputTsRef.current);
      lastInputTsRef.current = now;
    }
    setInputValue(cur + String(d));
  }, []);

  const pressDot = useCallback(() => {
    const mode = modeRef.current;
    if (RELATION_EXPR_MODES.includes(mode)) {
      const cur = inputRef.current || '';
      if (cur.includes('多') || cur.includes('少') || cur.length >= 2) return;
      setInputValue(`${cur}多`);
      return;
    }
    if (mode === RATIO_EXPR_MODE) {
      const cur = inputRef.current || '';
      const commaCount = (cur.match(/,/g) || []).length;
      if (!cur || cur.endsWith(',') || commaCount >= 3 || cur.length >= 14) return;
      setInputValue(`${cur},`);
      return;
    }
    if (mode === 'divScale' || MULTI_BOX_MODES.includes(mode) || mode === 'digitDetermine' || STEPPED_MODES.includes(mode)) return;
    let cur = inputRef.current || '';
    if (cur.length >= 6 || cur.includes('.')) return;
    if (cur === '') cur += '0';
    setInputValue(cur + '.');
  }, []);

  const pressMinus = useCallback(() => {
    const mode = modeRef.current;
    if (!RELATION_EXPR_MODES.includes(mode)) return;
    const cur = inputRef.current || '';
    if (cur.includes('多') || cur.includes('少') || cur.length >= 2) return;
    setInputValue(`${cur}少`);
  }, []);

  const clearInput = useCallback(() => {
    const mode = modeRef.current;
    setInputValue('');
    if (MULTI_BOX_MODES.includes(mode) || mode === 'digitDetermine') {
      setInputArrayValue([]);
      boxTimesRef.current = [];
      lastInputTsRef.current = Date.now();
    } else if (STEPPED_MODES.includes(mode)) {
      lastInputTsRef.current = Date.now();
    }
  }, []);

  const backspace = useCallback(() => {
    const mode = modeRef.current;
    if (MULTI_BOX_MODES.includes(mode)) {
      const arr = inputArrayRef.current;
      if (arr.length > 0) {
        const next = arr.slice(0, -1);
        setInputArrayValue(next);
        setInputValue(next.join(','));
        boxTimesRef.current.pop();
        lastInputTsRef.current = Date.now();
      }
      return;
    }
    if (STEPPED_MODES.includes(mode)) {
      if (inputRef.current.length > 0) {
        setInputValue(inputRef.current.slice(0, -1));
      } else if (decompStepRef.current > 0) {
        setDecompStepValue(decompStepRef.current - 1);
        const arr = inputArrayRef.current.slice();
        const popped = arr.pop();
        setInputValue(popped ?? '');
        setInputArrayValue(arr);
        boxTimesRef.current.pop();
        lastInputTsRef.current = Date.now();
      }
      return;
    }
    if (mode === 'digitDetermine') {
      if (inputRef.current.length > 0) {
        boxTimesRef.current.pop();
        lastInputTsRef.current = Date.now();
        setInputValue(inputRef.current.slice(0, -1));
      }
      return;
    }
    setInputValue(inputRef.current.slice(0, -1));
  }, []);

  const leftAction = useCallback(() => {
    if (modeRef.current !== 'train') {
      startGame();
      return;
    }
    const cur = currentRef.current;
    if (!cur) return;
    const used = (Date.now() - qStartTsRef.current) / 1000;
    setTrainLogValue([...trainLogRef.current, {
      q: `${cur.dividend}${cur.symbol}${cur.divisor}`,
      usedStr: used.toFixed(1) + 's',
      wrong: curWrongTriesRef.current,
      skipped: true,
    }]);
    trainSkipRef.current += 1;
    setTrainSkip(trainSkipRef.current);
    nextQuestion();
  }, [nextQuestion, startGame]);

  const buildDetailTimes = (mode: string) => {
    const times = boxTimesRef.current;
    if (MULTI_BOX_MODES.includes(mode)) {
      return { detailTimes: `百位 ${(times[0] || 0) / 1000}s 十位 ${(times[1] || 0) / 1000}s` };
    }
    if (mode === 'digitDetermine') {
      return { detailTimes: times.map((t, i) => `${i + 1}:${(t / 1000).toFixed(1)}s`).join(' ') };
    }
    if (mode === 'decompAdd') {
      return { detailTimes: `十位:${((times[0] || 0) / 1000).toFixed(1)}s 个位:${((times[1] || 0) / 1000).toFixed(1)}s 总和:${((times[2] || 0) / 1000).toFixed(1)}s` };
    }
    if (mode === 'pairMult') {
      return { detailTimes: `左:${((times[0] || 0) / 1000).toFixed(1)}s 右:${((times[1] || 0) / 1000).toFixed(1)}s` };
    }
    if (mode === 'firstDiffBorrow') {
      return { detailTimes: `准确:${((times[0] || 0) / 1000).toFixed(1)}s 退位:${((times[1] || 0) / 1000).toFixed(1)}s` };
    }
    if (mode === 'middleDiffBorrow') {
      return { detailTimes: `直接:${((times[0] || 0) / 1000).toFixed(1)}s 借位后:${((times[1] || 0) / 1000).toFixed(1)}s` };
    }
    return {};
  };

  const resetCurrentInput = (mode: string) => {
    setInputValue('');
    setInputArrayValue([]);
    if (MULTI_BOX_MODES.includes(mode) || STEPPED_MODES.includes(mode)) {
      boxTimesRef.current = [];
      lastInputTsRef.current = Date.now();
    }
    if (STEPPED_MODES.includes(mode)) setDecompStepValue(0);
  };

  const confirmAnswer = useCallback(() => {
    const mode = modeRef.current;
    const cur = currentRef.current;
    if (!cur) return;
    const cfg: GameModeConfig = resolveActiveConfig(mode, selectedDivisorRef.current);

    if (STEPPED_MODES.includes(mode)) {
      if (!inputRef.current) return;
      const now = Date.now();
      boxTimesRef.current.push(now - lastInputTsRef.current);
      lastInputTsRef.current = now;
      const nextInputArray = [...inputArrayRef.current, inputRef.current];
      setInputArrayValue(nextInputArray);
      setInputValue('');
      const maxStep = mode === 'decompAdd' ? 2 : 1;
      if (decompStepRef.current < maxStep) {
        setDecompStepValue(decompStepRef.current + 1);
        return;
      }
    }

    if (!inputRef.current && !MULTI_BOX_MODES.includes(mode) && !STEPPED_MODES.includes(mode)) return;
    if (MULTI_BOX_MODES.includes(mode) && inputArrayRef.current.length === 0) return;
    if (MULTI_BOX_MODES.includes(mode) && inputArrayRef.current.length < 2) {
      setUiHint('请填满百位和十位选项');
      return;
    }
    if (mode === 'divScale' && inputRef.current.length < 4) {
      setUiHint('请填满三位数和一位数');
      return;
    }

    const numericInput = mode === 'decompAdd' ? 0 : parseFloat(inputRef.current);
    const used = (Date.now() - qStartTsRef.current) / 1000;
    let yourAnsStr = inputRef.current;
    let extraInfo: Record<string, unknown> = {};
    if (MULTI_BOX_MODES.includes(mode)) yourAnsStr = `${inputArrayRef.current.join(' ')} 0`;
    if (mode === 'decompAdd') yourAnsStr = `${inputArrayRef.current[0]}, ${inputArrayRef.current[1]}, ${inputArrayRef.current[2]}`;
    if (mode === 'pairMult') yourAnsStr = `${inputArrayRef.current[0]}, ${inputArrayRef.current[1]}`;
    if (mode === 'firstDiffBorrow') yourAnsStr = `准确 ${inputArrayRef.current[0]}, 退位 ${inputArrayRef.current[1]}`;
    if (mode === 'middleDiffBorrow') yourAnsStr = `直接 ${inputArrayRef.current[0]}, 借位后 ${inputArrayRef.current[1]}`;
    if (mode === 'divScale') yourAnsStr = `${inputRef.current.slice(0, 3)}÷${inputRef.current.slice(3, 4)}`;
    extraInfo = { ...extraInfo, ...buildDetailTimes(mode) };

    let correct = false;
    let realAnsDisplay = String(cur.ans);
    if (cfg.check) {
      const checkResult: CheckResult = cfg.check(numericInput, cur.ans, inputRef.current, inputArrayRef.current);
      correct = checkResult.ok;
      realAnsDisplay = checkResult.display;
      if (checkResult.exactAns !== undefined) {
        extraInfo = { ...extraInfo, exactAns: checkResult.exactAns, errorRate: checkResult.errorRate };
        if (checkResult.exactDividend !== undefined) extraInfo.exactDividend = checkResult.exactDividend;
      }
    } else {
      correct = parseInt(inputRef.current, 10) === cur.ans;
    }

    if (mode === 'train') {
      if (correct) {
        setTrainLogValue([...trainLogRef.current, {
          q: `${cur.dividend}${cur.symbol}${cur.divisor}`,
          usedStr: used.toFixed(1) + 's',
          wrong: curWrongTriesRef.current,
          skipped: false,
        }]);
        nextQuestion();
      } else {
        trainWrongRef.current += 1;
        setTrainWrong(trainWrongRef.current);
        curWrongTriesRef.current += 1;
        resetCurrentInput(mode);
        setUiHint(`错误，答案是 ${realAnsDisplay}`);
      }
      return;
    }

    if (ESTIMATE_MODES.includes(mode)) {
      const exact = (cur.dividend as number) / (cur.divisor as number);
      const error = Math.abs(numericInput - exact) / exact;
      extraInfo = {
        ...extraInfo,
        exactAns: Number.isInteger(exact) ? String(exact) : exact.toFixed(1),
        errorRate: (error * 100).toFixed(2) + '%',
      };
    }

    setResultsValue([...resultsRef.current, {
      q: `${cur.dividend}${cur.symbol}${cur.divisor}`,
      ok: correct,
      yourAns: yourAnsStr,
      realAns: realAnsDisplay,
      usedStr: used.toFixed(1) + 's',
      exactAns: extraInfo.exactAns as string | undefined,
      errorRate: extraInfo.errorRate as string | undefined,
      exactDividend: extraInfo.exactDividend as string | undefined,
      detailTimes: extraInfo.detailTimes as string | undefined,
    }]);
    nextQuestion();
  }, [nextQuestion]);

  const goHome = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setViewState('home');
  }, [setViewState]);

  const viewHistoryDetail = useCallback((record: HistoryRecord) => {
    if (!record) return;
    setCurrentModeKey(record.mode);
    modeRef.current = record.mode;
    setTotalSec(parseFloat(record.duration.replace('s', '')));
    if (record.mode === 'train') {
      setTrainLogValue(record.detail as TrainLogItem[]);
      setResultsValue([]);
    } else {
      setResultsValue(record.detail as ResultItem[]);
      setTrainLogValue([]);
    }
    setViewState('result');
    setIsHistoryReview(true);
  }, [setViewState]);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
  }, []);

  const resultTitle = activeConfig.title || '训练完成';
  const resultMeta = currentModeKey === 'train'
    ? `用时 ${totalSec.toFixed(1)}s · 错误 ${trainWrong} · 跳过 ${trainSkip}`
    : `正确 ${results.filter((x) => x.ok).length}/${results.length} · 总用时 ${totalSec.toFixed(1)}s`;

  return {
    currentModeKey,
    selectedDivisor,
    setMode: (mode: string) => setCurrentModeKey(mode),
    input,
    inputArray,
    decompStep,
    uiHint,
    totalText,
    progressText,
    qText,
    leftText,
    trainLog,
    results,
    isHistoryReview,
    activeConfig,
    isSmallFont,
    resultTitle,
    resultMeta,
    pool,
    current,
    toSelectDivisor: () => setViewState('selectDivisor'),
    toSelectBigNineDivisor: () => setViewState('selectBigNineDivisor'),
    selectDivisorAndStart,
    selectBigNineDivisorAndStart,
    selectRelationVersionAndStart,
    startGame: () => startGame(),
    pressDigit,
    pressDot,
    pressMinus,
    clearInput,
    backspace,
    leftAction,
    confirmAnswer,
    goHome,
    viewHistoryDetail,
  };
}

export function useThreeScene(setViewState: (view: ViewState) => void) {
  const [cubicMode, setCubicMode] = useState<'block' | 'section'>('block');
  const cubicModeRef = useRef<'block' | 'section'>('block');
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const isDeleteModeRef = useRef(false);
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [sliceMenuCollapsed, setSliceMenuCollapsed] = useState(false);
  const [currentShapeName, setCurrentShapeName] = useState('正方体');
  const colors = ['#4F86A3', '#4A6F4F', '#7A5A30', '#3F3A5C'];
  const [selectedColor, setSelectedColor] = useState('#4F86A3');
  const selectedColorRef = useRef('#4F86A3');
  const [sliceConfig, setSliceConfigState] = useState<SliceConfig>(DEFAULT_SLICE);
  const sliceConfigRef = useRef<SliceConfig>(DEFAULT_SLICE);
  const handleRef = useRef<ThreeHandle | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const downTimeRef = useRef(0);
  const pendingModeRef = useRef<'block' | 'section' | null>(null);
  const resizeHandlerRef = useRef<(() => void) | null>(null);

  useEffect(() => { isDeleteModeRef.current = isDeleteMode; }, [isDeleteMode]);
  useEffect(() => { selectedColorRef.current = selectedColor; }, [selectedColor]);
  useEffect(() => { cubicModeRef.current = cubicMode; }, [cubicMode]);

  const setSliceConfig = useCallback((patch: Partial<SliceConfig>) => {
    const next = { ...sliceConfigRef.current, ...patch };
    sliceConfigRef.current = next;
    setSliceConfigState(next);
    if (handleRef.current?.csg) updateSlice(handleRef.current, next);
  }, []);

  const resetSlice = useCallback(() => setSliceConfig(DEFAULT_SLICE), [setSliceConfig]);

  const cleanup = useCallback(() => {
    const handle = handleRef.current;
    if (resizeHandlerRef.current) {
      window.removeEventListener('resize', resizeHandlerRef.current);
      resizeHandlerRef.current = null;
    }
    if (!handle) return;
    disposeScene(handle, containerRef.current);
    handleRef.current = null;
    containerRef.current = null;
  }, []);

  const internalClearCubes = useCallback(() => {
    if (handleRef.current) clearVoxels(handleRef.current);
  }, []);

  const loadExamShape = useCallback((shapeConf: ExamShapeDef) => {
    internalClearCubes();
    setShowShapeMenu(false);
    setCurrentShapeName(shapeConf.name);
    sliceConfigRef.current = DEFAULT_SLICE;
    setSliceConfigState(DEFAULT_SLICE);
    if (handleRef.current) {
      loadShape(handleRef.current, shapeConf);
      updateSlice(handleRef.current, DEFAULT_SLICE);
    }
  }, [internalClearCubes]);

  const mountContainer = useCallback((container: HTMLDivElement | null) => {
    if (!container) return;
    const mode = pendingModeRef.current || cubicModeRef.current;
    cleanup();
    containerRef.current = container;
    requestAnimationFrame(() => {
      if (!containerRef.current) return;
      if (container.clientWidth === 0 || container.clientHeight === 0) return;
      const handle = createScene(container, { showGrid: mode === 'block' });
      handleRef.current = handle;

      const onPointerDown = () => { downTimeRef.current = Date.now(); };
      const onPointerUp = (event: PointerEvent) => {
        if (Date.now() - downTimeRef.current >= 200) return;
        if (cubicModeRef.current === 'section' || !handleRef.current) return;
        handleVoxelClick(handleRef.current, event, {
          isDeleteMode: isDeleteModeRef.current,
          selectedColor: selectedColorRef.current,
        });
      };

      const resize = () => {
        const active = handleRef.current;
        if (!active || !containerRef.current) return;
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        if (width === 0 || height === 0) return;
        const aspect = width / height;
        const d = 16;
        active.camera.left = -d * aspect;
        active.camera.right = d * aspect;
        active.camera.top = d;
        active.camera.bottom = -d;
        active.camera.updateProjectionMatrix();
        active.renderer.setSize(width, height);
      };

      handle.renderer.domElement.addEventListener('pointerdown', onPointerDown);
      handle.renderer.domElement.addEventListener('pointerup', onPointerUp);
      resizeHandlerRef.current = resize;
      window.addEventListener('resize', resize);
      resize();
      animateLoop(handle);
      if (mode === 'section') loadExamShape(EXAM_SHAPES.basic[0]);
      if (handle.gridHelper) handle.gridHelper.visible = mode === 'block';
      pendingModeRef.current = null;
    });
  }, [cleanup, loadExamShape]);

  const startCubicMode = useCallback((mode: 'block' | 'section' = 'block') => {
    pendingModeRef.current = mode;
    setCubicMode(mode);
    cubicModeRef.current = mode;
    setViewState('cubic');
    setSliceMenuCollapsed(false);
    sliceConfigRef.current = DEFAULT_SLICE;
    setSliceConfigState(DEFAULT_SLICE);
  }, [setViewState]);

  const quitCubicMode = useCallback(() => {
    cleanup();
    setViewState('home');
    setIsDeleteMode(false);
    setShowShapeMenu(false);
  }, [cleanup, setViewState]);

  useEffect(() => cleanup, [cleanup]);

  return {
    cubicMode,
    isDeleteMode,
    showShapeMenu,
    sliceMenuCollapsed,
    currentShapeName,
    colors,
    selectedColor,
    sliceConfig,
    examShapes: EXAM_SHAPES,
    setShowShapeMenu,
    setSliceMenuCollapsed,
      startCubicMode,
      mountContainer,
    quitCubicMode,
    switchColor: (c: string) => {
      setSelectedColor(c);
      selectedColorRef.current = c;
      setIsDeleteMode(false);
    },
    toggleDeleteMode: () => setIsDeleteMode((v) => !v),
    setCameraView: (type: 'front' | 'left' | 'top' | 'iso') => sceneSetCameraView(handleRef.current, type),
    lookAtSection: () => {
      if (handleRef.current) csgLookAtSection(handleRef.current, sliceConfigRef.current);
    },
    loadExamShape,
    clearCubes: internalClearCubes,
    resetSlice,
    updateSliceConfig: setSliceConfig,
    cleanup,
  };
}

import type { HistoryRecord, BuildRecordPayload } from '../types';
import { formatTime } from './formatters';

const STORAGE_KEY = 'calc_history';

export const loadHistory = (): HistoryRecord[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as HistoryRecord[];
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const saveHistory = (list: HistoryRecord[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save history:', e);
  }
};

export const clearAllHistory = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear history:', e);
  }
};

export const prependRecord = (list: HistoryRecord[], record: HistoryRecord): HistoryRecord[] => {
  return [record, ...list];
};

export const trimOldest = (list: HistoryRecord[], count: number): HistoryRecord[] => {
  const keep = list.length - count;
  return keep > 0 ? list.slice(0, keep) : [];
};

export const limitHistory = (list: HistoryRecord[]): HistoryRecord[] => list;

export const historyRecordKey = (record: HistoryRecord): string =>
  `${record.ts}_${record.mode}_${record.summary}_${record.duration}`;

export const mergeHistory = (...groups: HistoryRecord[][]): HistoryRecord[] => {
  const map = new Map<string, HistoryRecord>();
  groups.flat().forEach((record) => {
    if (!record || typeof record.ts !== 'number') return;
    const key = historyRecordKey(record);
    if (!map.has(key)) map.set(key, record);
  });
  return Array.from(map.values()).sort((a, b) => b.ts - a.ts);
};

export const getAccuracyPercent = (record: HistoryRecord): number | null => {
  const fromSummary = record.summary.match(/正确率\s*(\d+(?:\.\d+)?)%/);
  if (fromSummary) return Number(fromSummary[1]);

  const graded = record.detail.filter((item) => 'ok' in item && typeof item.ok === 'boolean');
  if (graded.length === 0) return null;
  const correct = graded.filter((item) => item.ok).length;
  return (correct / graded.length) * 100;
};

export const removeLowAccuracyHistory = (list: HistoryRecord[], thresholdPercent: number): HistoryRecord[] =>
  list.filter((record) => {
    const accuracy = getAccuracyPercent(record);
    return accuracy === null || accuracy >= thresholdPercent;
  });

export const buildRecord = (payload: BuildRecordPayload): HistoryRecord => {
  const ts = Date.now();
  return {
    ts,
    timeStr: formatTime(ts),
    mode: payload.modeKey,
    modeName: payload.modeName,
    duration: payload.totalSec.toFixed(1) + 's',
    summary: payload.summary,
    detail: payload.detail,
  };
};

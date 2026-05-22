import type { HistoryRecord, BuildRecordPayload } from '../types';
import { formatTime } from './formatters';

const STORAGE_KEY = 'calc_history';
const MAX_RECORDS = 5000;

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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitHistory(list)));
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
  const next = [record, ...list];
  return limitHistory(next);
};

export const trimOldest = (list: HistoryRecord[], count: number): HistoryRecord[] => {
  const keep = list.length - count;
  return keep > 0 ? list.slice(0, keep) : [];
};

export const limitHistory = (list: HistoryRecord[]): HistoryRecord[] =>
  list.length > MAX_RECORDS ? list.slice(0, MAX_RECORDS) : list;

export const historyRecordKey = (record: HistoryRecord): string =>
  `${record.ts}_${record.mode}_${record.summary}_${record.duration}`;

export const mergeHistory = (...groups: HistoryRecord[][]): HistoryRecord[] => {
  const map = new Map<string, HistoryRecord>();
  groups.flat().forEach((record) => {
    if (!record || typeof record.ts !== 'number') return;
    const key = historyRecordKey(record);
    if (!map.has(key)) map.set(key, record);
  });
  return limitHistory(Array.from(map.values()).sort((a, b) => b.ts - a.ts));
};

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

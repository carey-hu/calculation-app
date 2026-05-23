import type { HistoryRecord, BuildRecordPayload } from '../types';
import { formatTime } from './formatters';

const STORAGE_KEY = 'calc_history';
const SYNC_SINCE_KEY = 'calc_history_sync_since';
const PENDING_SYNC_KEY = 'calc_history_pending_sync';
const AUTHORITATIVE_SYNC_KEY = 'calc_history_authoritative_sync_v1';

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
    localStorage.removeItem(SYNC_SINCE_KEY);
    localStorage.removeItem(PENDING_SYNC_KEY);
  } catch (e) {
    console.error('Failed to clear history:', e);
  }
};

export const loadHistorySyncSince = (): number | null => {
  const raw = localStorage.getItem(SYNC_SINCE_KEY);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
};

export const saveHistorySyncSince = (ts: number): void => {
  if (!Number.isFinite(ts) || ts <= 0) return;
  try {
    localStorage.setItem(SYNC_SINCE_KEY, String(ts));
  } catch (e) {
    console.error('Failed to save history sync marker:', e);
  }
};

export const loadPendingSyncRecords = (): HistoryRecord[] => {
  const raw = localStorage.getItem(PENDING_SYNC_KEY);
  if (!raw) return [];
  try {
    const records = JSON.parse(raw) as HistoryRecord[];
    return Array.isArray(records) ? records : [];
  } catch (e) {
    console.error('Failed to load pending history sync records:', e);
    return [];
  }
};

export const savePendingSyncRecords = (records: HistoryRecord[]): void => {
  try {
    const deduped = mergeHistory(records);
    if (deduped.length === 0) {
      localStorage.removeItem(PENDING_SYNC_KEY);
      return;
    }
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(deduped));
  } catch (e) {
    console.error('Failed to save pending history sync records:', e);
  }
};

export const enqueuePendingSyncRecord = (record: HistoryRecord): void => {
  savePendingSyncRecords([record, ...loadPendingSyncRecords()]);
};

export const removePendingSyncRecords = (records: HistoryRecord[]): void => {
  const uploadedKeys = new Set(records.map(historyRecordKey));
  savePendingSyncRecords(loadPendingSyncRecords().filter((record) => !uploadedKeys.has(historyRecordKey(record))));
};

export const hasCompletedAuthoritativeSync = (): boolean =>
  localStorage.getItem(AUTHORITATIVE_SYNC_KEY) === '1';

export const markAuthoritativeSyncComplete = (): void => {
  try {
    localStorage.setItem(AUTHORITATIVE_SYNC_KEY, '1');
  } catch (e) {
    console.error('Failed to mark authoritative history sync complete:', e);
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

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
  const next = [record, ...list];
  return next.length > MAX_RECORDS ? next.slice(0, MAX_RECORDS) : next;
};

export const trimOldest = (list: HistoryRecord[], count: number): HistoryRecord[] => {
  const keep = list.length - count;
  return keep > 0 ? list.slice(0, keep) : [];
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

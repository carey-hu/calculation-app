import type { HistoryRecord } from '../types';
import { recordTs } from './formatters';

// ---- date string helpers ----

const pad2 = (n: number) => (n < 10 ? '0' + n : String(n));

export const todayStr = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

export const daysAgoStr = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

export const tsToDateStr = (ts: number): string => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

export const fullTimeStr = (ts: number): string => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} `
    + `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
};

export const ymdKey = (ts: number): string => tsToDateStr(ts);

export const cnDateLabel = (ts: number): string => {
  const d = new Date(ts);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
};

// ---- date-boundary / range helpers ----

export const dateBoundary = (dateStr: string, endOfDay: boolean): number | null => {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map((x) => parseInt(x, 10));
  if (!y || !m || !d) return null;
  return endOfDay
    ? new Date(y, m - 1, d, 23, 59, 59, 999).getTime()
    : new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
};

export const oldestRecordTs = (records: HistoryRecord[]): number | null => {
  let oldest: number | null = null;
  for (const r of records) {
    const ts = recordTs(r);
    if (ts === null) continue;
    if (oldest === null || ts < oldest) oldest = ts;
  }
  return oldest;
};

export const oldestRecordDateStr = (records: HistoryRecord[]): string => {
  const oldest = oldestRecordTs(records);
  return oldest !== null ? tsToDateStr(oldest) : daysAgoStr(7);
};

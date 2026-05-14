import type { HistoryRecord } from '../types';

export const msToMMSS = (ms: number): string => {
  const totalSec = ms / 1000;
  const m = Math.floor(totalSec / 60);
  const s = (totalSec % 60).toFixed(1);
  return `${m}:${s.length < 4 ? '0' + s : s}`;
};

export const formatTime = (ts: number): string => {
  const date = new Date(ts);
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const h = date.getHours();
  const min = date.getMinutes();
  const pad = (n: number) => (n < 10 ? '0' + n : String(n));
  return `${m}/${d} ${pad(h)}:${pad(min)}`;
};

/** Parse "12.3s" → 12.3, shared by export-excel & export-text. */
export const parseDuration = (s: string): number => {
  const n = parseFloat(String(s || '').replace(/s$/i, ''));
  return Number.isFinite(n) ? n : 0;
};

/** Safely extract numeric ts from a record (handles legacy string timestamps). */
export const recordTs = (r: HistoryRecord): number | null => {
  if (typeof r.ts === 'number' && Number.isFinite(r.ts)) return r.ts;
  if (typeof r.ts === 'string') {
    const n = Number(r.ts);
    if (Number.isFinite(n)) return n;
  }
  return null;
};

/** Download a blob as a file (shared boilerplate for CSV and text export). */
export const downloadFile = (filename: string, content: string, mimeType: string): void => {
  const bom = mimeType.includes('csv') ? '﻿' : '';
  const blob = new Blob([bom + content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
};

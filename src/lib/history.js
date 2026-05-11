import { formatTime } from './formatters';

const STORAGE_KEY = 'calc_history';
const MAX_RECORDS = 5000;

export const loadHistory = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const saveHistory = (list) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
};

export const clearAllHistory = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const prependRecord = (list, record) => {
  const next = [record, ...list];
  return next.length > MAX_RECORDS ? next.slice(0, MAX_RECORDS) : next;
};

export const trimOldest = (list, count) => {
  const keep = list.length - count;
  return keep > 0 ? list.slice(0, keep) : [];
};

export const buildRecord = ({ modeKey, modeName, totalSec, summary, detail }) => {
  const ts = Date.now();
  return {
    ts,
    timeStr: formatTime(ts),
    mode: modeKey,
    modeName,
    duration: totalSec.toFixed(1) + 's',
    summary,
    detail,
  };
};

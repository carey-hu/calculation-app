import type { HistoryRecord, ResultItem, TrainLogItem } from '../types';
import { parseDuration, downloadFile } from './formatters';
import { ymdKey, cnDateLabel } from './date-utils';

const recordAccuracy = (r: HistoryRecord): number | null => {
  const detail = Array.isArray(r.detail) ? r.detail : [];
  if (detail.length === 0) return null;
  if (r.mode === 'train') {
    const skipped = detail.filter((d) => (d as TrainLogItem).skipped).length;
    return (detail.length - skipped) / detail.length;
  }
  const correct = detail.filter((d) => (d as ResultItem).ok).length;
  return correct / detail.length;
};

const pctLabel = (rate: number | null): string =>
  (rate == null ? '—' : Math.round(rate * 100) + '%');

const formatMinutes = (totalSec: number): string => (totalSec / 60).toFixed(1);

export const buildTextReport = (
  records: HistoryRecord[],
  startDate: string,
  endDate: string,
): string => {
  const totalSecAll = records.reduce((acc, r) => acc + parseDuration(r.duration), 0);
  const totalMinAll = formatMinutes(totalSecAll);

  const byDay = new Map<string, HistoryRecord[]>();
  records.forEach((r) => {
    const key = ymdKey(r.ts);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(r);
  });
  const sortedDays = [...byDay.keys()].sort().reverse();

  const lines: string[] = [];
  const rangeLabel = (startDate && endDate)
    ? `${startDate} 至 ${endDate}`
    : '全部记录';
  lines.push(`练习统计  ${rangeLabel}`);
  lines.push('━'.repeat(36));
  lines.push(`总练习时间：${totalMinAll} 分钟`);
  lines.push(`总练习组数：${records.length} 组`);
  lines.push('');

  if (sortedDays.length === 0) {
    lines.push('（区间内无练习记录）');
    return lines.join('\n');
  }

  lines.push('—— 单日明细 ——');
  lines.push('');

  sortedDays.forEach((key) => {
    const dayRecords = byDay.get(key)!;
    const dayTotalSec = dayRecords.reduce((acc, r) => acc + parseDuration(r.duration), 0);
    const dayTotalMin = formatMinutes(dayTotalSec);
    const sampleTs = dayRecords[0].ts;

    lines.push(`【${cnDateLabel(sampleTs)}】 总练习 ${dayTotalMin} 分钟 / ${dayRecords.length} 组`);

    const byMode = new Map<string, HistoryRecord[]>();
    dayRecords.forEach((r) => {
      const name = r.modeName || r.mode || '未知模式';
      if (!byMode.has(name)) byMode.set(name, []);
      byMode.get(name)!.push(r);
    });

    [...byMode.entries()].forEach(([name, group]) => {
      const sec = group.reduce((acc, r) => acc + parseDuration(r.duration), 0).toFixed(1);
      const rates = group.map(recordAccuracy).filter((x): x is number => x != null);
      const avgRate = rates.length > 0
        ? rates.reduce((a, b) => a + b, 0) / rates.length
        : null;
      lines.push(`  · ${name} — 用时 ${sec}s, 正确率 ${pctLabel(avgRate)} (共 ${group.length} 组)`);
    });
    lines.push('');
  });

  return lines.join('\n');
};

export const buildTextFilename = (startDate: string, endDate: string): string => {
  const fmt = (s: string) => (s ? s.replace(/-/g, '') : 'all');
  return `练习统计_${fmt(startDate)}_${fmt(endDate)}.txt`;
};

export const downloadTextFile = (filename: string, content: string): void => {
  downloadFile(filename, content, 'text/plain');
};

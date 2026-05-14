import type { HistoryRecord, DetailItem, ResultItem, TrainLogItem } from '../types';
import { parseDuration, recordTs, downloadFile } from './formatters';
import { fullTimeStr, dateBoundary } from './date-utils';

export const filterByDateRange = (
  records: HistoryRecord[],
  startDate: string,
  endDate: string,
): HistoryRecord[] => {
  const startTs = dateBoundary(startDate, false);
  const endTs = dateBoundary(endDate, true);
  return records.filter((r) => {
    const ts = recordTs(r);
    if (ts === null) return false;
    if (startTs !== null && ts < startTs) return false;
    if (endTs !== null && ts > endTs) return false;
    return true;
  });
};

const csvField = (val: unknown): string => {
  if (val === null || val === undefined) return '';
  let s = String(val);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  if (/[",\r\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
};

const csvRow = (cells: unknown[]): string => cells.map(csvField).join(',');

const buildSummaryLines = (records: HistoryRecord[]): string[] => {
  const lines: string[] = [];
  lines.push(csvRow(['【训练汇总】']));
  lines.push(csvRow(['时间', '模式', '成绩', '用时(秒)', '题目数']));
  records.forEach((r) => {
    const detailLen = Array.isArray(r.detail) ? r.detail.length : 0;
    lines.push(csvRow([
      fullTimeStr(r.ts),
      r.modeName || r.mode || '',
      r.summary || '',
      parseDuration(r.duration).toFixed(1),
      detailLen,
    ]));
  });
  return lines;
};

const buildDetailLines = (records: HistoryRecord[]): string[] => {
  const lines: string[] = [];
  lines.push(csvRow(['【题目详情】']));
  lines.push(csvRow([
    '时间', '模式', '题号', '题目', '你的答案', '是否正确',
    '正确答案', '单题用时', '错误次数', '是否跳过', '分步用时',
  ]));
  records.forEach((r) => {
    const details: DetailItem[] = Array.isArray(r.detail) ? r.detail : [];
    if (details.length === 0) {
      lines.push(csvRow([
        fullTimeStr(r.ts), r.modeName || r.mode || '',
        '', '(无明细)', '', '', '', '', '', '', '',
      ]));
      return;
    }
    details.forEach((d, i) => {
      const isResult = 'ok' in d;
      const isTrain = 'skipped' in d;
      lines.push(csvRow([
        fullTimeStr(r.ts),
        r.modeName || r.mode || '',
        i + 1,
        d.q || '',
        isResult ? ((d as ResultItem).yourAns ?? '') : '',
        isResult ? ((d as ResultItem).ok ? '✓' : '✗') : '',
        isResult ? ((d as ResultItem).realAns ?? '') : '',
        d.usedStr || '',
        isTrain ? ((d as TrainLogItem).wrong ?? '') : '',
        isTrain && (d as TrainLogItem).skipped ? '是' : '',
        isResult ? ((d as ResultItem).detailTimes || '') : '',
      ]));
    });
  });
  return lines;
};

export const buildCsv = (records: HistoryRecord[]): string => {
  const lines = [
    ...buildSummaryLines(records),
    '',
    ...buildDetailLines(records),
  ];
  // CSV already has BOM from downloadFile; this returns content only.
  return lines.join('\r\n');
};

export const downloadCsvFile = (filename: string, csvContent: string): void => {
  downloadFile(filename, csvContent, 'text/csv');
};

export const buildExportFilename = (startDate: string, endDate: string): string => {
  const fmt = (s: string) => (s ? s.replace(/-/g, '') : 'all');
  return `历史记录_${fmt(startDate)}_${fmt(endDate)}.csv`;
};

// Pure-JS CSV exporter. Writes a UTF-8 BOM so Chinese characters render
// correctly when opened in Excel on Windows. CSV previews natively in iOS
// Files, Android, WeChat, Numbers, WPS, and most email/cloud clients.

const UTF8_BOM = '﻿';

const parseDuration = (s) => {
  const n = parseFloat(String(s || '').replace(/s$/i, ''));
  return Number.isFinite(n) ? n : 0;
};

const fullTimeStr = (ts) => {
  const d = new Date(ts);
  const pad = (n) => (n < 10 ? '0' + n : '' + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} `
    + `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const dateBoundary = (dateStr, endOfDay) => {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map((x) => parseInt(x, 10));
  if (!y || !m || !d) return null;
  return endOfDay
    ? new Date(y, m - 1, d, 23, 59, 59, 999).getTime()
    : new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
};

export const filterByDateRange = (records, startDate, endDate) => {
  const startTs = dateBoundary(startDate, false);
  const endTs = dateBoundary(endDate, true);
  return records.filter((r) => {
    if (typeof r.ts !== 'number') return false;
    if (startTs !== null && r.ts < startTs) return false;
    if (endTs !== null && r.ts > endTs) return false;
    return true;
  });
};

// RFC 4180: wrap a field in quotes if it contains comma, quote, CR, or LF.
// Inside quotes, escape " as "". A leading = / + / - / @ gets a leading
// apostrophe to neutralise Excel formula injection.
const csvField = (val) => {
  if (val === null || val === undefined) return '';
  let s = String(val);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  if (/[",\r\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
};

const csvRow = (cells) => cells.map(csvField).join(',');

const buildSummaryLines = (records) => {
  const lines = [];
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

const buildDetailLines = (records) => {
  const lines = [];
  lines.push(csvRow(['【题目详情】']));
  lines.push(csvRow([
    '时间', '模式', '题号', '题目', '你的答案', '是否正确',
    '正确答案', '单题用时', '错误次数', '是否跳过', '分步用时',
  ]));
  records.forEach((r) => {
    const details = Array.isArray(r.detail) ? r.detail : [];
    if (details.length === 0) {
      lines.push(csvRow([
        fullTimeStr(r.ts), r.modeName || r.mode || '',
        '', '(无明细)', '', '', '', '', '', '', '',
      ]));
      return;
    }
    details.forEach((d, i) => {
      const okStr = d.ok === undefined ? '' : (d.ok ? '✓' : '✗');
      lines.push(csvRow([
        fullTimeStr(r.ts), r.modeName || r.mode || '',
        i + 1, d.q || '',
        d.yourAns !== undefined ? d.yourAns : '',
        okStr,
        d.realAns !== undefined ? d.realAns : '',
        d.usedStr || '',
        d.wrong !== undefined ? d.wrong : '',
        d.skipped ? '是' : '',
        d.detailTimes || '',
      ]));
    });
  });
  return lines;
};

export const buildCsv = (records) => {
  const lines = [
    ...buildSummaryLines(records),
    '',
    ...buildDetailLines(records),
  ];
  return UTF8_BOM + lines.join('\r\n');
};

export const downloadCsvFile = (filename, csvContent) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
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

export const buildExportFilename = (startDate, endDate) => {
  const fmt = (s) => (s ? s.replace(/-/g, '') : 'all');
  return `历史记录_${fmt(startDate)}_${fmt(endDate)}.csv`;
};

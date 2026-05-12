// Plain-text practice report generator. Produces a human-readable summary
// of a date range: total minutes/sessions, then per-day breakdown with each
// mode's total time and accuracy.

const parseDuration = (s) => {
  const n = parseFloat(String(s || '').replace(/s$/i, ''));
  return Number.isFinite(n) ? n : 0;
};

const pad2 = (n) => (n < 10 ? '0' + n : '' + n);

const ymdKey = (ts) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const cnDateLabel = (ts) => {
  const d = new Date(ts);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
};

// Train mode lacks per-question ok flags (every question is eventually
// answered correctly or skipped), so use (total - skipped) / total. For
// every other mode, use the share of detail items with ok === true.
const recordAccuracy = (r) => {
  const detail = Array.isArray(r.detail) ? r.detail : [];
  if (detail.length === 0) return null;
  if (r.mode === 'train') {
    const skipped = detail.filter((d) => d.skipped).length;
    return (detail.length - skipped) / detail.length;
  }
  const hasOk = detail.some((d) => typeof d.ok === 'boolean');
  if (!hasOk) return null;
  const correct = detail.filter((d) => d.ok).length;
  return correct / detail.length;
};

const pctLabel = (rate) => (rate == null ? '—' : Math.round(rate * 100) + '%');

const formatMinutes = (totalSec) => (totalSec / 60).toFixed(1);

export const buildTextReport = (records, startDate, endDate) => {
  const totalSecAll = records.reduce((acc, r) => acc + parseDuration(r.duration), 0);
  const totalMinAll = formatMinutes(totalSecAll);

  const byDay = new Map();
  records.forEach((r) => {
    const key = ymdKey(r.ts);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(r);
  });
  const sortedDays = [...byDay.keys()].sort().reverse();

  const lines = [];
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
    const dayRecords = byDay.get(key);
    const dayTotalSec = dayRecords.reduce((acc, r) => acc + parseDuration(r.duration), 0);
    const dayTotalMin = formatMinutes(dayTotalSec);
    const sampleTs = dayRecords[0].ts;

    lines.push(`【${cnDateLabel(sampleTs)}】 总练习 ${dayTotalMin} 分钟 / ${dayRecords.length} 组`);

    const byMode = new Map();
    dayRecords.forEach((r) => {
      const name = r.modeName || r.mode || '未知模式';
      if (!byMode.has(name)) byMode.set(name, []);
      byMode.get(name).push(r);
    });

    [...byMode.entries()].forEach(([name, group]) => {
      const sec = group.reduce((acc, r) => acc + parseDuration(r.duration), 0).toFixed(1);
      const rates = group.map(recordAccuracy).filter((x) => x != null);
      const avgRate = rates.length > 0
        ? rates.reduce((a, b) => a + b, 0) / rates.length
        : null;
      lines.push(`  · ${name} — 用时 ${sec}s, 正确率 ${pctLabel(avgRate)} (共 ${group.length} 组)`);
    });
    lines.push('');
  });

  return lines.join('\n');
};

export const buildTextFilename = (startDate, endDate) => {
  const fmt = (s) => (s ? s.replace(/-/g, '') : 'all');
  return `练习统计_${fmt(startDate)}_${fmt(endDate)}.txt`;
};

const UTF8_BOM = '﻿';

export const downloadTextFile = (filename, content) => {
  const blob = new Blob([UTF8_BOM + content], { type: 'text/plain;charset=utf-8' });
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

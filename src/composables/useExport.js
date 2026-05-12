import { ref, computed } from 'vue';
import {
  filterByDateRange,
  buildCsv,
  downloadCsvFile,
  buildExportFilename,
} from '../lib/export-excel';
import {
  buildTextReport,
  buildTextFilename,
  downloadTextFile,
} from '../lib/export-text';

const todayStr = () => {
  const d = new Date();
  const pad = (n) => (n < 10 ? '0' + n : '' + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const daysAgoStr = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const pad = (x) => (x < 10 ? '0' + x : '' + x);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const tsToDateStr = (ts) => {
  const d = new Date(ts);
  const pad = (x) => (x < 10 ? '0' + x : '' + x);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Some old records may store ts as a numeric string; coerce defensively.
const recordTs = (r) => {
  if (typeof r.ts === 'number' && Number.isFinite(r.ts)) return r.ts;
  if (typeof r.ts === 'string') {
    const n = Number(r.ts);
    if (Number.isFinite(n)) return n;
  }
  return null;
};

const oldestRecordTs = (records) => {
  let oldest = null;
  for (const r of records) {
    const ts = recordTs(r);
    if (ts === null) continue;
    if (oldest === null || ts < oldest) oldest = ts;
  }
  return oldest;
};

const oldestRecordDateStr = (records) => {
  const oldest = oldestRecordTs(records);
  return oldest !== null ? tsToDateStr(oldest) : daysAgoStr(7);
};

export function useExport({ historyListRef, showToast }) {
  const showExport = ref(false);
  const exportFormat = ref('csv');
  // Default range spans every existing record so old data is visible without
  // the user having to widen the picker manually.
  const exportStart = ref(oldestRecordDateStr(historyListRef.value));
  const exportEnd = ref(todayStr());

  const filteredRecords = computed(() => filterByDateRange(
    historyListRef.value,
    exportStart.value,
    exportEnd.value,
  ));

  const filteredCount = computed(() => filteredRecords.value.length);
  const totalCount = computed(() => historyListRef.value.length);

  const openExport = () => { showExport.value = true; };
  const closeExport = () => { showExport.value = false; };
  const setExportFormat = (f) => { exportFormat.value = f; };

  const selectAllRange = () => {
    exportStart.value = oldestRecordDateStr(historyListRef.value);
    exportEnd.value = todayStr();
  };

  const _validateAndCollect = () => {
    if (exportStart.value && exportEnd.value && exportStart.value > exportEnd.value) {
      showToast && showToast('起始日期不能晚于结束日期');
      return null;
    }
    const records = filteredRecords.value;
    if (records.length === 0) {
      showToast && showToast('所选时间段无记录');
      return null;
    }
    return records;
  };

  const doExport = () => {
    const records = _validateAndCollect();
    if (!records) return;
    if (exportFormat.value === 'text') {
      const text = buildTextReport(records, exportStart.value, exportEnd.value);
      const filename = buildTextFilename(exportStart.value, exportEnd.value);
      downloadTextFile(filename, text);
    } else {
      const csv = buildCsv(records);
      const filename = buildExportFilename(exportStart.value, exportEnd.value);
      downloadCsvFile(filename, csv);
    }
    showToast && showToast(`已导出 ${records.length} 条`);
  };

  return {
    showExport,
    exportFormat,
    exportStart,
    exportEnd,
    filteredCount,
    totalCount,
    openExport,
    closeExport,
    setExportFormat,
    selectAllRange,
    doExport,
  };
}

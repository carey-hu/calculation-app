import { ref, computed } from 'vue';
import {
  filterByDateRange,
  buildWorkbookXml,
  downloadExcelFile,
  buildExportFilename,
} from '../lib/export-excel';

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

export function useExport({ historyListRef, showToast }) {
  const showExport = ref(false);
  const exportStart = ref(daysAgoStr(7));
  const exportEnd = ref(todayStr());

  const filteredRecords = computed(() => filterByDateRange(
    historyListRef.value,
    exportStart.value,
    exportEnd.value,
  ));

  const filteredCount = computed(() => filteredRecords.value.length);

  const openExport = () => { showExport.value = true; };
  const closeExport = () => { showExport.value = false; };

  const doExport = () => {
    if (exportStart.value && exportEnd.value && exportStart.value > exportEnd.value) {
      showToast && showToast('起始日期不能晚于结束日期');
      return;
    }
    const records = filteredRecords.value;
    if (records.length === 0) {
      showToast && showToast('所选时间段无记录');
      return;
    }
    const xml = buildWorkbookXml(records);
    const filename = buildExportFilename(exportStart.value, exportEnd.value);
    downloadExcelFile(filename, xml);
    showToast && showToast(`已导出 ${records.length} 条`);
  };

  return {
    showExport,
    exportStart,
    exportEnd,
    filteredCount,
    openExport,
    closeExport,
    doExport,
  };
}

import { ref } from 'vue';
import type { HistoryRecord, BuildRecordPayload } from '../types';
import {
  loadHistory, saveHistory, clearAllHistory,
  prependRecord, trimOldest, buildRecord,
} from '../lib/history';

export function useHistory() {
  const list = ref<HistoryRecord[]>(loadHistory());

  const addRecord = (payload: BuildRecordPayload) => {
    const record = buildRecord(payload);
    list.value = prependRecord(list.value, record);
    saveHistory(list.value);
    return record;
  };

  const clearOldest = (count: number) => {
    list.value = trimOldest(list.value, count);
    saveHistory(list.value);
  };

  const clearAll = () => {
    clearAllHistory();
    list.value = [];
  };

  return { list, addRecord, clearOldest, clearAll };
}

import { ref } from 'vue';
import {
  loadHistory, saveHistory, clearAllHistory,
  prependRecord, trimOldest, buildRecord,
} from '../lib/history';

export function useHistory() {
  const list = ref(loadHistory());

  const addRecord = (payload) => {
    const record = buildRecord(payload);
    list.value = prependRecord(list.value, record);
    saveHistory(list.value);
    return record;
  };

  const clearOldest = (count) => {
    list.value = trimOldest(list.value, count);
    saveHistory(list.value);
  };

  const clearAll = () => {
    clearAllHistory();
    list.value = [];
  };

  return { list, addRecord, clearOldest, clearAll };
}

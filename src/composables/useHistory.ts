import { onMounted, ref } from 'vue';
import type { HistoryRecord, BuildRecordPayload } from '../types';
import {
  loadHistory, saveHistory, clearAllHistory,
  prependRecord, trimOldest, buildRecord, mergeHistory, historyRecordKey,
  removeLowAccuracyHistory,
} from '../lib/history';
import {
  fetchRemoteHistory,
  saveRemoteRecord,
  saveRemoteRecords,
  clearRemoteOldest,
  clearRemoteHistory,
  clearRemoteLowAccuracy,
} from '../lib/history-api';

const LOW_ACCURACY_THRESHOLD = 30;

export function useHistory() {
  const list = ref<HistoryRecord[]>(loadHistory());
  const syncState = ref<'idle' | 'syncing' | 'ok' | 'error'>('idle');

  const refreshRemote = async () => {
    syncState.value = 'syncing';
    try {
      const remoteList = await fetchRemoteHistory();
      const localList = list.value;
      list.value = mergeHistory(remoteList, localList);
      saveHistory(list.value);
      const remoteKeys = new Set(remoteList.map(historyRecordKey));
      const missingRemoteRecords = localList.filter((record) => !remoteKeys.has(historyRecordKey(record)));
      await saveRemoteRecords(missingRemoteRecords);
      syncState.value = 'ok';
    } catch (e) {
      console.error('Failed to sync remote history:', e);
      syncState.value = 'error';
    }
  };

  const addRecord = async (payload: BuildRecordPayload) => {
    const record = buildRecord(payload);
    list.value = prependRecord(list.value, record);
    saveHistory(list.value);
    try {
      await saveRemoteRecord(record);
      syncState.value = 'ok';
    } catch (e) {
      console.error('Failed to save remote history:', e);
      syncState.value = 'error';
    }
    return record;
  };

  const clearOldest = async (count: number) => {
    list.value = trimOldest(list.value, count);
    saveHistory(list.value);
    try {
      await clearRemoteOldest(count);
      syncState.value = 'ok';
    } catch (e) {
      console.error('Failed to clear remote history:', e);
      syncState.value = 'error';
    }
  };

  const clearAll = async () => {
    clearAllHistory();
    list.value = [];
    try {
      await clearRemoteHistory();
      syncState.value = 'ok';
    } catch (e) {
      console.error('Failed to clear remote history:', e);
      syncState.value = 'error';
    }
  };

  const clearLowAccuracy = async () => {
    list.value = removeLowAccuracyHistory(list.value, LOW_ACCURACY_THRESHOLD);
    saveHistory(list.value);
    try {
      await clearRemoteLowAccuracy(LOW_ACCURACY_THRESHOLD);
      syncState.value = 'ok';
    } catch (e) {
      console.error('Failed to clear low accuracy remote history:', e);
      syncState.value = 'error';
    }
  };

  onMounted(() => {
    void refreshRemote();
  });

  return { list, syncState, refreshRemote, addRecord, clearOldest, clearAll, clearLowAccuracy };
}

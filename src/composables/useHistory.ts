import { onMounted, ref } from 'vue';
import type { HistoryRecord, BuildRecordPayload } from '../types';
import {
  loadHistory, saveHistory, clearAllHistory,
  prependRecord, trimOldest, buildRecord, historyRecordKey,
  removeLowAccuracyHistory, loadHistorySyncSince, saveHistorySyncSince,
  loadPendingSyncRecords, enqueuePendingSyncRecord, removePendingSyncRecords,
  hasCompletedAuthoritativeSync, markAuthoritativeSyncComplete,
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
const SYNC_THROTTLE_MS = 60000;

const latestRecordTs = (records: HistoryRecord[]): number =>
  records.reduce((latest, record) => Math.max(latest, record.ts || 0), 0);

export function useHistory() {
  const list = ref<HistoryRecord[]>(loadHistory());
  const syncState = ref<'idle' | 'syncing' | 'ok' | 'error'>('idle');
  let syncPromise: Promise<void> | null = null;
  let lastSyncStartedAt = 0;

  const uploadMissingRecords = async (records: HistoryRecord[], remoteList: HistoryRecord[]) => {
    if (records.length === 0) return remoteList;

    const remoteKeys = new Set(remoteList.map(historyRecordKey));
    const missingRecords = records.filter((record) => !remoteKeys.has(historyRecordKey(record)));
    if (missingRecords.length === 0) return remoteList;

    await saveRemoteRecords(missingRecords);
    return fetchRemoteHistory();
  };

  const runRefreshRemote = async () => {
    syncState.value = 'syncing';
    try {
      let remoteList = await fetchRemoteHistory();

      if (!hasCompletedAuthoritativeSync()) {
        remoteList = await uploadMissingRecords(list.value, remoteList);
        markAuthoritativeSyncComplete();
      }

      const pendingRecords = loadPendingSyncRecords();
      remoteList = await uploadMissingRecords(pendingRecords, remoteList);
      removePendingSyncRecords(pendingRecords);

      list.value = remoteList;
      saveHistory(list.value);
      saveHistorySyncSince(latestRecordTs(list.value));
      syncState.value = 'ok';
    } catch (e) {
      console.error('Failed to sync remote history:', e);
      syncState.value = 'error';
    } finally {
      syncPromise = null;
    }
  };

  const refreshRemote = async (options: { force?: boolean } = {}) => {
    if (syncPromise) return syncPromise;

    const now = Date.now();
    if (!options.force && lastSyncStartedAt > 0 && now - lastSyncStartedAt < SYNC_THROTTLE_MS) {
      return Promise.resolve();
    }

    lastSyncStartedAt = now;
    syncPromise = runRefreshRemote();
    return syncPromise;
  };

  const addRecord = async (payload: BuildRecordPayload) => {
    const record = buildRecord(payload);
    list.value = prependRecord(list.value, record);
    saveHistory(list.value);
    enqueuePendingSyncRecord(record);
    try {
      await saveRemoteRecord(record);
      removePendingSyncRecords([record]);
      saveHistorySyncSince(Math.max(loadHistorySyncSince() || 0, record.ts));
      syncState.value = 'ok';
    } catch (e) {
      console.error('Failed to save remote history:', e);
      syncState.value = 'error';
    }
    return record;
  };

  const clearOldest = async (count: number) => {
    const removedRecords = list.value.slice(-count);
    list.value = trimOldest(list.value, count);
    saveHistory(list.value);
    removePendingSyncRecords(removedRecords);
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
    const oldList = list.value;
    list.value = removeLowAccuracyHistory(list.value, LOW_ACCURACY_THRESHOLD);
    saveHistory(list.value);
    const keptKeys = new Set(list.value.map(historyRecordKey));
    removePendingSyncRecords(oldList.filter((record) => !keptKeys.has(historyRecordKey(record))));
    try {
      await clearRemoteLowAccuracy(LOW_ACCURACY_THRESHOLD);
      syncState.value = 'ok';
    } catch (e) {
      console.error('Failed to clear low accuracy remote history:', e);
      syncState.value = 'error';
    }
  };

  onMounted(() => {
    void refreshRemote({ force: true });
  });

  return { list, syncState, refreshRemote, addRecord, clearOldest, clearAll, clearLowAccuracy };
}

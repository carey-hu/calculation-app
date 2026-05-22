import type { HistoryRecord } from '../types';

const API_URL = '/api/history';
const SAVE_CHUNK_SIZE = 25;

const requestJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    throw new Error(`History API failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
};

export const fetchRemoteHistory = async (): Promise<HistoryRecord[]> => {
  const data = await requestJson<{ records?: HistoryRecord[] }>(API_URL);
  return Array.isArray(data.records) ? data.records : [];
};

export const saveRemoteRecord = async (record: HistoryRecord): Promise<void> => {
  await requestJson<{ ok: boolean }>(API_URL, {
    method: 'POST',
    body: JSON.stringify({ record }),
  });
};

export const saveRemoteRecords = async (records: HistoryRecord[]): Promise<void> => {
  for (let i = 0; i < records.length; i += SAVE_CHUNK_SIZE) {
    const chunk = records.slice(i, i + SAVE_CHUNK_SIZE);
    await requestJson<{ ok: boolean }>(API_URL, {
      method: 'POST',
      body: JSON.stringify({ records: chunk }),
    });
  }
};

export const clearRemoteOldest = async (count: number): Promise<void> => {
  await requestJson<{ ok: boolean }>(`${API_URL}?oldest=${encodeURIComponent(String(count))}`, {
    method: 'DELETE',
  });
};

export const clearRemoteHistory = async (): Promise<void> => {
  await requestJson<{ ok: boolean }>(API_URL, {
    method: 'DELETE',
  });
};

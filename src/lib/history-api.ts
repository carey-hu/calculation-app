import type { HistoryRecord } from '../types';

const API_URL = '/api/history';
const SAVE_CHUNK_SIZE = 100;
const REQUEST_TIMEOUT_MS = 30000;
const SAVE_CHUNK_DELAY_MS = 150;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => {
  window.setTimeout(resolve, ms);
});

const requestJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });

    if (!res.ok) {
      let errorText = '';
      try {
        const body = await res.json() as { error?: string };
        errorText = body.error ? `: ${body.error}` : '';
      } catch {
        errorText = '';
      }
      throw new Error(`History API failed: ${res.status}${errorText}`);
    }

    return res.json() as Promise<T>;
  } finally {
    window.clearTimeout(timeout);
  }
};

export const fetchRemoteHistory = async (since?: number | null): Promise<HistoryRecord[]> => {
  const url = since && since > 0 ? `${API_URL}?since=${encodeURIComponent(String(since))}` : API_URL;
  const data = await requestJson<{ records?: HistoryRecord[] }>(url);
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
    if (i + SAVE_CHUNK_SIZE < records.length) {
      await sleep(SAVE_CHUNK_DELAY_MS);
    }
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

export const clearRemoteLowAccuracy = async (thresholdPercent: number): Promise<void> => {
  await requestJson<{ ok: boolean }>(`${API_URL}?belowAccuracy=${encodeURIComponent(String(thresholdPercent))}`, {
    method: 'DELETE',
  });
};

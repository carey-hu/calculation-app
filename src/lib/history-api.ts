import type { HistoryRecord } from '../types';

const API_URL = '/api/history';
const READ_PAGE_SIZE = 300;
const SAVE_CHUNK_SIZE = 300;
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
  const records: HistoryRecord[] = [];
  let cursor = '';
  const seenCursors = new Set<string>();
  let pageCount = 0;

  while (true) {
    pageCount += 1;
    if (pageCount > 1000) {
      throw new Error('History API pagination exceeded 1000 pages');
    }

    const params = new URLSearchParams({ limit: String(READ_PAGE_SIZE) });
    if (cursor) params.set('cursor', cursor);
    if (since && since > 0) params.set('since', String(since));

    const data = await requestJson<{
      records?: HistoryRecord[];
      cursor?: string;
      complete?: boolean;
    }>(`${API_URL}?${params.toString()}`);

    if (Array.isArray(data.records)) records.push(...data.records);

    cursor = data.cursor || '';
    if (data.complete || !cursor) break;
    if (seenCursors.has(cursor)) {
      throw new Error(`History API returned a repeated cursor: ${cursor}`);
    }
    seenCursors.add(cursor);

    await sleep(SAVE_CHUNK_DELAY_MS);
  }

  return records.sort((a, b) => b.ts - a.ts);
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

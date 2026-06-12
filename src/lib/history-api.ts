import type { HistoryRecord } from '../types';

const API_URL = '/api/history';
const READ_PAGE_SIZE = 300;
const SAVE_CHUNK_SIZE = 300;
const REQUEST_TIMEOUT_MS = 30000;
const SAVE_CHUNK_DELAY_MS = 150;
const REQUEST_RETRY_DELAYS_MS = [800, 2000, 5000];
const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);

const sleep = (ms: number): Promise<void> => new Promise((resolve) => {
  window.setTimeout(resolve, ms);
});

const readErrorText = async (res: Response): Promise<string> => {
  try {
    const body = await res.json() as { error?: string };
    return body.error ? `: ${body.error}` : '';
  } catch {
    return '';
  }
};

const shouldRetryRequest = (method: string, status?: number): boolean => {
  const retryableMethod = method === 'GET' || method === 'POST';
  if (!retryableMethod) return false;
  return status === undefined || RETRYABLE_STATUS_CODES.has(status);
};

const isHistoryHttpError = (error: unknown): boolean =>
  error instanceof Error && error.message.startsWith('History API failed:');

const requestJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const method = (init?.method || 'GET').toUpperCase();
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= REQUEST_RETRY_DELAYS_MS.length; attempt += 1) {
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
        const errorText = await readErrorText(res);
        const error = new Error(`History API failed: ${res.status}${errorText}`);
        lastError = error;
        if (attempt < REQUEST_RETRY_DELAYS_MS.length && shouldRetryRequest(method, res.status)) {
          await sleep(REQUEST_RETRY_DELAYS_MS[attempt]);
          continue;
        }
        throw error;
      }

      return res.json() as Promise<T>;
    } catch (error) {
      lastError = error;
      if (isHistoryHttpError(error)) throw error;
      if (attempt < REQUEST_RETRY_DELAYS_MS.length && shouldRetryRequest(method)) {
        await sleep(REQUEST_RETRY_DELAYS_MS[attempt]);
        continue;
      }
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('History API request failed');
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

const KV_BINDING = 'CALC_HISTORY_KV';
const INDEX_KEY = 'calc_history_index';
const CHUNK_PREFIX = 'calc_history_chunk_';
const CHUNK_SIZE = 300;
const DEFAULT_READ_LIMIT = 300;
const MAX_READ_LIMIT = 1000;
const MAX_POST_RECORDS = 300;

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  },
});

const getKv = (context) => {
  const bound = context.env && context.env[KV_BINDING];
  if (bound) return bound;
  if (globalThis[KV_BINDING]) return globalThis[KV_BINDING];
  if (typeof CALC_HISTORY_KV !== 'undefined') return CALC_HISTORY_KV;
  return null;
};

const isRecord = (value) =>
  value
  && typeof value.ts === 'number'
  && typeof value.timeStr === 'string'
  && typeof value.mode === 'string'
  && typeof value.modeName === 'string'
  && typeof value.duration === 'string'
  && typeof value.summary === 'string'
  && Array.isArray(value.detail);

const safeRecord = (record) => ({
  ts: record.ts,
  timeStr: record.timeStr,
  mode: record.mode,
  modeName: record.modeName,
  duration: record.duration,
  summary: record.summary,
  detail: record.detail,
});

const recordId = (record) =>
  `${record.ts}_${record.mode}_${record.summary}_${record.duration}`;

const mergeRecords = (...groups) => {
  const map = new Map();
  groups.flat().forEach((record) => {
    if (!isRecord(record)) return;
    const key = recordId(record);
    if (!map.has(key)) map.set(key, safeRecord(record));
  });
  return Array.from(map.values()).sort((a, b) => b.ts - a.ts);
};

const normalizeLimit = (value) => {
  const limit = Number(value || DEFAULT_READ_LIMIT);
  if (!Number.isFinite(limit) || limit <= 0) return DEFAULT_READ_LIMIT;
  return Math.min(Math.floor(limit), MAX_READ_LIMIT);
};

const normalizeCursor = (value) => {
  const cursor = Number(value || '0');
  return Number.isFinite(cursor) && cursor > 0 ? Math.floor(cursor) : 0;
};

const isIndex = (value) =>
  value
  && typeof value.version === 'number'
  && typeof value.total === 'number'
  && Array.isArray(value.chunks);

const readIndex = async (kv) => {
  const index = await kv.get(INDEX_KEY, { type: 'json' });
  return isIndex(index) ? index : null;
};

const readChunk = async (kv, key) => {
  const chunk = await kv.get(key, { type: 'json' });
  if (Array.isArray(chunk)) return chunk.filter(isRecord).map(safeRecord);
  if (chunk && Array.isArray(chunk.records)) return chunk.records.filter(isRecord).map(safeRecord);
  return [];
};

const makeChunkKey = (version, index) =>
  `${CHUNK_PREFIX}${String(version).padStart(12, '0')}_${String(index).padStart(4, '0')}`;

const chunkMeta = (key, records) => ({
  key,
  count: records.length,
  maxTs: records[0]?.ts || 0,
  minTs: records[records.length - 1]?.ts || 0,
});

const writeNewChunks = async (kv, records, version, startIndex = 0) => {
  const chunks = [];
  const sortedRecords = mergeRecords(records);

  for (let i = 0; i < sortedRecords.length; i += CHUNK_SIZE) {
    const recordsChunk = sortedRecords.slice(i, i + CHUNK_SIZE);
    const key = makeChunkKey(version, startIndex + chunks.length);
    chunks.push(chunkMeta(key, recordsChunk));
    await kv.put(key, JSON.stringify({ records: recordsChunk }));
  }

  return chunks;
};

const writeChunkedRecords = async (kv, records, previousIndex = null) => {
  const mergedRecords = mergeRecords(records);
  const version = Math.max(((previousIndex && previousIndex.version) || 0) + 1, Date.now());
  const chunks = await writeNewChunks(kv, mergedRecords, version);

  const nextIndex = {
    version,
    total: mergedRecords.length,
    updatedAt: Date.now(),
    chunkSize: CHUNK_SIZE,
    chunks,
  };

  await kv.put(INDEX_KEY, JSON.stringify(nextIndex));

  const nextKeys = new Set(chunks.map((chunk) => chunk.key));
  const oldChunks = previousIndex && Array.isArray(previousIndex.chunks) ? previousIndex.chunks : [];
  await Promise.all(oldChunks
    .map((chunk) => chunk.key)
    .filter((key) => key && !nextKeys.has(key))
    .map((key) => kv.delete(key)));

  return nextIndex;
};

const appendOrPrependRecords = async (kv, records, previousIndex) => {
  const safeRecords = mergeRecords(records);
  if (safeRecords.length === 0) return previousIndex;
  if (!previousIndex || previousIndex.total === 0 || !Array.isArray(previousIndex.chunks) || previousIndex.chunks.length === 0) {
    return writeChunkedRecords(kv, safeRecords, previousIndex);
  }

  const firstChunk = previousIndex.chunks[0];
  const lastChunk = previousIndex.chunks[previousIndex.chunks.length - 1];
  const newestIncoming = safeRecords[0].ts;
  const oldestIncoming = safeRecords[safeRecords.length - 1].ts;
  const version = Math.max((previousIndex.version || 0) + 1, Date.now());

  if (oldestIncoming > firstChunk.maxTs) {
    const chunks = await writeNewChunks(kv, safeRecords, version);
    const nextIndex = {
      version,
      total: previousIndex.total + safeRecords.length,
      updatedAt: Date.now(),
      chunkSize: CHUNK_SIZE,
      chunks: [...chunks, ...previousIndex.chunks],
    };
    await kv.put(INDEX_KEY, JSON.stringify(nextIndex));
    return nextIndex;
  }

  if (newestIncoming < lastChunk.minTs) {
    const chunks = await writeNewChunks(kv, safeRecords, version, previousIndex.chunks.length);
    const nextIndex = {
      version,
      total: previousIndex.total + safeRecords.length,
      updatedAt: Date.now(),
      chunkSize: CHUNK_SIZE,
      chunks: [...previousIndex.chunks, ...chunks],
    };
    await kv.put(INDEX_KEY, JSON.stringify(nextIndex));
    return nextIndex;
  }

  const existingRecords = await readAllChunkedRecords(kv, previousIndex);
  return writeChunkedRecords(kv, mergeRecords(existingRecords, safeRecords), previousIndex);
};

const readAllChunkedRecords = async (kv, index) => {
  if (!index) return [];
  const groups = [];
  for (const chunk of index.chunks) {
    groups.push(await readChunk(kv, chunk.key));
  }
  return mergeRecords(...groups);
};

const readRecordsPage = async (kv, { since = 0, cursor = 0, limit = DEFAULT_READ_LIMIT }) => {
  const index = await readIndex(kv);
  if (!index) {
    return { records: [], cursor: '', complete: true, total: 0, version: 0 };
  }

  const records = [];
  let skipped = cursor;
  let nextCursor = cursor;

  for (const chunk of index.chunks) {
    if (skipped >= chunk.count) {
      skipped -= chunk.count;
      continue;
    }

    const chunkRecords = await readChunk(kv, chunk.key);
    for (let i = skipped; i < chunkRecords.length; i += 1) {
      const record = chunkRecords[i];
      nextCursor += 1;
      if (!since || record.ts > since) records.push(record);
      if (records.length >= limit) {
        return {
          records,
          cursor: String(nextCursor),
          complete: nextCursor >= index.total,
          total: index.total,
          version: index.version,
        };
      }
    }
    skipped = 0;
  }

  return {
    records,
    cursor: '',
    complete: true,
    total: index.total,
    version: index.version,
  };
};

const getAccuracyPercent = (record) => {
  const summaryMatch = record.summary.match(/姝ｇ‘鐜嘰s*(\d+(?:\.\d+)?)%/);
  if (summaryMatch) return Number(summaryMatch[1]);

  const graded = record.detail.filter((item) => item && typeof item.ok === 'boolean');
  if (graded.length === 0) return null;
  const correct = graded.filter((item) => item.ok).length;
  return (correct / graded.length) * 100;
};

export async function onRequestGet(context) {
  const kv = getKv(context);
  if (!kv) return json({ error: `KV binding ${KV_BINDING} is not configured` }, 500);

  const url = new URL(context.request.url);
  const since = Number(url.searchParams.get('since') || '0');
  const page = await readRecordsPage(kv, {
    since: Number.isFinite(since) && since > 0 ? since : 0,
    cursor: normalizeCursor(url.searchParams.get('cursor')),
    limit: normalizeLimit(url.searchParams.get('limit')),
  });
  return json(page);
}

export async function onRequestPost(context) {
  const kv = getKv(context);
  if (!kv) return json({ error: `KV binding ${KV_BINDING} is not configured` }, 500);

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const records = Array.isArray(body.records) ? body.records : [body.record];
  if (records.length === 0 || records.length > MAX_POST_RECORDS || records.some((record) => !isRecord(record))) {
    return json({ error: 'Invalid history record' }, 400);
  }

  const index = await readIndex(kv);
  const nextIndex = await appendOrPrependRecords(kv, records, index);
  return json({ ok: true, total: nextIndex.total, version: nextIndex.version });
}

export async function onRequestDelete(context) {
  const kv = getKv(context);
  if (!kv) return json({ error: `KV binding ${KV_BINDING} is not configured` }, 500);

  const url = new URL(context.request.url);
  const oldestCount = Number(url.searchParams.get('oldest') || '0');
  const belowAccuracy = Number(url.searchParams.get('belowAccuracy') || '0');
  const index = await readIndex(kv);

  if (!index) return json({ ok: true, total: 0, version: 0 });

  if (!oldestCount && !belowAccuracy) {
    await Promise.all(index.chunks.map((chunk) => kv.delete(chunk.key)));
    await kv.delete(INDEX_KEY);
    return json({ ok: true, total: 0, version: Date.now() });
  }

  const records = await readAllChunkedRecords(kv, index);
  let nextRecords = records;

  if (oldestCount > 0) {
    const keep = records.length - oldestCount;
    nextRecords = keep > 0 ? records.slice(0, keep) : [];
  } else if (belowAccuracy > 0) {
    nextRecords = records.filter((record) => {
      const accuracy = getAccuracyPercent(record);
      return accuracy === null || accuracy >= belowAccuracy;
    });
  }

  const nextIndex = await writeChunkedRecords(kv, nextRecords, index);
  return json({ ok: true, total: nextIndex.total, version: nextIndex.version });
}

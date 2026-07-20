// 百题斩错题库使用独立接口与独立 KV key；旧版客户端仍只访问 /api/history。
const KV_BINDING = 'CALC_HISTORY_KV';
const INDEX_KEY = 'calc_mistakes_index';
const CHUNK_PREFIX = 'calc_mistakes_chunk_';
const TOMBSTONE_INDEX_KEY = 'calc_mistakes_tombstones';
const TOMBSTONE_PREFIX = 'calc_mistakes_deleted_';
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
  && typeof value.id === 'string'
  && value.id.length > 0
  && typeof value.question === 'string'
  && value.question.trim().length > 0
  && typeof value.answer === 'string'
  && value.answer.trim().length > 0
  && typeof value.createdAt === 'number'
  && typeof value.updatedAt === 'number'
  && typeof value.syncUpdatedAt === 'number'
  && Array.isArray(value.reviewedAt)
  && value.reviewedAt.every((timestamp) => typeof timestamp === 'number');

const safeRecord = (record) => ({
  id: record.id,
  question: record.question.trim(),
  answer: record.answer.trim(),
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
  syncUpdatedAt: record.syncUpdatedAt,
  reviewedAt: Array.from(new Set(record.reviewedAt)).sort((a, b) => a - b),
});

const tombstoneKey = (id) => `${TOMBSTONE_PREFIX}${encodeURIComponent(id)}`;

const readTombstones = async (kv) => {
  const value = await kv.get(TOMBSTONE_INDEX_KEY, { type: 'json' });
  return Array.isArray(value)
    ? value.filter((item) => item && typeof item.id === 'string' && typeof item.deletedAt === 'number')
    : [];
};

const addTombstone = async (kv, id) => {
  const deletedAt = Date.now();
  await kv.put(tombstoneKey(id), JSON.stringify({ id, deletedAt }));
  const byID = new Map((await readTombstones(kv)).map((item) => [item.id, item]));
  byID.set(id, { id, deletedAt });
  const next = Array.from(byID.values()).sort((a, b) => b.deletedAt - a.deletedAt);
  await kv.put(TOMBSTONE_INDEX_KEY, JSON.stringify(next));
};

const withoutTombstones = async (kv, records) => {
  const results = await Promise.all(records.map(async (record) => ({
    record,
    deleted: Boolean(await kv.get(tombstoneKey(record.id))),
  })));
  return results.filter((result) => !result.deleted).map((result) => result.record);
};

const mergeRecords = (...groups) => {
  const map = new Map();
  groups.flat().forEach((candidate) => {
    if (!isRecord(candidate)) return;
    const record = safeRecord(candidate);
    const existing = map.get(record.id);
    if (!existing || record.syncUpdatedAt >= existing.syncUpdatedAt) map.set(record.id, record);
  });
  return Array.from(map.values()).sort((a, b) => {
    if (a.syncUpdatedAt !== b.syncUpdatedAt) return b.syncUpdatedAt - a.syncUpdatedAt;
    return a.id.localeCompare(b.id);
  });
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
  const value = await kv.get(key, { type: 'json' });
  const records = Array.isArray(value) ? value : value && Array.isArray(value.records) ? value.records : [];
  return records.filter(isRecord).map(safeRecord);
};

const readAllRecords = async (kv, index) => {
  if (!index) return [];
  const groups = [];
  for (const chunk of index.chunks) groups.push(await readChunk(kv, chunk.key));
  return mergeRecords(...groups);
};

const makeChunkKey = (version, index) =>
  `${CHUNK_PREFIX}${String(version).padStart(12, '0')}_${String(index).padStart(4, '0')}`;

const writeRecords = async (kv, records, previousIndex = null) => {
  const merged = mergeRecords(records);
  const version = Math.max((previousIndex?.version || 0) + 1, Date.now());
  const chunks = [];

  for (let offset = 0; offset < merged.length; offset += CHUNK_SIZE) {
    const chunkRecords = merged.slice(offset, offset + CHUNK_SIZE);
    const key = makeChunkKey(version, chunks.length);
    await kv.put(key, JSON.stringify({ records: chunkRecords }));
    chunks.push({
      key,
      count: chunkRecords.length,
      maxSyncUpdatedAt: chunkRecords[0]?.syncUpdatedAt || 0,
      minSyncUpdatedAt: chunkRecords[chunkRecords.length - 1]?.syncUpdatedAt || 0,
    });
  }

  const nextIndex = {
    version,
    total: merged.length,
    updatedAt: Date.now(),
    chunkSize: CHUNK_SIZE,
    chunks,
  };
  await kv.put(INDEX_KEY, JSON.stringify(nextIndex));

  const nextKeys = new Set(chunks.map((chunk) => chunk.key));
  const oldChunks = Array.isArray(previousIndex?.chunks) ? previousIndex.chunks : [];
  await Promise.all(oldChunks
    .map((chunk) => chunk.key)
    .filter((key) => key && !nextKeys.has(key))
    .map((key) => kv.delete(key)));
  return nextIndex;
};

const readPage = async (kv, { since, cursor, limit }) => {
  const index = await readIndex(kv);
  if (!index) return { records: [], cursor: '', complete: true, total: 0, version: 0 };

  const all = await readAllRecords(kv, index);
  const filtered = since > 0 ? all.filter((record) => record.syncUpdatedAt > since) : all;
  const records = filtered.slice(cursor, cursor + limit);
  const nextCursor = cursor + records.length;
  return {
    records,
    cursor: nextCursor < filtered.length ? String(nextCursor) : '',
    complete: nextCursor >= filtered.length,
    total: index.total,
    version: index.version,
  };
};

export async function onRequestGet(context) {
  const kv = getKv(context);
  if (!kv) return json({ error: `KV binding ${KV_BINDING} is not configured` }, 500);

  const url = new URL(context.request.url);
  const since = Number(url.searchParams.get('since') || '0');
  const page = await readPage(kv, {
    since: Number.isFinite(since) && since > 0 ? since : 0,
    cursor: normalizeCursor(url.searchParams.get('cursor')),
    limit: normalizeLimit(url.searchParams.get('limit')),
  });
  const deletedIDs = (await readTombstones(kv)).map((item) => item.id);
  return json({ ...page, deletedIDs });
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

  const incoming = Array.isArray(body.records) ? body.records : [body.record];
  if (incoming.length === 0 || incoming.length > MAX_POST_RECORDS || incoming.some((record) => !isRecord(record))) {
    return json({ error: 'Invalid mistake record' }, 400);
  }

  const acceptedRecords = await withoutTombstones(kv, incoming);
  const index = await readIndex(kv);
  if (acceptedRecords.length === 0) {
    return json({ ok: true, total: index?.total || 0, version: index?.version || 0 });
  }
  const existing = await readAllRecords(kv, index);
  const nextIndex = await writeRecords(kv, mergeRecords(existing, acceptedRecords), index);
  return json({ ok: true, total: nextIndex.total, version: nextIndex.version });
}

export async function onRequestDelete(context) {
  const kv = getKv(context);
  if (!kv) return json({ error: `KV binding ${KV_BINDING} is not configured` }, 500);

  const id = new URL(context.request.url).searchParams.get('id') || '';
  if (!id) return json({ error: 'Missing mistake id' }, 400);

  await addTombstone(kv, id);
  const index = await readIndex(kv);
  if (!index) return json({ ok: true, total: 0, version: Date.now() });
  const existing = await readAllRecords(kv, index);
  const nextIndex = await writeRecords(kv, existing.filter((record) => record.id !== id), index);
  return json({ ok: true, total: nextIndex.total, version: nextIndex.version });
}

const KV_BINDING = 'CALC_HISTORY_KV';
const KEY_PREFIX = 'calc_history_';
const MAX_LIST_LIMIT = 256;
const MAX_POST_RECORDS = 100;

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

const hashString = (value) => {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) + hash) ^ value.charCodeAt(i);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
};

const recordKey = (record) =>
  `${KEY_PREFIX}${String(record.ts).padStart(13, '0')}_${hashString(JSON.stringify(record))}`;

const keyTs = (key) => Number(key.slice(KEY_PREFIX.length, KEY_PREFIX.length + 13));

const listKeys = async (kv) => {
  const keys = [];
  let cursor = '';

  while (true) {
    const result = await kv.list({
      prefix: KEY_PREFIX,
      limit: MAX_LIST_LIMIT,
      cursor,
    });
    const pageKeys = (result.keys || [])
      .map((item) => (typeof item === 'string' ? item : item.key || item.name));
    keys.push(...pageKeys.filter(Boolean));
    cursor = result.cursor || '';
    if (result.complete || !cursor) break;
  }

  return keys;
};

const readRecords = async (kv, since = 0) => {
  const keys = await listKeys(kv);
  const recordKeys = since > 0 ? keys.filter((key) => keyTs(key) > since) : keys;
  const records = [];

  for (const key of recordKeys) {
    const value = await kv.get(key, { type: 'json' });
    if (isRecord(value)) records.push(value);
  }

  return records.sort((a, b) => b.ts - a.ts);
};

const getAccuracyPercent = (record) => {
  const summaryMatch = record.summary.match(/正确率\s*(\d+(?:\.\d+)?)%/);
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
  const records = await readRecords(kv, Number.isFinite(since) && since > 0 ? since : 0);
  return json({ records });
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

  const safeRecords = records.map(safeRecord);
  await Promise.all(safeRecords.map((record) => kv.put(recordKey(record), JSON.stringify(record))));
  return json({ ok: true });
}

export async function onRequestDelete(context) {
  const kv = getKv(context);
  if (!kv) return json({ error: `KV binding ${KV_BINDING} is not configured` }, 500);

  const url = new URL(context.request.url);
  const oldestCount = Number(url.searchParams.get('oldest') || '0');
  const belowAccuracy = Number(url.searchParams.get('belowAccuracy') || '0');
  const records = await readRecords(kv);
  const keys = await listKeys(kv);

  if (oldestCount > 0) {
    const oldestTs = new Set(records.slice(-oldestCount).map((record) => record.ts));
    await Promise.all(keys
      .filter((key) => oldestTs.has(keyTs(key)))
      .map((key) => kv.delete(key)));
    return json({ ok: true });
  }

  if (belowAccuracy > 0) {
    const lowAccuracyTs = new Set(records
      .filter((record) => {
        const accuracy = getAccuracyPercent(record);
        return accuracy !== null && accuracy < belowAccuracy;
      })
      .map((record) => record.ts));
    await Promise.all(keys
      .filter((key) => lowAccuracyTs.has(keyTs(key)))
      .map((key) => kv.delete(key)));
    return json({ ok: true });
  }

  await Promise.all(keys.map((key) => kv.delete(key)));
  return json({ ok: true });
}

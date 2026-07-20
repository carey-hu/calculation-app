import assert from 'node:assert/strict';
import test from 'node:test';
import { onRequestDelete, onRequestGet, onRequestPost } from '../../edge-functions/api/history.js';

class MemoryKV {
  values = new Map();

  async get(key, options) {
    if (!this.values.has(key)) return null;
    const value = this.values.get(key);
    return options?.type === 'json' ? JSON.parse(value) : value;
  }

  async put(key, value) { this.values.set(key, value); }
  async delete(key) { this.values.delete(key); }
}

const record = () => ({
  ts: 1000,
  timeStr: '1970/01/01 08:00:01',
  mode: 'mental',
  modeName: '心算',
  duration: '12 秒',
  summary: '正确率 80%',
  detail: [{ question: '8+7', answer: '15', ok: true }],
});

const recordID = '1000_mental_正确率 80%_12 秒';

const context = (kv, url, body, method = body === undefined ? 'GET' : 'POST') => ({
  env: { CALC_HISTORY_KV: kv },
  request: new Request(url, method === 'GET' ? undefined : {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  }),
});

test('single history deletion is durable against stale uploads', async () => {
  const kv = new MemoryKV();
  await onRequestPost(context(kv, 'https://example.com/api/history', { record: record() }));

  const deletion = await onRequestDelete(context(
    kv,
    `https://example.com/api/history?id=${encodeURIComponent(recordID)}&oldest=-1`,
    undefined,
    'DELETE',
  ));
  assert.equal(deletion.status, 200);
  assert.equal((await deletion.json()).deletedID, recordID);

  let response = await onRequestGet(context(kv, 'https://example.com/api/history'));
  let body = await response.json();
  assert.deepEqual(body.records, []);
  assert.deepEqual(body.deletedIDs, [recordID]);

  await onRequestPost(context(kv, 'https://example.com/api/history', { record: record() }));
  response = await onRequestGet(context(kv, 'https://example.com/api/history'));
  body = await response.json();
  assert.deepEqual(body.records, []);
});

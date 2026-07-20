import assert from 'node:assert/strict';
import test from 'node:test';
import { onRequestDelete, onRequestGet, onRequestPost } from '../../edge-functions/api/mistakes.js';

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

const record = (overrides = {}) => ({
  id: 'mistake-1',
  question: '8+7 等于多少？',
  answer: '15',
  createdAt: 1000,
  updatedAt: 1000,
  syncUpdatedAt: 1000,
  reviewedAt: [],
  ...overrides,
});

const context = (kv, url, body, method = body === undefined ? 'GET' : 'POST') => ({
  env: { CALC_HISTORY_KV: kv },
  request: new Request(url, method === 'GET' ? undefined : {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  }),
});

test('mistakes use independent keys and never touch history keys', async () => {
  const kv = new MemoryKV();
  kv.values.set('calc_history_index', JSON.stringify({ version: 9, total: 0, chunks: [] }));

  const response = await onRequestPost(context(kv, 'https://example.com/api/mistakes', { record: record() }));
  assert.equal(response.status, 200);
  assert.equal(kv.values.has('calc_mistakes_index'), true);
  assert.deepEqual(JSON.parse(kv.values.get('calc_history_index')), { version: 9, total: 0, chunks: [] });
});

test('editing replaces the same id instead of creating a training record or duplicate', async () => {
  const kv = new MemoryKV();
  await onRequestPost(context(kv, 'https://example.com/api/mistakes', { record: record() }));
  await onRequestPost(context(kv, 'https://example.com/api/mistakes', {
    record: record({ question: '8+7 的正确答案是什么？', updatedAt: 2000, syncUpdatedAt: 2000 }),
  }));

  const response = await onRequestGet(context(kv, 'https://example.com/api/mistakes?limit=300'));
  const body = await response.json();
  assert.equal(body.records.length, 1);
  assert.equal(body.records[0].question, '8+7 的正确答案是什么？');
  assert.equal(body.records[0].updatedAt, 2000);
});

test('incremental reads use syncUpdatedAt so review progress can sync without reordering content', async () => {
  const kv = new MemoryKV();
  await onRequestPost(context(kv, 'https://example.com/api/mistakes', { record: record() }));
  await onRequestPost(context(kv, 'https://example.com/api/mistakes', {
    record: record({ syncUpdatedAt: 3000, reviewedAt: [3000] }),
  }));

  const response = await onRequestGet(context(kv, 'https://example.com/api/mistakes?since=2500'));
  const body = await response.json();
  assert.equal(body.records.length, 1);
  assert.deepEqual(body.records[0].reviewedAt, [3000]);
  assert.equal(body.records[0].updatedAt, 1000);
});

test('deleting a mistake removes it and prevents a stale client from restoring it', async () => {
  const kv = new MemoryKV();
  await onRequestPost(context(kv, 'https://example.com/api/mistakes', { record: record() }));

  const deletion = await onRequestDelete(context(
    kv,
    'https://example.com/api/mistakes?id=mistake-1',
    undefined,
    'DELETE',
  ));
  assert.equal(deletion.status, 200);

  let response = await onRequestGet(context(kv, 'https://example.com/api/mistakes'));
  let body = await response.json();
  assert.deepEqual(body.records, []);
  assert.deepEqual(body.deletedIDs, ['mistake-1']);

  await onRequestPost(context(kv, 'https://example.com/api/mistakes', { record: record() }));
  response = await onRequestGet(context(kv, 'https://example.com/api/mistakes'));
  body = await response.json();
  assert.deepEqual(body.records, []);
});

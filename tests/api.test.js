import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ApiError, fetchJson, itemsUrl, itemUrl, normalizeBaseUrl, readItemId } from '../src/lib/api.js';

test('normalizeBaseUrl drops trailing slashes and keeps the path', () => {
  assert.equal(
    normalizeBaseUrl('https://abc.execute-api.ap-southeast-2.amazonaws.com/'),
    'https://abc.execute-api.ap-southeast-2.amazonaws.com',
  );
  assert.equal(normalizeBaseUrl(' http://localhost:8080 '), 'http://localhost:8080');
  assert.equal(normalizeBaseUrl('https://example.com/api//'), 'https://example.com/api');
});

test('normalizeBaseUrl rejects missing, invalid and non-http URLs', () => {
  for (const value of [undefined, '', '  ', 'not a url', 'ftp://example.com', 'https://example.com/?a=1', 'https://example.com/#x']) {
    assert.throws(() => normalizeBaseUrl(value), TypeError, `value: ${String(value)}`);
  }
});

test('item URLs are built from the base URL', () => {
  assert.equal(itemsUrl('https://api.test'), 'https://api.test/items');
  assert.equal(itemUrl('https://api.test', '42'), 'https://api.test/items/42');
  assert.equal(itemUrl('https://api.test', 'a/b'), 'https://api.test/items/a%2Fb');
});

test('readItemId accepts simple ids only', () => {
  assert.equal(readItemId('?id=42'), '42');
  assert.equal(readItemId('?id=%20item-7_b%20'), 'item-7_b');
  assert.equal(readItemId(''), null);
  assert.equal(readItemId('?id='), null);
  assert.equal(readItemId('?id=../secret'), null);
  assert.equal(readItemId(`?id=${'x'.repeat(65)}`), null);
});

const json = (status, body) =>
  async () => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

test('fetchJson returns the body of a successful response', async () => {
  assert.deepEqual(await fetchJson('https://api.test/items/42', json(200, { id: '42' })), {
    found: true,
    data: { id: '42' },
  });
});

test('fetchJson reports 404 as not found', async () => {
  assert.deepEqual(await fetchJson('https://api.test/items/9', json(404, { error: 'not_found' })), {
    found: false,
    data: null,
  });
});

test('fetchJson raises ApiError for other failures', async () => {
  await assert.rejects(fetchJson('u', json(500, {})), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.kind, 'http');
    assert.equal(error.status, 500);
    return true;
  });
  await assert.rejects(
    fetchJson('u', async () => {
      throw new TypeError('fetch failed');
    }),
    { name: 'ApiError', kind: 'network' },
  );
  await assert.rejects(
    fetchJson('u', async () => new Response('<html>', { status: 200 })),
    { name: 'ApiError', kind: 'parse' },
  );
});

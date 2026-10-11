import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatName, formatPrice, MISSING } from '../src/lib/format.js';

test('formatPrice formats amounts as Australian dollars', () => {
  assert.equal(formatPrice(12.5), '$12.50');
  assert.equal(formatPrice(0), '$0.00');
  assert.equal(formatPrice(1234.5), '$1,234.50');
});

test('formatPrice accepts numeric strings', () => {
  assert.equal(formatPrice('7'), '$7.00');
  assert.equal(formatPrice(' 3.25 '), '$3.25');
});

test('formatPrice shows a dash for missing or invalid amounts', () => {
  for (const value of [undefined, null, '', '   ', 'abc', Number.NaN, Number.POSITIVE_INFINITY, {}, true]) {
    assert.equal(formatPrice(value), MISSING, `value: ${String(value)}`);
  }
});

test('formatName trims names and falls back for empty ones', () => {
  assert.equal(formatName('  Blue mug '), 'Blue mug');
  assert.equal(formatName(''), 'Unnamed item');
  assert.equal(formatName(undefined), 'Unnamed item');
  assert.equal(formatName(42), 'Unnamed item');
});

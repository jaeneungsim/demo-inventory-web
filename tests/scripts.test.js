import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { findProblems, htmlReferences, moduleImports } from '../scripts/check-html-refs.mjs';
import { stageFrom, ticketKey } from '../scripts/ticket-stage.mjs';
import { deployedApiUrl, renderConfig, siteInfo } from '../scripts/write-config.mjs';

test('the ticket key comes from the branch first, then the title', () => {
  assert.equal(stageFrom('INV-123-stock-on-detail', 'INV-9 something'), 'inv-123');
  assert.equal(stageFrom('feature/stock', 'INV-77 Show stock'), 'inv-77');
  assert.equal(stageFrom('feature/stock', 'Show stock'), null);
  assert.equal(stageFrom(undefined, undefined), null);
  assert.equal(ticketKey('INV-12x'), null);
  assert.equal(ticketKey('fix: INV-5, tidy'), 'INV-5');
});

test('config.js points the site at an https API', () => {
  assert.equal(
    renderConfig(deployedApiUrl('https://abc.execute-api.ap-southeast-2.amazonaws.com/')),
    'window.INV_CONFIG = { apiUrl: "https://abc.execute-api.ap-southeast-2.amazonaws.com" };\n',
  );
  assert.throws(() => deployedApiUrl('http://abc.example.com'), TypeError);
  assert.throws(() => deployedApiUrl(''), TypeError);
});

test('siteInfo builds the preview record from the contract', () => {
  assert.deepEqual(siteInfo({ stage: 'inv-123', domain: 'd123.cloudfront.net', apiUrl: 'https://api.test' }), {
    stage: 'inv-123',
    web_url: 'https://d123.cloudfront.net/inv-123/index.html',
    api_url: 'https://api.test',
  });
  assert.equal(siteInfo({ stage: 'dev', domain: 'd1.cloudfront.net', apiUrl: 'x' }).web_url, 'https://d1.cloudfront.net/dev/index.html');
  assert.throws(() => siteInfo({ stage: 'INV-123', domain: 'd1.cloudfront.net' }), TypeError);
  assert.throws(() => siteInfo({ stage: 'inv-1', domain: 'evil.com/x' }), TypeError);
  assert.throws(() => siteInfo({ stage: 'inv-1', domain: undefined }), TypeError);
});

test('reference checks find local files and module imports', () => {
  assert.deepEqual(
    htmlReferences('<link href="styles.css"><a href="item.html?id=1">x</a><a href="https://x.test">y</a><a href="#top">z</a>'),
    ['styles.css', 'item.html?id=1'],
  );
  assert.deepEqual(
    moduleImports("import { a } from './lib/a.js';\nimport './side.js';\nexport { b } from \"../b.js\";\nimport c from 'pkg';"),
    ['./lib/a.js', './side.js', '../b.js'],
  );
});

test('reference checks report missing files and absolute paths', () => {
  const root = mkdtempSync(join(tmpdir(), 'refs-'));
  mkdirSync(join(root, 'lib'));
  writeFileSync(join(root, 'index.html'), '<script src="app.js"></script><link href="/styles.css"><a href="gone.html">x</a>');
  writeFileSync(join(root, 'app.js'), "import { x } from './lib/x.js';\nimport { y } from './lib/y.js';");
  writeFileSync(join(root, 'lib', 'x.js'), 'export const x = 1;');
  assert.deepEqual(findProblems(root), [
    { file: 'app.js', reference: './lib/y.js', problem: 'missing file' },
    { file: 'index.html', reference: '/styles.css', problem: 'absolute path' },
    { file: 'index.html', reference: 'gone.html', problem: 'missing file' },
  ]);
});

test('every page and module in src refers only to files that exist', () => {
  assert.deepEqual(findProblems(fileURLToPath(new URL('../src', import.meta.url))), []);
});

#!/usr/bin/env node
// Usage: check-html-refs.mjs <dir>
// Fails when an HTML page or a JS module refers to a local file that does not exist, or uses an
// absolute path (sites are served under a prefix such as /inv-123/, so paths must be relative).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ATTRIBUTE = /\b(?:src|href)\s*=\s*(["'])(.*?)\1/gi;
const STATIC_IMPORT = /\b(?:import|export)\s+(?:[^'";]*?\s+from\s+)?(["'])(\.{1,2}\/[^"']+)\1/g;
const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#|\?)/i;

export function htmlReferences(html) {
  return [...html.matchAll(ATTRIBUTE)]
    .map((match) => match[2].trim())
    .filter((value) => value !== '' && !EXTERNAL.test(value));
}

export function moduleImports(source) {
  return [...source.matchAll(STATIC_IMPORT)].map((match) => match[2]);
}

function filesUnder(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

export function findProblems(root) {
  const problems = [];
  for (const file of filesUnder(root)) {
    let references = [];
    if (file.endsWith('.html')) {
      references = htmlReferences(readFileSync(file, 'utf8'));
    } else if (file.endsWith('.js')) {
      references = moduleImports(readFileSync(file, 'utf8'));
    }
    for (const reference of references) {
      const path = reference.split(/[?#]/, 1)[0];
      const where = relative(root, file);
      if (path.startsWith('/')) {
        problems.push({ file: where, reference, problem: 'absolute path' });
      } else if (path !== '' && !existsSync(resolve(dirname(file), path))) {
        problems.push({ file: where, reference, problem: 'missing file' });
      }
    }
  }
  return problems;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = process.argv[2] ?? 'src';
  const problems = findProblems(root);
  for (const { file, reference, problem } of problems) {
    process.stderr.write(`${file}: ${reference} (${problem})\n`);
  }
  if (problems.length > 0) {
    process.exitCode = 1;
  } else {
    process.stdout.write(`All local references under ${root} resolve.\n`);
  }
}

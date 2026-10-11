#!/usr/bin/env node
// Prints the preview stage (inv-123) for a PR, from HEAD_REF first and PR_TITLE second.
import { pathToFileURL } from 'node:url';

const TICKET_KEY = /\bINV-(\d+)\b/;

export function ticketKey(text) {
  const match = typeof text === 'string' ? TICKET_KEY.exec(text) : null;
  return match ? `INV-${match[1]}` : null;
}

export function stageFrom(branch, title) {
  const key = ticketKey(branch) ?? ticketKey(title);
  return key === null ? null : key.toLowerCase();
}

function main(args, env) {
  const stage = stageFrom(env.HEAD_REF, env.PR_TITLE);
  if (stage !== null) {
    process.stdout.write(`${stage}\n`);
    return 0;
  }
  if (args.includes('--optional')) {
    return 0;
  }
  process.stderr.write('No ticket key such as INV-123 in the branch name or the PR title.\n');
  return 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2), process.env);
}

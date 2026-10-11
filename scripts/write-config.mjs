#!/usr/bin/env node
// Usage: API_URL=… [STAGE=… WEB_PREVIEW_DOMAIN=…] write-config.mjs <config.js> [preview.json]
// Writes config.js for a deployed site, optionally preview.json, and prints the site URL
// when STAGE and WEB_PREVIEW_DOMAIN are set.
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { normalizeBaseUrl } from '../src/lib/api.js';

const STAGE = /^(?:inv-\d+|dev)$/;
const HOSTNAME = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i;

export function deployedApiUrl(value) {
  const url = normalizeBaseUrl(value);
  if (!url.startsWith('https://')) {
    throw new TypeError(`A deployed site must call an https API: ${value}`);
  }
  return url;
}

export function renderConfig(apiUrl) {
  return `window.INV_CONFIG = { apiUrl: ${JSON.stringify(apiUrl)} };\n`;
}

export function siteInfo({ stage, domain, apiUrl }) {
  if (!STAGE.test(stage ?? '')) {
    throw new TypeError(`The stage must be inv-<number> or dev: ${stage}`);
  }
  if (!HOSTNAME.test(domain ?? '')) {
    throw new TypeError(`The web preview domain is not a hostname: ${domain}`);
  }
  return { stage, web_url: `https://${domain}/${stage}/index.html`, api_url: apiUrl };
}

function main([configPath, previewPath], env) {
  if (!configPath) {
    throw new TypeError('Usage: write-config.mjs <config.js> [preview.json]');
  }
  const apiUrl = deployedApiUrl(env.API_URL);
  writeFileSync(configPath, renderConfig(apiUrl));
  if (previewPath || env.STAGE) {
    const info = siteInfo({ stage: env.STAGE, domain: env.WEB_PREVIEW_DOMAIN, apiUrl });
    if (previewPath) {
      writeFileSync(previewPath, `${JSON.stringify(info, null, 2)}\n`);
    }
    process.stdout.write(`${info.web_url}\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main(process.argv.slice(2), process.env);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

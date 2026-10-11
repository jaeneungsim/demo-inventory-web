const ITEM_ID = /^[A-Za-z0-9_-]{1,64}$/;

export class ApiError extends Error {
  constructor(kind, message, { status, cause } = {}) {
    super(message, { cause });
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }
}

export function normalizeBaseUrl(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError('The API URL is not configured.');
  }
  let url;
  try {
    url = new URL(value.trim());
  } catch {
    throw new TypeError(`The API URL is not valid: ${value}`);
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new TypeError(`The API URL must use http or https: ${value}`);
  }
  if (url.search || url.hash) {
    throw new TypeError(`The API URL must not have a query or fragment: ${value}`);
  }
  return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
}

export function itemsUrl(baseUrl) {
  return `${baseUrl}/items`;
}

export function itemUrl(baseUrl, id) {
  return `${baseUrl}/items/${encodeURIComponent(id)}`;
}

export function readItemId(search) {
  const id = new URLSearchParams(search).get('id')?.trim() ?? '';
  return ITEM_ID.test(id) ? id : null;
}

export async function fetchJson(url, fetchImpl = globalThis.fetch) {
  let response;
  try {
    response = await fetchImpl(url, { headers: { Accept: 'application/json' } });
  } catch (cause) {
    throw new ApiError('network', 'Could not reach the inventory API.', { cause });
  }
  if (response.status === 404) {
    return { found: false, data: null };
  }
  if (!response.ok) {
    throw new ApiError('http', `The inventory API answered with status ${response.status}.`, {
      status: response.status,
    });
  }
  try {
    return { found: true, data: await response.json() };
  } catch (cause) {
    throw new ApiError('parse', 'The inventory API sent a response that is not JSON.', { cause });
  }
}

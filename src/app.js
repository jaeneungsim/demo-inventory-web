import { fetchJson, itemsUrl, itemUrl, normalizeBaseUrl, readItemId } from './lib/api.js';
import { formatName, formatPrice, formatStock } from './lib/format.js';

function showStatus(message, { error = false } = {}) {
  const status = document.querySelector('[data-status]');
  status.textContent = message;
  status.classList.toggle('status--error', error);
  status.hidden = false;
}

function hideStatus() {
  document.querySelector('[data-status]').hidden = true;
}

function itemLink(item) {
  const link = document.createElement('a');
  link.className = 'item-card';
  link.href = `item.html?id=${encodeURIComponent(item.id)}`;

  const name = document.createElement('span');
  name.className = 'item-card__name';
  name.textContent = formatName(item.name);

  const price = document.createElement('span');
  price.className = 'item-card__price';
  price.textContent = formatPrice(item.price);

  link.append(name, price);
  return link;
}

async function renderList(baseUrl) {
  showStatus('Loading items…');
  const { found, data } = await fetchJson(itemsUrl(baseUrl));
  const items = found && Array.isArray(data?.items) ? data.items : null;
  if (items === null) {
    showStatus('The inventory API did not return an item list.', { error: true });
    return;
  }
  if (items.length === 0) {
    showStatus('There are no items yet.');
    return;
  }
  const list = document.querySelector('[data-items]');
  list.replaceChildren(
    ...items.map((item) => {
      const entry = document.createElement('li');
      entry.append(itemLink(item));
      return entry;
    }),
  );
  list.hidden = false;
  hideStatus();
}

async function renderDetail(baseUrl, id) {
  if (id === null) {
    showStatus('This page needs an item id, for example item.html?id=42.', { error: true });
    return;
  }
  showStatus('Loading the item…');
  const { found, data } = await fetchJson(itemUrl(baseUrl, id));
  if (!found) {
    showStatus(`Item ${id} was not found.`, { error: true });
    return;
  }
  const article = document.querySelector('[data-item]');
  const name = formatName(data?.name);
  article.querySelector('[data-field="name"]').textContent = name;
  article.querySelector('[data-field="price"]').textContent = formatPrice(data?.price);
  article.querySelector('[data-field="stock"]').textContent = formatStock(data?.stock);
  article.querySelector('[data-field="id"]').textContent = String(data?.id ?? id);
  document.title = `${name} · Inventory`;
  article.hidden = false;
  hideStatus();
}

async function main() {
  let baseUrl;
  try {
    baseUrl = normalizeBaseUrl(window.INV_CONFIG?.apiUrl);
  } catch (error) {
    showStatus(error.message, { error: true });
    return;
  }
  try {
    if (document.body.dataset.page === 'detail') {
      await renderDetail(baseUrl, readItemId(window.location.search));
    } else {
      await renderList(baseUrl);
    }
  } catch (error) {
    showStatus(error.message, { error: true });
  }
}

main();

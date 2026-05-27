#!/usr/bin/env node
/**
 * generate-sitemap.cjs
 *
 * Build-time helper that writes `dist/sitemap.xml` for SEO crawling.
 * Always includes static pages; tries to enrich with all centers + events
 * from the prod API. Network failure during build is non-fatal — we ship a
 * sitemap with just the static pages and log a warning.
 *
 * Env vars:
 *   SITE_URL                — canonical site origin (default: https://chinmayajanata.org)
 *   SITEMAP_API_BASE_URL    — backend API origin used for the centers/events fetch
 *                              (default: https://api.chinmayajanata.org)
 *   SITEMAP_SKIP_NETWORK    — set to '1' to skip the dynamic fetch entirely
 *
 * Usage: invoked from package.json as a postbuild step.
 */
const fs = require('node:fs');
const path = require('node:path');

const SITE_URL = (process.env.SITE_URL || 'https://chinmayajanata.org').replace(/\/$/, '');
const API_BASE = (process.env.SITEMAP_API_BASE_URL || 'https://api.chinmayajanata.org').replace(/\/$/, '');
const SKIP_NETWORK = process.env.SITEMAP_SKIP_NETWORK === '1';
const TIMEOUT_MS = 15_000;

const DIST_DIR = path.resolve(__dirname, '..', 'dist');

const STATIC_ROUTES = [
  { path: '/', changefreq: 'daily', priority: 1.0 },
  { path: '/landing', changefreq: 'weekly', priority: 0.9 },
  { path: '/terms', changefreq: 'yearly', priority: 0.3 },
  { path: '/privacy', changefreq: 'yearly', priority: 0.3 },
  { path: '/cookies', changefreq: 'yearly', priority: 0.3 },
];

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function fetchJson(url) {
  const ctl = new AbortController();
  const to = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error(`${url} → HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(to);
  }
}

async function fetchCenters() {
  if (SKIP_NETWORK) return [];
  try {
    const data = await fetchJson(`${API_BASE}/api/centers`);
    const list = Array.isArray(data) ? data : data.centers || data.data || [];
    return list.filter((c) => c && (c.centerID || c.id));
  } catch (e) {
    console.warn(`[sitemap] centers fetch failed: ${e.message} — skipping centers`);
    return [];
  }
}

async function fetchEvents() {
  if (SKIP_NETWORK) return [];
  try {
    const data = await fetchJson(`${API_BASE}/api/fetchAllEvents`);
    const list = Array.isArray(data) ? data : data.events || data.data || [];
    return list.filter((e) => e && (e.eventID || e.id));
  } catch (e) {
    console.warn(`[sitemap] events fetch failed: ${e.message} — skipping events`);
    return [];
  }
}

function urlEntry({ loc, lastmod, changefreq, priority }) {
  const parts = [`    <loc>${xmlEscape(loc)}</loc>`];
  if (lastmod) parts.push(`    <lastmod>${xmlEscape(lastmod)}</lastmod>`);
  if (changefreq) parts.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority !== undefined) parts.push(`    <priority>${priority.toFixed(1)}</priority>`);
  return `  <url>\n${parts.join('\n')}\n  </url>`;
}

(async () => {
  if (!fs.existsSync(DIST_DIR)) {
    console.warn(`[sitemap] dist/ not found at ${DIST_DIR}; nothing to write`);
    return;
  }

  const [centers, events] = await Promise.all([fetchCenters(), fetchEvents()]);

  const entries = [];

  for (const route of STATIC_ROUTES) {
    entries.push(urlEntry({ loc: `${SITE_URL}${route.path}`, changefreq: route.changefreq, priority: route.priority }));
  }

  for (const c of centers) {
    const id = c.centerID || c.id;
    entries.push(urlEntry({
      loc: `${SITE_URL}/center/${encodeURIComponent(id)}`,
      lastmod: c.updatedAt || c.createdAt || undefined,
      changefreq: 'weekly',
      priority: 0.8,
    }));
  }

  for (const e of events) {
    const id = e.eventID || e.id;
    // Skip past events (>30 days old) — Google deprioritizes ancient event pages
    const dateStr = e.date || e.endDate;
    if (dateStr) {
      const eventTime = new Date(dateStr).getTime();
      const cutoff = Date.now() - 30 * 24 * 3600_000;
      if (eventTime < cutoff) continue;
    }
    entries.push(urlEntry({
      loc: `${SITE_URL}/events/${encodeURIComponent(id)}`,
      lastmod: e.updatedAt || e.createdAt || undefined,
      changefreq: 'weekly',
      priority: 0.7,
    }));
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries.join('\n') +
    `\n</urlset>\n`;

  const outPath = path.join(DIST_DIR, 'sitemap.xml');
  fs.writeFileSync(outPath, xml);
  console.log(`[sitemap] wrote ${outPath} with ${entries.length} URL(s) (${STATIC_ROUTES.length} static, ${centers.length} centers, ${entries.length - STATIC_ROUTES.length - centers.length} upcoming events)`);
})().catch((e) => {
  console.error('[sitemap] fatal:', e);
  process.exit(1);
});

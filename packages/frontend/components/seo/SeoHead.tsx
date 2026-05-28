import React from 'react'
import Head from 'expo-router/head'

import { SITE_URL } from './jsonLd'

interface SeoHeadProps {
  /** Page title (will be suffixed with " · Chinmaya Janata" unless `exactTitle` is true). */
  title: string
  /** ≤ 160 char meta description. */
  description: string
  /** Path-only canonical URL — joined with the site origin. e.g. `/center/abc`. */
  path?: string
  /** Absolute URL for the OG image. Defaults to the site logo. */
  ogImage?: string
  /** When true, render `title` exactly; otherwise append the brand. */
  exactTitle?: boolean
  /** JSON-LD blob (use buildCenterJsonLd / buildEventJsonLd / buildOrganizationJsonLd). */
  jsonLd?: string | null
  /** Hint to crawlers — `noindex` for auth-gated views. */
  noIndex?: boolean
}

const DEFAULT_OG_IMAGE = `${SITE_URL}/logo.png`

/**
 * Per-page SEO head. Renders title + meta + canonical + OG/Twitter tags +
 * optional JSON-LD into the document `<head>` via `expo-router/head`.
 *
 * Because the app is Expo Router with `web.output: "single"` (SPA), these
 * tags are injected at runtime via react-helmet-async. Googlebot still
 * indexes JS-rendered content, but for full SSR-quality SEO we'd want to
 * migrate to `output: "static"` — see PR body for the follow-up plan.
 */
export function SeoHead({
  title,
  description,
  path,
  ogImage,
  exactTitle,
  jsonLd,
  noIndex,
}: SeoHeadProps) {
  const fullTitle = exactTitle ? title : `${title} · Chinmaya Janata`
  const canonical = path ? new URL(path, SITE_URL).toString() : SITE_URL
  const img = ogImage || DEFAULT_OG_IMAGE
  const desc = description.length > 160 ? description.slice(0, 157) + '…' : description

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonical} />

      {noIndex ? <meta name="robots" content="noindex, nofollow" /> : null}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Chinmaya Janata" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={img} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />

      {/*
        react-helmet-async (used by expo-router/head) doesn't propagate
        `dangerouslySetInnerHTML` on script tags — the inline JSON has to
        be passed as a text-node child for it to render in <head>. Caught
        this via Playwright evidence capture on 5/27 when the JSON-LD
        wasn't showing up in the live DOM despite the rest of the Head
        tags rendering correctly.
      */}
      {jsonLd ? (
        <script type="application/ld+json">{jsonLd}</script>
      ) : null}
    </Head>
  )
}

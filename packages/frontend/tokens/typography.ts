/**
 * Typography tokens
 *
 * Two-font system:
 *   Inclusive Sans — brand font: headings, titles, names, primary viewed info
 *   System font    — everything else: long-form text, secondary screens, actions
 *
 * Rule: Inclusive Sans wherever possible for primary/identity content.
 *       System font (no fontFamily) for body paragraphs, secondary screens
 *       (settings, edit-profile, forms), buttons, chips, and small metadata.
 */

export const family = {
  sans: 'Inclusive Sans',
} as const

/**
 * Composable style objects — spread into StyleSheet or inline style props.
 */
export const type = {
  // Inclusive Sans — primary identity content
  display:   { fontFamily: family.sans, fontSize: 30, lineHeight: 34, letterSpacing: -0.5 },
  h1:        { fontFamily: family.sans, fontSize: 24, lineHeight: 28, letterSpacing: -0.3 },
  h2:        { fontFamily: family.sans, fontSize: 20, lineHeight: 24 },
  h3:        { fontFamily: family.sans, fontSize: 17, lineHeight: 22 },
  body:      { fontFamily: family.sans, fontSize: 15, lineHeight: 22 },
  bodySmall: { fontFamily: family.sans, fontSize: 14, lineHeight: 20 },

  // System font — secondary content, actions, metadata (no fontFamily = platform default)
  eyebrow:      { fontSize: 11, letterSpacing: 0.9 },
  label:        { fontWeight: '500' as const, fontSize: 13, lineHeight: 18 },
  button:       { fontWeight: '500' as const, fontSize: 15, lineHeight: 20 },
  caption:      { fontSize: 12, lineHeight: 16 },
  captionSmall: { fontSize: 11, lineHeight: 14 },
} as const

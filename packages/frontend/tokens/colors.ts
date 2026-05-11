export type AppColors = {
  // Surfaces — elevation hierarchy
  bg: string          // page / screen background
  surface: string     // sunken surfaces: input bg, icon pill, date pill
  panel: string       // panel areas: sidebar lists, card interiors
  rail: string        // navigation rail / column background
  card: string        // raised card background
  cardActive: string  // pressed / selected card state

  // Borders
  border: string       // default border
  borderStrong: string // emphasis border
  divider: string      // hairline divider

  // Text
  text: string          // primary text — headings, body
  textSecondary: string // secondary text — supporting copy
  textMuted: string     // muted text — labels, metadata
  textFaint: string     // faint text — placeholders, disabled
  textInverse: string   // text on accent / dark surfaces

  // Brand
  accent: string      // #E8862A — brand orange
  accentPress: string // pressed-state orange
  accentSoft: string  // orange tint background

  // Status
  success: string
  successSoft: string
  error: string
  errorSoft: string

  // Icons
  icon: string
  iconMuted: string
}

export const LIGHT: AppColors = {
  bg: '#F5F5F4',
  surface: '#F0EDE8',
  panel: '#F7F4EF',
  rail: '#FFFFFF',
  card: '#FFFFFF',
  cardActive: '#FFF7ED',

  border: '#E7E5E4',
  borderStrong: '#D6D3D1',
  divider: '#F1ECE3',

  text: '#1C1917',
  textSecondary: '#44403C',
  textMuted: '#78716C',
  textFaint: '#A8A29E',
  textInverse: '#FFFFFF',

  accent: '#E8862A',
  accentPress: '#D97520',
  accentSoft: '#FFF7ED',

  success: '#059669',
  successSoft: '#ECFDF5',
  error: '#DC2626',
  errorSoft: '#FEF2F2',

  icon: '#1C1917',
  iconMuted: '#78716C',
}

export const DARK: AppColors = {
  bg: '#1A1A1A',
  surface: '#171717',
  panel: '#1F1F1F',
  rail: '#171717',
  card: '#262626',
  cardActive: '#2E2E2E',

  border: '#3A3A3A',
  borderStrong: '#525252',
  divider: '#2A2A2A',

  text: '#FAFAFA',
  textSecondary: '#D6D3D1',
  textMuted: '#A8A29E',
  textFaint: '#737373',
  textInverse: '#1C1917',

  accent: '#E8862A',
  accentPress: '#F59340',
  accentSoft: 'rgba(232,134,42,0.12)',

  success: '#34D399',
  successSoft: 'rgba(6,95,70,0.2)',
  error: '#F87171',
  errorSoft: 'rgba(220,38,38,0.15)',

  icon: '#FAFAFA',
  iconMuted: '#A8A29E',
}

/** Map AppColors → ThreadPanelColors for the ThreadPanel component. */
export function toThreadColors(c: AppColors) {
  return {
    panelBg: c.bg,
    text: c.text,
    textSecondary: c.textMuted,
    textMuted: c.textFaint,
    border: c.border,
    iconBoxBg: c.panel,
    cardBg: c.card,
    avatarBorder: c.surface,
    iconHeader: c.textMuted,
    accent: c.accent,
    accentSoft: c.accentSoft,
  }
}

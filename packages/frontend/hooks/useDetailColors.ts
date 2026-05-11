import { useColors } from './useColors'

export type DetailColors = {
  panelBg: string
  card: string
  cardBg: string
  text: string
  textSecondary: string
  textMuted: string
  border: string
  surface: string
  iconBoxBg: string
  avatarBorder: string
  attendedBg: string
  iconHeader: string
}

export function useDetailColors(): DetailColors {
  const c = useColors()
  return {
    panelBg:       c.bg,
    card:          c.card,
    cardBg:        c.card,
    text:          c.text,
    textSecondary: c.textMuted,
    textMuted:     c.textFaint,
    border:        c.border,
    surface:       c.surface,
    iconBoxBg:     c.panel,
    avatarBorder:  c.card,
    attendedBg:    c.successSoft,
    iconHeader:    c.textMuted,
  }
}

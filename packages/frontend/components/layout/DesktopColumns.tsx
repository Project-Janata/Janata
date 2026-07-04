import React from 'react'
import { Platform, View } from 'react-native'

// Shared desktop layout tokens so every two-column web page (Home, Feed, …)
// lines up pixel-for-pixel: same width band, padding, gap, rail width, and
// breakpoint. Tweak here once instead of per screen.
export const DESKTOP_MAX_WIDTH = 1040
export const DESKTOP_PAGE_PADDING = 32
export const DESKTOP_PAGE_TOP = 28
export const DESKTOP_PAGE_BOTTOM = 56
export const DESKTOP_RAIL_WIDTH = 320
export const DESKTOP_COLUMN_GAP = 28
export const DESKTOP_SECTION_GAP = 28
export const DESKTOP_BREAKPOINT = 1024

// The two-column desktop layout is web-only (the native apps are phone-sized
// and always use the single-column layout).
export function useDesktopLayout(width: number) {
  return Platform.OS === 'web' && width >= DESKTOP_BREAKPOINT
}

// Drop this onto a desktop page's ScrollView contentContainerStyle so the
// centered width band + page padding match across screens. Spread extra keys
// after it to override (e.g. paddingBottom) if a page needs to.
export const desktopScrollContent = {
  width: '100%' as const,
  maxWidth: DESKTOP_MAX_WIDTH,
  alignSelf: 'center' as const,
  paddingHorizontal: DESKTOP_PAGE_PADDING,
  paddingTop: DESKTOP_PAGE_TOP,
  paddingBottom: DESKTOP_PAGE_BOTTOM,
}

// Primary column (fills) + fixed 320px right rail, with an optional full-width
// header above both. Pages own the ScrollView; this is just the inner layout so
// Home and Feed share the exact same column/rail geometry.
export function DesktopColumns({
  header,
  main,
  rail,
}: {
  header?: React.ReactNode
  main: React.ReactNode
  rail: React.ReactNode
}) {
  return (
    <View style={{ gap: DESKTOP_SECTION_GAP }}>
      {header}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: DESKTOP_COLUMN_GAP }}>
        <View style={{ flex: 1, minWidth: 0, gap: DESKTOP_SECTION_GAP }}>{main}</View>
        <View style={{ width: DESKTOP_RAIL_WIDTH, flexGrow: 0, flexShrink: 0 }}>{rail}</View>
      </View>
    </View>
  )
}

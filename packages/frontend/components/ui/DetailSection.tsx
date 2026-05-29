import React from 'react'
import { View, Text, Pressable, type ViewStyle } from 'react-native'
import { useColors } from '../../hooks/useColors'

/**
 * DetailSection — the editorial "on-surface" section used across the center
 * and event detail screens. A small-caps muted label, an optional count and
 * trailing action, and a thin hairline divider above (skipped for the first
 * section). Content sits directly on the page background — no cards.
 *
 * Replaces the old tabbed layout (Details / Thread / People|Events) with one
 * ordered scroll so the detail screens read like the Connect feed.
 */
export function DetailSection({
  title,
  count,
  first = false,
  action,
  onAction,
  children,
  contentStyle,
}: {
  title: string
  count?: number
  first?: boolean
  action?: string
  onAction?: () => void
  children: React.ReactNode
  contentStyle?: ViewStyle
}) {
  const c = useColors()
  return (
    <View>
      {!first ? (
        <View style={{ height: 1, backgroundColor: c.border, marginHorizontal: 20, marginTop: 24 }} />
      ) : null}
      <View style={{ paddingHorizontal: 20, paddingTop: first ? 4 : 18, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ flex: 1, fontSize: 11, letterSpacing: 0.9, color: c.textFaint }}>
            {title.toUpperCase()}
            {typeof count === 'number' ? `  ${count}` : ''}
          </Text>
          {action ? (
            <Pressable
              onPress={onAction}
              accessibilityRole="button"
              accessibilityLabel={action}
              hitSlop={8}
              style={{ minHeight: 28, justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 13, color: c.accent }}>{action}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      <View style={[{ paddingHorizontal: 20 }, contentStyle]}>{children}</View>
    </View>
  )
}

export default DetailSection

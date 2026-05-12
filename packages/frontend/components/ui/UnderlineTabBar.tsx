import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { useColors } from '../../hooks/useColors'

export interface UnderlineTabBarProps {
  tabs: string[]
  activeTab: string
  onTabChange: (tab: string) => void
  /** Optional per-tab count rendered as a subtle inline number after the label. */
  counts?: Record<string, number | undefined>
}

export default function UnderlineTabBar({ tabs, activeTab, onTabChange, counts }: UnderlineTabBarProps) {
  const c = useColors()
  const isDark = c.bg === '#1A1A1A'

  return (
    <View
      className="flex-row"
      style={{ borderBottomWidth: 1, borderBottomColor: c.border }}
    >
      {tabs.map((tab) => {
        const isActive = tab === activeTab
        const count = counts?.[tab]
        const labelColor = isActive ? c.accent : c.textFaint
        const countColor = isActive ? (c.accent + '99') : (isDark ? '#52525B' : '#D6D3D1')
        return (
          <Pressable
            key={tab}
            onPress={() => onTabChange(tab)}
            className="flex-1 items-center pb-3 pt-1"
            style={isActive ? { borderBottomWidth: 2, borderBottomColor: c.accent, marginBottom: -1 } : { marginBottom: -1 }}
          >
            <Text style={{ fontSize: 14, fontFamily: 'Inclusive Sans', color: labelColor }}>
              {tab}
              {count != null && (
                <Text style={{ fontFamily: 'Inclusive Sans', color: countColor }}>
                  {'  '}{count}
                </Text>
              )}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

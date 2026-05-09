import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { useTheme } from '../contexts'

export interface UnderlineTabBarProps {
  tabs: string[]
  activeTab: string
  onTabChange: (tab: string) => void
  /** Optional per-tab count rendered as a subtle inline number after the label. */
  counts?: Record<string, number | undefined>
}

export default function UnderlineTabBar({ tabs, activeTab, onTabChange, counts }: UnderlineTabBarProps) {
  const { isDark } = useTheme()
  const borderColor = isDark ? '#404040' : '#E7E5E4'
  const inactiveColor = isDark ? '#6B7280' : '#A8A29E'

  return (
    <View
      className="flex-row"
      style={{ borderBottomWidth: 1, borderBottomColor: borderColor }}
    >
      {tabs.map((tab) => {
        const isActive = tab === activeTab
        const count = counts?.[tab]
        const labelColor = isActive ? '#E8862A' : inactiveColor
        const countColor = isActive ? '#E8862A99' : (isDark ? '#52525B' : '#D6D3D1')
        return (
          <Pressable
            key={tab}
            onPress={() => onTabChange(tab)}
            className="flex-1 items-center pb-3 pt-1"
            style={isActive ? { borderBottomWidth: 2, borderBottomColor: '#E8862A', marginBottom: -1 } : { marginBottom: -1 }}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Inclusive Sans',
                color: labelColor,
              }}
            >
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

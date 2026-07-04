import React from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { Bell, Building2, CalendarDays, Users, Ticket, ShieldAlert } from 'lucide-react-native'
import { useTheme } from '../contexts'

export type AdminTab =
  | 'Centers'
  | 'Events'
  | 'Users'
  | 'Invite Codes'
  | 'Notifications'
  | 'Moderation'

type AdminSidebarProps = {
  activeTab: AdminTab
  onTabChange: (tab: AdminTab) => void
  // Full admins see every tab; sevaks (moderation-only) see just Moderation.
  isAdmin: boolean
  compact?: boolean
}

const tabs: { key: AdminTab; label: string; Icon: typeof Building2 }[] = [
  { key: 'Centers', label: 'Centers', Icon: Building2 },
  { key: 'Events', label: 'Events', Icon: CalendarDays },
  { key: 'Users', label: 'Users', Icon: Users },
  { key: 'Invite Codes', label: 'Invite Links', Icon: Ticket },
  { key: 'Moderation', label: 'Moderation', Icon: ShieldAlert },
  { key: 'Notifications', label: 'Notifications', Icon: Bell },
]

export default function AdminSidebar({ activeTab, onTabChange, isAdmin, compact = false }: AdminSidebarProps) {
  const { isDark } = useTheme()

  const inactiveColor = isDark ? '#A8A29E' : '#78716C'
  const visibleTabs = isAdmin ? tabs : tabs.filter((t) => t.key === 'Moderation')

  return (
    <View
      style={[
        compact ? styles.compactContainer : styles.container,
        {
          backgroundColor: isDark ? '#1a1a1a' : '#F5F5F4',
          borderRightColor: compact ? 'transparent' : isDark ? '#262626' : '#E7E5E4',
          borderBottomColor: compact ? isDark ? '#262626' : '#E7E5E4' : 'transparent',
        },
      ]}
    >
      <Text style={compact ? styles.compactHeader : styles.header}>Admin</Text>

      <ScrollView
        horizontal={compact}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={compact ? styles.compactTabs : undefined}
      >
        {visibleTabs.map(({ key, label, Icon }) => {
          const isActive = activeTab === key
          const color = isActive ? '#E8862A' : inactiveColor

          return (
            <Pressable
              key={key}
              onPress={() => onTabChange(key)}
              style={[
                compact ? styles.compactTab : styles.tab,
                isActive && styles.tabActive,
              ]}
            >
              <Icon size={18} color={color} />
              <Text style={[styles.tabLabel, compact && styles.compactTabLabel, { color }]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 200,
    borderRightWidth: 1,
    paddingTop: 20,
    paddingHorizontal: 12,
  },
  compactContainer: {
    borderBottomWidth: 1,
    paddingTop: 10,
    paddingBottom: 8,
  },
  header: {
    fontFamily: 'Inclusive Sans',
    fontSize: 15,
    color: '#E8862A',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  compactHeader: {
    fontFamily: 'Inclusive Sans',
    fontSize: 14,
    color: '#E8862A',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  compactTabs: {
    gap: 6,
    paddingHorizontal: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  compactTab: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 38,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: 'rgba(232,134,42,0.12)',
  },
  tabLabel: {
    fontFamily: 'Inclusive Sans',
    fontSize: 14,
    marginLeft: 10,
  },
  compactTabLabel: {
    fontSize: 13,
    marginLeft: 7,
  },
})

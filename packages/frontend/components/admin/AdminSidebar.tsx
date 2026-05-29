import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
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
}

const tabs: { key: AdminTab; label: string; Icon: typeof Building2 }[] = [
  { key: 'Centers', label: 'Centers', Icon: Building2 },
  { key: 'Events', label: 'Events', Icon: CalendarDays },
  { key: 'Users', label: 'Users', Icon: Users },
  { key: 'Invite Codes', label: 'Invite Codes', Icon: Ticket },
  { key: 'Moderation', label: 'Moderation', Icon: ShieldAlert },
  { key: 'Notifications', label: 'Notifications', Icon: Bell },
]

export default function AdminSidebar({ activeTab, onTabChange, isAdmin }: AdminSidebarProps) {
  const { isDark } = useTheme()

  const inactiveColor = isDark ? '#A8A29E' : '#78716C'
  const visibleTabs = isAdmin ? tabs : tabs.filter((t) => t.key === 'Moderation')

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#1a1a1a' : '#F5F5F4',
          borderRightColor: isDark ? '#262626' : '#E7E5E4',
        },
      ]}
    >
      <Text style={styles.header}>Admin</Text>

      {visibleTabs.map(({ key, label, Icon }) => {
        const isActive = activeTab === key
        const color = isActive ? '#E8862A' : inactiveColor

        return (
          <Pressable
            key={key}
            onPress={() => onTabChange(key)}
            style={[
              styles.tab,
              isActive && styles.tabActive,
            ]}
          >
            <Icon size={18} color={color} />
            <Text style={[styles.tabLabel, { color }]}>{label}</Text>
          </Pressable>
        )
      })}
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
  header: {
    fontFamily: 'Inclusive Sans',
    fontSize: 15,
    color: '#E8862A',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  tabActive: {
    backgroundColor: 'rgba(232,134,42,0.12)',
  },
  tabLabel: {
    fontFamily: 'Inclusive Sans',
    fontSize: 14,
    marginLeft: 10,
  },
})

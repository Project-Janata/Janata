import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { Bell, Buildings, CalendarDots, Users, Ticket, ShieldAlert } from 'phosphor-react-native'
import type { Icon } from 'phosphor-react-native'
import { useColors } from '../../hooks/useColors'

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
}

const tabs: { key: AdminTab; label: string; Icon: Icon }[] = [
  { key: 'Centers', label: 'Centers', Icon: Buildings },
  { key: 'Events', label: 'Events', Icon: CalendarDots },
  { key: 'Users', label: 'Users', Icon: Users },
  { key: 'Invite Codes', label: 'Invite Codes', Icon: Ticket },
  { key: 'Moderation', label: 'Moderation', Icon: ShieldAlert },
  { key: 'Notifications', label: 'Notifications', Icon: Bell },
]

export default function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const c = useColors()

  return (
    <View
      style={{
        width: 200,
        borderRightWidth: 1,
        borderRightColor: c.border,
        paddingTop: 20,
        paddingHorizontal: 12,
        backgroundColor: c.bg,
      }}
    >
      <Text
        style={{
          fontFamily: 'Inclusive Sans',
          fontSize: 15,
          color: c.accent,
          marginBottom: 20,
          paddingHorizontal: 8,
        }}
      >
        Admin
      </Text>

      {tabs.map(({ key, label, Icon }) => {
        const isActive = activeTab === key
        const color = isActive ? c.accent : c.iconMuted

        return (
          <Pressable
            key={key}
            onPress={() => onTabChange(key)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 10,
              paddingHorizontal: 8,
              borderRadius: 8,
              marginBottom: 4,
              backgroundColor: isActive ? c.accentSoft : 'transparent',
            }}
          >
            <Icon size={18} color={color} />
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, marginLeft: 10, color }}>
              {label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

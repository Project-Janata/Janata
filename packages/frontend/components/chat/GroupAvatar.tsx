import React from 'react'
import { Text, View } from 'react-native'
import { Building2, CalendarDays } from 'lucide-react-native'
import { Avatar } from '../ui'
import type { AppColors } from '../../tokens'
import type { GroupKind, PersonSummary } from '../boards'

export function GroupConversationAvatar({
  members,
  size = 44,
  colors,
}: {
  members: PersonSummary[]
  size?: number
  colors: AppColors
}) {
  const fallbackMember: PersonSummary = { id: 'group', name: 'Group', initials: 'G' }
  const shown = members.length > 0 ? members.slice(0, 4) : [fallbackMember]
  const half = size / 2

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        backgroundColor: colors.panel,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {shown.map((member, index) => (
        <View
          key={`${member.id}-${index}`}
          style={{
            position: 'absolute',
            left: (index % 2) * half,
            top: Math.floor(index / 2) * half,
            width: half,
            height: half,
            backgroundColor: member.accentColor || colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: 'Inclusive Sans',
              fontSize: Math.max(9, half * 0.42),
              color: '#FFFFFF',
            }}
          >
            {(member.initials || member.name || '?').slice(0, 1).toUpperCase()}
          </Text>
        </View>
      ))}
    </View>
  )
}

export function GroupIcon({
  kind,
  colors,
  active,
}: {
  kind: GroupKind
  colors: AppColors
  active?: boolean
}) {
  return (
    <View
      style={{
        width: 42,
        height: 42,
        borderRadius: 15,
        backgroundColor: active ? colors.accent : colors.accentSoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {kind === 'center' ? (
        <Building2 size={19} color={active ? '#FFFFFF' : colors.accent} />
      ) : (
        <CalendarDays size={19} color={active ? '#FFFFFF' : colors.accent} />
      )}
    </View>
  )
}

import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import { Avatar } from '../ui'
import { connectionRequests } from '../boards'
import type { PersonSummary } from '../boards'
import type { AppColors } from '../../tokens'

function RequestAvatarStack({ people, colors }: { people: PersonSummary[]; colors: AppColors }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {people.map((person, index) => (
        <View
          key={person.id}
          style={{
            marginLeft: index === 0 ? 0 : -10,
            borderWidth: 2,
            borderColor: colors.card,
            borderRadius: 16,
          }}
        >
          <Avatar
            name={person.name}
            initials={person.initials}
            size={32}
            backgroundColor={person.accentColor}
          />
        </View>
      ))}
    </View>
  )
}

export function RequestsBanner({ colors }: { colors: AppColors }) {
  if (connectionRequests.length === 0) return null
  const previewNames = connectionRequests
    .slice(0, 2)
    .map((request) => request.person.name.split(' ')[0])
    .join(', ')
  const subtitle = `${previewNames}${connectionRequests.length > 2 ? ' and others' : ''} · met at recent events`
  const stackPeople = connectionRequests.slice(0, 3).map((request) => request.person)

  return (
    <Pressable
      style={{
        backgroundColor: colors.card,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <RequestAvatarStack people={stackPeople} colors={colors} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text
          style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.text }}
          numberOfLines={1}
        >
          {connectionRequests.length} message{' '}
          {connectionRequests.length === 1 ? 'request' : 'requests'}
        </Text>
        <Text
          style={{ fontFamily: 'Inclusive Sans', fontSize: 12.5, color: colors.textMuted }}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      </View>
      <ChevronRight size={18} color={colors.textFaint} />
    </Pressable>
  )
}

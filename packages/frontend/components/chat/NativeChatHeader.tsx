import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { ArrowLeft } from 'phosphor-react-native'
import { Avatar } from '../ui'
import type { AppColors } from '../../tokens'
import type { GroupKind, PersonSummary } from '../boards'
import { GroupConversationAvatar, GroupIcon } from './GroupAvatar'

export function NativeChatHeader({
  colors,
  insetsTop,
  title,
  subtitle,
  avatarName,
  avatarInitials,
  avatarColor,
  groupMembers,
  groupKind,
  hideAvatar,
  onBack,
}: {
  colors: AppColors
  insetsTop: number
  title: string
  subtitle?: string
  avatarName?: string
  avatarInitials?: string
  avatarColor?: string
  groupMembers?: PersonSummary[]
  groupKind?: GroupKind
  hideAvatar?: boolean
  onBack: () => void
}) {
  return (
    <View
      style={{
        paddingTop: insetsTop + 6,
        paddingHorizontal: 14,
        paddingBottom: 10,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center' }}>
        <Pressable
          onPress={onBack}
          hitSlop={10}
          style={{
            width: 82,
            minHeight: 42,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <ArrowLeft size={21} color={colors.accent} />
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 15, color: colors.accent }}>
            Back
          </Text>
        </Pressable>

        <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
          {hideAvatar ? null : groupMembers && groupMembers.length > 0 ? (
            <GroupConversationAvatar members={groupMembers} size={36} colors={colors} />
          ) : groupKind ? (
            <GroupIcon kind={groupKind} colors={colors} active />
          ) : (
            <Avatar
              name={avatarName || title}
              initials={avatarInitials}
              size={34}
              backgroundColor={avatarColor}
            />
          )}
          <Text style={{ fontSize: 14, color: colors.text }} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={{ fontSize: 11, color: colors.textFaint }} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={{ width: 82 }} />
      </View>
    </View>
  )
}

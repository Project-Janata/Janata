import React from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { Building2, CalendarDays, Globe2, Search } from 'lucide-react-native'
import type { AppColors } from '../../tokens'
import type { GroupBoard } from './types'

// Right context rail: search + the member's boards (center badged YOUR CENTER).
// Shared by the populated feed and the "first post" empty state so the rail
// geometry stays identical as the feed fills in.
export function FeedContextRail({
  groups,
  colors,
  query,
  onChangeQuery,
  onOpenGroup,
  hideSearch = false,
}: {
  groups: GroupBoard[]
  colors: AppColors
  query: string
  onChangeQuery?: (value: string) => void
  onOpenGroup: (group: GroupBoard) => void
  /** Mobile reuse: the search box already lives in the feed header. */
  hideSearch?: boolean
}) {
  return (
    <View style={{ gap: 16 }}>
      {hideSearch ? null : (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            height: 42,
            paddingHorizontal: 14,
            borderRadius: 999,
            backgroundColor: colors.surface,
          }}
        >
          <Search size={16} color={colors.textFaint} />
          <TextInput
            value={query}
            onChangeText={onChangeQuery}
            placeholder="Search posts and people"
            placeholderTextColor={colors.textFaint}
            style={{ flex: 1, fontSize: 14, color: colors.text, paddingVertical: 0, outlineStyle: 'none' } as any}
          />
        </View>
      )}

      {groups.length > 0 ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 16,
            backgroundColor: colors.card,
            padding: 16,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              letterSpacing: 0.9,
              textTransform: 'uppercase',
              color: colors.textFaint,
              fontWeight: '600',
              marginBottom: 8,
            }}
          >
            Your boards
          </Text>
          {groups.map((group) => (
            <RailBoardRow key={group.id} group={group} colors={colors} onPress={() => onOpenGroup(group)} />
          ))}
        </View>
      ) : null}
    </View>
  )
}

function RailBoardRow({
  group,
  colors,
  onPress,
}: {
  group: GroupBoard
  colors: AppColors
  onPress: () => void
}) {
  const isCenter = group.kind === 'center'
  const isPublic = group.kind === 'public'
  const Icon = isPublic ? Globe2 : isCenter ? Building2 : CalendarDays
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${group.title}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 9 }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          backgroundColor: isCenter ? colors.panel : colors.accentSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={16} color={isCenter ? colors.textMuted : colors.accent} strokeWidth={2.3} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text style={{ fontSize: 13.5, color: colors.text }} numberOfLines={1}>
          {group.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {isCenter ? (
            <View
              style={{
                backgroundColor: colors.accentSoft,
                borderRadius: 4,
                paddingHorizontal: 5,
                paddingVertical: 1,
              }}
            >
              <Text style={{ fontSize: 9.5, fontWeight: '700', letterSpacing: 0.3, color: colors.accent }}>
                YOUR CENTER
              </Text>
            </View>
          ) : isPublic ? (
            <Text style={{ fontSize: 11.5, color: colors.textFaint }} numberOfLines={1}>
              Signed-in members
            </Text>
          ) : null}
          <Text style={{ fontSize: 12, color: colors.textFaint }} numberOfLines={1}>
            {group.eyebrow}
          </Text>
        </View>
      </View>
    </Pressable>
  )
}

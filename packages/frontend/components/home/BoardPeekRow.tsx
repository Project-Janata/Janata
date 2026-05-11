import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { MessageCircle } from 'lucide-react-native'
import { Avatar } from '../ui'
import type { BoardMessage } from '../connect'

export type HomeBoardPost = BoardMessage & {
  sourceTitle: string
  sourceKind: 'center' | 'event'
}

export function BoardPeekRow({
  post,
  showDivider,
  textColor,
  bodyColor,
  mutedColor,
  faintColor,
  dividerColor,
  accentColor,
  onPress,
}: {
  post: HomeBoardPost
  showDivider: boolean
  textColor: string
  bodyColor: string
  mutedColor: string
  faintColor: string
  dividerColor: string
  accentColor: string
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: showDivider ? 1 : 0,
        borderBottomColor: dividerColor,
      }}
    >
      <Avatar
        name={post.author.name}
        initials={post.author.initials}
        size={32}
        backgroundColor={post.author.accentColor}
      />
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: textColor }} numberOfLines={1}>
            {post.author.name}
          </Text>
          {post.author.verification === 'sevak' ? (
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 10.5, color: '#C2410C', letterSpacing: 0.4 }}>
              SEVAK
            </Text>
          ) : null}
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 11, color: mutedColor }} numberOfLines={1}>
            · in {post.sourceTitle}
          </Text>
          <Text style={{ marginLeft: 'auto', fontFamily: 'Inclusive Sans', fontSize: 11, color: faintColor }}>
            {post.timestamp}
          </Text>
        </View>
        <Text
          style={{ fontFamily: 'Inclusive Sans', fontSize: 13, lineHeight: 18, color: bodyColor }}
          numberOfLines={2}
        >
          {post.body}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <MessageCircle size={12} color={accentColor} strokeWidth={2.3} />
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: accentColor }}>
            {post.replyCount ?? 1} {(post.replyCount ?? 1) === 1 ? 'reply' : 'replies'}
          </Text>
        </View>
      </View>
    </Pressable>
  )
}

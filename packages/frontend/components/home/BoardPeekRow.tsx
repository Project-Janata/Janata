import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { ChatCircle } from 'phosphor-react-native'
import { Avatar } from '../ui'
import { useColors } from '../../hooks/useColors'
import type { BoardMessage } from '../boards'

export type HomeBoardPost = BoardMessage & {
  sourceTitle: string
  sourceKind: 'center' | 'event'
}

export function BoardPeekRow({
  post,
  showDivider,
  onPress,
}: {
  post: HomeBoardPost
  showDivider: boolean
  onPress: () => void
}) {
  const c = useColors()

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: showDivider ? 1 : 0,
        borderBottomColor: c.divider,
      }}
    >
      <Avatar name={post.author.name} initials={post.author.initials} size={32} backgroundColor={post.author.accentColor} />
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: c.text }} numberOfLines={1}>{post.author.name}</Text>
            {post.author.verification === 'sevak' && (
              <Text style={{ fontSize: 10, letterSpacing: 0.5, color: '#C2410C', flexShrink: 0 }}>SEVAK</Text>
            )}
            <Text style={{ flex: 1, fontSize: 11, color: c.textMuted }} numberOfLines={1} ellipsizeMode="tail">· in {post.sourceTitle}</Text>
          </View>
          <Text style={{ fontSize: 11, color: c.textFaint, flexShrink: 0 }}>{post.timestamp}</Text>
        </View>
        <Text style={{ fontSize: 13, lineHeight: 18, color: c.textSecondary }} numberOfLines={2}>{post.body}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <ChatCircle size={12} color={c.accent} />
          <Text style={{ fontSize: 12, color: c.accent }}>
            {post.replyCount ?? 1} {(post.replyCount ?? 1) === 1 ? 'reply' : 'replies'}
          </Text>
        </View>
      </View>
    </Pressable>
  )
}

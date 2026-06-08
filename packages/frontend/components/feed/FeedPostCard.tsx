import React, { useState } from 'react'
import { Image, Pressable, Text, View } from 'react-native'
import { Building2, CalendarDays, Globe2, MessageCircle } from 'lucide-react-native'
import { Avatar, ImageLightbox } from '../ui'
import type { AppColors } from '../../tokens'
import type { FeedPost } from './types'

export function FeedPostCard({
  post,
  colors,
  onPress,
}: {
  post: FeedPost
  colors: AppColors
  onPress?: () => void
}) {
  const reactions = post.reactions ?? [{ emoji: '🙏', count: 2 }]
  const replies = post.replyCount ?? 2
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const isEvent = post.sourceKind === 'event'
  const isPublic = post.sourceKind === 'public'

  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <View
          style={{
            width: 18,
            height: 18,
            borderRadius: 5,
            backgroundColor: isEvent || isPublic ? colors.accentSoft : colors.panel,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isPublic ? (
            <Globe2 size={10} color={colors.accent} strokeWidth={2.4} />
          ) : isEvent ? (
            <CalendarDays size={10} color={colors.accent} strokeWidth={2.4} />
          ) : (
            <Building2 size={10} color={colors.textMuted} strokeWidth={2.3} />
          )}
        </View>
        <Text style={{ fontSize: 12, color: colors.textMuted }} numberOfLines={1}>
          {post.sourceTitle}
        </Text>
        <Text style={{ fontSize: 12, color: colors.textFaint }}>· {post.timestamp}</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Avatar
          name={post.author.name}
          initials={post.author.initials}
          size={38}
          backgroundColor={post.author.accentColor}
        />
        <View style={{ flex: 1, gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 14, color: colors.text }}>{post.author.name}</Text>
            {post.author.verification === 'sevak' ? (
              <View
                style={{
                  backgroundColor: colors.accentSoft,
                  paddingHorizontal: 6,
                  paddingVertical: 1,
                  borderRadius: 4,
                }}
              >
                <Text style={{ fontSize: 10, color: colors.accent }}>SEVAK</Text>
              </View>
            ) : null}
          </View>

          <Text style={{ fontSize: 14, lineHeight: 20, color: colors.text }}>{post.body}</Text>

          {post.imageUrl ? (
            <>
              <Pressable
                onPress={() => setLightboxOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="View image full screen"
                style={{ marginTop: 8, width: '100%', height: 200, borderRadius: 14, overflow: 'hidden', backgroundColor: colors.panel }}
              >
                <Image source={{ uri: post.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              </Pressable>
              <ImageLightbox uri={post.imageUrl} visible={lightboxOpen} onClose={() => setLightboxOpen(false)} />
            </>
          ) : null}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 6 }}>
            {reactions.map((reaction, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 13 }}>{reaction.emoji}</Text>
                <Text
                  style={{ fontSize: 12, color: colors.textMuted }}
                >
                  {reaction.count}
                </Text>
              </View>
            ))}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <MessageCircle size={13} color={colors.textMuted} />
              <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.textMuted }}>
                {replies}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  )
}

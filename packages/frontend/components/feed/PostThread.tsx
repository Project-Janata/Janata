import React from 'react'
import { ScrollView, Text, TextInput, View } from 'react-native'
import { Building2, CalendarDays, Send } from 'lucide-react-native'
import { Avatar } from '../ui'
import type { AppColors } from '../../tokens'
import type { BoardMessage } from '../connect'
import type { FeedPost } from './types'

export function PostThread({
  post,
  colors,
  fullScreen = false,
  bottomInset = 0,
}: {
  post: FeedPost
  colors: AppColors
  fullScreen?: boolean
  bottomInset?: number
}) {
  const replies = post.replyMessages.slice(
    0,
    Math.max(post.replyCount ?? post.replyMessages.length, 1)
  )
  const content = (
    <View
      style={{
        paddingHorizontal: fullScreen ? 16 : 4,
        paddingTop: fullScreen ? 14 : 0,
        paddingBottom: 16,
      }}
    >
      <SourceBoardChip post={post} colors={colors} />
      <PostMessageBlock message={post} colors={colors} original />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          marginTop: 18,
          marginBottom: 14,
        }}
      >
        <Text
          style={{
            fontFamily: 'Inclusive Sans',
            fontSize: 12,
            letterSpacing: 0.5,
            color: colors.textFaint,
          }}
        >
          {replies.length} {replies.length === 1 ? 'REPLY' : 'REPLIES'}
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      </View>

      <View style={{ gap: 16 }}>
        {replies.map((reply) => (
          <PostMessageBlock key={reply.id} message={reply} colors={colors} />
        ))}
      </View>
    </View>
  )

  return (
    <View style={{ flex: fullScreen ? 1 : undefined, backgroundColor: colors.bg }}>
      {!fullScreen ? (
        <View style={{ paddingHorizontal: 4, paddingTop: 6, paddingBottom: 14, gap: 8 }}>
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.accent }}>
            {post.sourceLabel}
          </Text>
          <Text
            style={{
              fontFamily: 'Inclusive Sans',
              fontSize: 24,
              lineHeight: 29,
              color: colors.text,
            }}
          >
            Post
          </Text>
          <Text
            style={{
              fontFamily: 'Inclusive Sans',
              fontSize: 14,
              lineHeight: 20,
              color: colors.textMuted,
            }}
          >
            {post.sourceSubtitle}
          </Text>
        </View>
      ) : null}
      {fullScreen ? (
        <>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 16 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {content}
          </ScrollView>
          <ThreadReplyComposer colors={colors} bottomInset={bottomInset} />
        </>
      ) : (
        <View
          style={{
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
            overflow: 'hidden',
          }}
        >
          {content}
          <ThreadReplyComposer colors={colors} bottomInset={0} compact />
        </View>
      )}
    </View>
  )
}

function SourceBoardChip({ post, colors }: { post: FeedPost; colors: AppColors }) {
  const isEvent = post.groupKind === 'event'
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        borderRadius: 999,
        backgroundColor: colors.accentSoft,
        paddingHorizontal: 11,
        paddingVertical: 7,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {isEvent ? (
        <CalendarDays size={13} color={colors.accent} strokeWidth={2.3} />
      ) : (
        <Building2 size={13} color={colors.accent} strokeWidth={2.3} />
      )}
      <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.accent }}>
        {post.sourceTitle} - Board
      </Text>
    </View>
  )
}

function PostMessageBlock({
  message,
  colors,
  original = false,
}: {
  message: BoardMessage
  colors: AppColors
  original?: boolean
}) {
  const reactions = message.reactions ?? []

  return (
    <View style={{ flexDirection: 'row', gap: original ? 12 : 10 }}>
      <Avatar
        name={message.author.name}
        initials={message.author.initials}
        size={original ? 42 : 34}
        backgroundColor={message.author.accentColor}
      />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <Text
            style={{
              fontFamily: 'Inclusive Sans',
              fontSize: original ? 15 : 13,
              color: colors.text,
            }}
          >
            {message.author.name}
          </Text>
          {message.author.verification === 'sevak' ? (
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: '#C2410C' }}>
              SEVAK
            </Text>
          ) : null}
          {message.pinned ? (
            <View
              style={{
                borderRadius: 999,
                backgroundColor: colors.panel,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 11, color: colors.textMuted }}>
                Pinned
              </Text>
            </View>
          ) : null}
          <Text
            style={{
              marginLeft: 'auto',
              fontFamily: 'Inclusive Sans',
              fontSize: 12,
              color: colors.textFaint,
            }}
          >
            {message.timestamp}
          </Text>
        </View>

        <Text
          style={{
            marginTop: original ? 8 : 5,
            fontFamily: 'Inclusive Sans',
            fontSize: original ? 16 : 14,
            lineHeight: original ? 23 : 20,
            color: colors.textMuted,
          }}
        >
          {message.body}
        </Text>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 7,
            flexWrap: 'wrap',
            marginTop: 10,
          }}
        >
          {reactions.map((reaction, index) => (
            <ReactionChip
              key={`${reaction.emoji}-${index}`}
              emoji={reaction.emoji}
              count={reaction.count}
              colors={colors}
              active={index === 0}
            />
          ))}
          {original ? (
            <View
              style={{
                borderRadius: 999,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: colors.border,
                paddingHorizontal: 10,
                paddingVertical: 5,
              }}
            >
              <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.textFaint }}>
                + React
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  )
}

function ReactionChip({
  emoji,
  count,
  colors,
  active,
}: {
  emoji: string
  count: number
  colors: AppColors
  active?: boolean
}) {
  return (
    <View
      style={{
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? colors.borderStrong : colors.border,
        backgroundColor: active ? colors.accentSoft : colors.panel,
        paddingHorizontal: 10,
        paddingVertical: 5,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <Text style={{ fontSize: 13 }}>{emoji}</Text>
      <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textMuted }}>
        {count}
      </Text>
    </View>
  )
}

function ThreadReplyComposer({
  colors,
  bottomInset,
  compact = false,
}: {
  colors: AppColors
  bottomInset: number
  compact?: boolean
}) {
  return (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.surface,
        paddingTop: compact ? 9 : 10,
        paddingHorizontal: 12,
        paddingBottom: compact ? 12 : Math.max(bottomInset, 8) + 8,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Avatar name="Aditi Mehta" initials="AM" size={30} backgroundColor="#0478A5" />
        <View
          style={{
            flex: 1,
            minHeight: 38,
            borderRadius: 19,
            backgroundColor: colors.panel,
            paddingHorizontal: 14,
            justifyContent: 'center',
          }}
        >
          <TextInput
            editable={false}
            placeholder="Reply..."
            placeholderTextColor={colors.textFaint}
            style={{ fontFamily: 'Inclusive Sans', fontSize: 15, color: colors.text }}
          />
        </View>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Send size={15} color="#FFFFFF" />
        </View>
      </View>
    </View>
  )
}

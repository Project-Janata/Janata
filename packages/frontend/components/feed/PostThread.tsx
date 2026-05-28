import React, { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Building2, CalendarDays, Send } from 'lucide-react-native'
import { Avatar } from '../ui'
import { useUser } from '../contexts'
import type { AppColors } from '../../tokens'
import { boardPostToMessage, type BoardMessage } from '../boards'
import { createBoardPostReply, fetchBoardPostReplies } from '../../utils/api'
import { authorFromUser, optimisticReply } from './feedData'
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
  const { user } = useUser()
  const author = authorFromUser(user)
  const [replies, setReplies] = useState<BoardMessage[]>([])
  const [loadingReplies, setLoadingReplies] = useState(true)
  const [repliesLoaded, setRepliesLoaded] = useState(false)
  const [repliesError, setRepliesError] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const reloadKey = useRef(0)

  const loadReplies = () => {
    reloadKey.current += 1
    const requestId = reloadKey.current
    setLoadingReplies(true)
    setRepliesError(null)
    fetchBoardPostReplies(post.postId)
      .then((raw) => {
        if (requestId !== reloadKey.current) return
        setReplies(raw.map(boardPostToMessage))
        setRepliesLoaded(true)
      })
      .catch((err: any) => {
        if (requestId !== reloadKey.current) return
        setRepliesError(err?.message || 'Could not load replies.')
      })
      .finally(() => {
        if (requestId !== reloadKey.current) return
        setLoadingReplies(false)
      })
  }

  useEffect(() => {
    loadReplies()
    // Reset composer when switching between posts.
    setDraft('')
    setSendError(null)
    setRepliesLoaded(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.postId])

  const handleSend = async () => {
    const body = draft.trim()
    if (!body || sending) return
    const tempId = `temp-${Date.now()}`
    const pending = optimisticReply(user, body, tempId)
    setReplies((prev) => [...prev, pending])
    setDraft('')
    setSendError(null)
    setSending(true)
    try {
      const created = await createBoardPostReply(post.postId, body)
      setReplies((prev) => prev.map((r) => (r.id === tempId ? boardPostToMessage(created) : r)))
      setRepliesLoaded(true)
    } catch (err: any) {
      // Roll back the optimistic reply and give the user their text back.
      setReplies((prev) => prev.filter((r) => r.id !== tempId))
      setDraft(body)
      setSendError(err?.message || 'Reply failed to send. Try again.')
    } finally {
      setSending(false)
    }
  }

  // Until replies load, trust the post's own count instead of showing 0.
  const replyCountLabel = repliesLoaded ? replies.length : (post.replyCount ?? 0)

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
            fontSize: 12,
            letterSpacing: 0.5,
            color: colors.textFaint,
          }}
        >
          {replyCountLabel} {replyCountLabel === 1 ? 'REPLY' : 'REPLIES'}
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      </View>

      {repliesError ? (
        <View style={{ paddingVertical: 12, gap: 8, alignItems: 'flex-start' }}>
          <Text style={{ fontSize: 13, color: colors.textMuted }}>{repliesError}</Text>
          <Pressable
            onPress={loadReplies}
            accessibilityRole="button"
            accessibilityLabel="Retry loading replies"
            style={{
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Text style={{ fontSize: 13, color: colors.accent }}>Retry</Text>
          </Pressable>
        </View>
      ) : loadingReplies ? (
        <View style={{ paddingVertical: 16, alignItems: 'center' }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : replies.length === 0 ? (
        <View style={{ paddingVertical: 12 }}>
          <Text style={{ fontSize: 14, color: colors.textFaint }}>
            No replies yet. Be the first to reply.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          {replies.map((reply) => (
            <PostMessageBlock key={reply.id} message={reply} colors={colors} />
          ))}
        </View>
      )}
    </View>
  )

  const composer = (
    <ThreadReplyComposer
      colors={colors}
      bottomInset={fullScreen ? bottomInset : 0}
      compact={!fullScreen}
      value={draft}
      onChangeText={(text) => {
        setDraft(text)
        if (sendError) setSendError(null)
      }}
      onSend={handleSend}
      sending={sending}
      error={sendError}
      authorInitials={author.initials}
      authorName={author.name}
      authorColor={author.accentColor}
    />
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
          {composer}
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
          {composer}
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
            <Text style={{ fontSize: 12, color: '#C2410C' }}>SEVAK</Text>
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
              <Text style={{ fontSize: 11, color: colors.textMuted }}>Pinned</Text>
            </View>
          ) : null}
          <Text style={{ marginLeft: 'auto', fontSize: 12, color: colors.textFaint }}>
            {message.timestamp}
          </Text>
        </View>

        <Text
          style={{
            marginTop: original ? 8 : 5,
            fontSize: original ? 16 : 14,
            lineHeight: original ? 23 : 20,
            color: colors.textMuted,
          }}
        >
          {message.body}
        </Text>

        {reactions.length > 0 ? (
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
          </View>
        ) : null}
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
      <Text style={{ fontSize: 13, color: colors.textMuted }}>{count}</Text>
    </View>
  )
}

function ThreadReplyComposer({
  colors,
  bottomInset,
  compact = false,
  value,
  onChangeText,
  onSend,
  sending,
  error,
  authorInitials,
  authorName,
  authorColor,
}: {
  colors: AppColors
  bottomInset: number
  compact?: boolean
  value: string
  onChangeText: (text: string) => void
  onSend: () => void
  sending: boolean
  error?: string | null
  authorInitials: string
  authorName: string
  authorColor?: string
}) {
  const canSend = value.trim().length > 0 && !sending
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
      {error ? (
        <Text style={{ fontSize: 12, color: '#C2410C', marginBottom: 8 }}>{error}</Text>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Avatar name={authorName} initials={authorInitials} size={30} backgroundColor={authorColor} />
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
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={onSend}
            editable={!sending}
            returnKeyType="send"
            multiline
            placeholder="Reply..."
            placeholderTextColor={colors.textFaint}
            style={{ fontSize: 15, color: colors.text, paddingVertical: 8 }}
          />
        </View>
        <Pressable
          onPress={onSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Send reply"
          accessibilityState={{ disabled: !canSend }}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.accent,
            opacity: canSend ? 1 : 0.45,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Send size={15} color="#FFFFFF" />
          )}
        </Pressable>
      </View>
    </View>
  )
}

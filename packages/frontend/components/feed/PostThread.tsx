import React, { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Image, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import {
  Building2,
  CalendarDays,
  ChevronUp,
  Globe2,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Send,
  SmilePlus,
  Trash2,
} from 'lucide-react-native'
import { Avatar, ImageLightbox } from '../ui'
import { useUser } from '../contexts'
import type { AppColors } from '../../tokens'
import { boardPostToMessage, type BoardMessage } from '../boards'
import {
  createBoardPostReply,
  deleteBoardPost,
  editBoardPost,
  fetchBoardPostReplies,
  setBoardPostPinned,
  toggleBoardPostReaction,
} from '../../utils/api'
import {
  applyOptimisticReaction,
  authorFromUser,
  canModifyPost,
  canPinPosts,
  optimisticReply,
} from './feedData'
import type { FeedPost } from './types'
import { useAnalytics } from '../../utils/analytics'

const REACTION_CHOICES = ['🙏', '❤️', '👍', '🎉']

export function PostThread({
  post,
  colors,
  fullScreen = false,
  bottomInset = 0,
  hideSourceChip = false,
  onCollapse,
  onPostChanged,
  onPostDeleted,
}: {
  post: FeedPost
  colors: AppColors
  fullScreen?: boolean
  bottomInset?: number
  // Desktop renders its own "← Feed" + board chip above the thread, so the
  // card's SourceBoardChip would just repeat it. Hide it in that case.
  hideSourceChip?: boolean
  // When set, the thread is an inline-expanded feed card: render a "Hide"
  // control so the user can collapse it back to a normal post card.
  onCollapse?: () => void
  // Refresh the feed list after a pin/edit/reaction so it reflects the change.
  onPostChanged?: () => void
  // Close the detail surface after the post is deleted.
  onPostDeleted?: () => void
}) {
  const { user } = useUser()
  const { track } = useAnalytics()
  const author = authorFromUser(user)
  const [replies, setReplies] = useState<BoardMessage[]>([])
  const [loadingReplies, setLoadingReplies] = useState(true)
  const [repliesLoaded, setRepliesLoaded] = useState(false)
  const [repliesError, setRepliesError] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const reloadKey = useRef(0)

  // Original-post mutable state (optimistic pin / edit / delete / reactions).
  const [pinned, setPinned] = useState(!!post.pinned)
  const [postBody, setPostBody] = useState(post.body)
  const [reactions, setReactions] = useState(post.reactions ?? [])
  const [deleted, setDeleted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editDraft, setEditDraft] = useState(post.body)
  const [actionBusy, setActionBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const canPin = post.groupKind !== 'public' && canPinPosts(user)
  const isAuthor = canModifyPost(user, post.author.id)
  const hasMenu = canPin || isAuthor

  const handleTogglePin = async () => {
    if (actionBusy) return
    const prev = pinned
    setPinned(!prev)
    setMenuOpen(false)
    setActionBusy(true)
    setActionError(null)
    track('feed_post_pin_toggled', { post_id: post.postId, pinned: !prev, source: 'post_thread' })
    try {
      await setBoardPostPinned(post.postId, !prev)
      onPostChanged?.()
    } catch (err: any) {
      setPinned(prev)
      setActionError(err?.message || 'Could not update pin.')
    } finally {
      setActionBusy(false)
    }
  }

  const handleDelete = async () => {
    if (actionBusy) return
    setActionBusy(true)
    setActionError(null)
    try {
      await deleteBoardPost(post.postId)
      setDeleted(true)
      setMenuOpen(false)
      track('feed_post_deleted', { post_id: post.postId, source: 'post_thread' })
      // onPostDeleted already refreshes the feed; no separate change notice needed.
      onPostDeleted?.()
    } catch (err: any) {
      track('feed_post_delete_failed', { post_id: post.postId, error: err?.message, source: 'post_thread' })
      setActionError(err?.message || 'Could not delete the post.')
    } finally {
      setActionBusy(false)
    }
  }

  const handleSaveEdit = async () => {
    const body = editDraft.trim()
    if (!body || actionBusy) return
    const prev = postBody
    setPostBody(body)
    setEditOpen(false)
    setActionBusy(true)
    setActionError(null)
    try {
      const updated = await editBoardPost(post.postId, body)
      setPostBody(updated.body)
      track('feed_post_edited', { post_id: post.postId, source: 'post_thread' })
      onPostChanged?.()
    } catch (err: any) {
      setPostBody(prev)
      track('feed_post_edit_failed', { post_id: post.postId, error: err?.message, source: 'post_thread' })
      setActionError(err?.message || 'Could not save your edit.')
    } finally {
      setActionBusy(false)
    }
  }

  const handleReact = async (emoji: string) => {
    if (!user) return
    const prev = reactions
    setReactions(applyOptimisticReaction(prev, emoji))
    track('feed_post_reacted', { post_id: post.postId, emoji, source: 'post_thread' })
    try {
      const res = await toggleBoardPostReaction(post.postId, emoji)
      setReactions(res.reactions)
      onPostChanged?.()
    } catch {
      setReactions(prev)
    }
  }

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
    // Reset composer + original-post state when switching between posts.
    setDraft('')
    setSendError(null)
    setRepliesLoaded(false)
    setPinned(!!post.pinned)
    setPostBody(post.body)
    setReactions(post.reactions ?? [])
    setEditDraft(post.body)
    setDeleted(false)
    setMenuOpen(false)
    setEditOpen(false)
    setActionError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.postId])

  const handleSend = async () => {
    if (!user) return
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
      track('feed_reply_sent', { post_id: post.postId, source: 'post_thread' })
      // Replies are content too — count them in the cross-surface north-star.
      track('content_created', {
        content_type: 'reply',
        surface: 'post_thread',
        parent_id: post.postId,
        character_count: body?.length ?? 0,
      })
    } catch (err: any) {
      // Roll back the optimistic reply and give the user their text back.
      setReplies((prev) => prev.filter((r) => r.id !== tempId))
      setDraft(body)
      setSendError(err?.message || 'Reply failed to send. Try again.')
      track('feed_reply_failed', { post_id: post.postId, error: err?.message, source: 'post_thread' })
    } finally {
      setSending(false)
    }
  }

  // Until replies load, trust the post's own count instead of showing 0.
  const replyCountLabel = repliesLoaded ? replies.length : (post.replyCount ?? 0)

  const content = (
    <View
      style={{
        // Desktop renders the thread inside a card, so the content needs real
        // padding on all sides (the old 4/0 was for the master-detail pane).
        paddingHorizontal: fullScreen ? 16 : 18,
        paddingTop: fullScreen ? 14 : onCollapse ? 6 : 18,
        paddingBottom: 16,
      }}
    >
      {hideSourceChip ? null : <SourceBoardChip post={post} colors={colors} />}
      {deleted ? (
        <Text style={{ fontSize: 15, color: colors.textFaint, paddingVertical: 12 }}>
          This post was deleted.
        </Text>
      ) : (
        <OriginalPost
          key={post.postId}
          post={post}
          body={postBody}
          pinned={pinned}
          reactions={reactions}
          colors={colors}
          hasMenu={hasMenu}
          onOpenMenu={() => { setMenuOpen(true); track('feed_post_menu_opened', { post_id: post.postId, source: 'post_thread' }) }}
          onReact={handleReact}
        />
      )}

      {actionError ? (
        <Text style={{ fontSize: 12, color: '#C2410C', marginTop: 8 }}>{actionError}</Text>
      ) : null}

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
      {/* No standalone header here: the card below leads with SourceBoardChip +
          the original post, and the desktop feed renders its own "← Feed" back
          row + board chip above this. (Removed the old literal "Post" title and
          the malformed sourceSubtitle that read "Boston, MA - Nearby away".) */}
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
            borderColor: colors.accentSoft,
            backgroundColor: colors.card,
            overflow: 'hidden',
          }}
        >
          {onCollapse ? (
            <Pressable
              onPress={onCollapse}
              accessibilityRole="button"
              accessibilityLabel="Hide replies"
              hitSlop={6}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 4,
                paddingHorizontal: 18,
                paddingTop: 12,
                paddingBottom: 2,
              }}
            >
              <ChevronUp size={15} color={colors.textMuted} />
              <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12.5, color: colors.textMuted }}>
                Hide
              </Text>
            </Pressable>
          ) : null}
          {content}
          {composer}
        </View>
      )}

      <ActionMenuSheet
        visible={menuOpen}
        colors={colors}
        canPin={canPin}
        isAuthor={isAuthor}
        pinned={pinned}
        busy={actionBusy}
        postId={post.postId}
        onClose={() => setMenuOpen(false)}
        onTogglePin={handleTogglePin}
        onEdit={() => {
          setMenuOpen(false)
          setEditDraft(postBody)
          setEditOpen(true)
          track('feed_post_edit_opened', { post_id: post.postId, source: 'post_thread' })
        }}
        onDelete={handleDelete}
      />

      <EditPostModal
        visible={editOpen}
        colors={colors}
        value={editDraft}
        busy={actionBusy}
        onChangeText={setEditDraft}
        onCancel={() => { setEditOpen(false); track('feed_post_edit_cancelled', { post_id: post.postId, source: 'post_thread' }) }}
        onSave={handleSaveEdit}
      />
    </View>
  )
}

function SourceBoardChip({ post, colors }: { post: FeedPost; colors: AppColors }) {
  const isEvent = post.groupKind === 'event'
  const isPublic = post.groupKind === 'public'
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
      {isPublic ? (
        <Globe2 size={13} color={colors.accent} strokeWidth={2.3} />
      ) : isEvent ? (
        <CalendarDays size={13} color={colors.accent} strokeWidth={2.3} />
      ) : (
        <Building2 size={13} color={colors.accent} strokeWidth={2.3} />
      )}
      <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.accent }}>
        {isPublic ? post.sourceTitle : `${post.sourceTitle} - Board`}
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
  onPress,
}: {
  emoji: string
  count: number
  colors: AppColors
  active?: boolean
  onPress?: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? `React ${emoji}` : undefined}
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
    </Pressable>
  )
}

function OriginalPost({
  post,
  body,
  pinned,
  reactions,
  colors,
  hasMenu,
  onOpenMenu,
  onReact,
}: {
  post: FeedPost
  body: string
  pinned: boolean
  reactions: Array<{ emoji: string; count: number }>
  colors: AppColors
  hasMenu: boolean
  onOpenMenu: () => void
  onReact: (emoji: string) => void
}) {
  const { track } = useAnalytics()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <Avatar
        name={post.author.name}
        initials={post.author.initials}
        size={42}
        backgroundColor={post.author.accentColor}
      />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 15, color: colors.text }}>
            {post.author.name}
          </Text>
          {post.author.verification === 'sevak' ? (
            <Text style={{ fontSize: 12, color: '#C2410C' }}>SEVAK</Text>
          ) : null}
          {pinned ? (
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
            {post.timestamp}
          </Text>
          {hasMenu ? (
            <Pressable
              onPress={onOpenMenu}
              accessibilityRole="button"
              accessibilityLabel="Post actions"
              hitSlop={8}
              style={{ paddingLeft: 2 }}
            >
              <MoreHorizontal size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        <Text
          style={{
            marginTop: 8,
            fontSize: 16,
            lineHeight: 23,
            color: colors.textMuted,
          }}
        >
          {body}
        </Text>

        {post.imageUrl ? (
          <>
            <Pressable
              onPress={() => setLightboxOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="View image full screen"
              style={{ marginTop: 12, width: '100%', maxWidth: 420, height: 280, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.surface }}
            >
              <Image source={{ uri: post.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </Pressable>
            <ImageLightbox uri={post.imageUrl} visible={lightboxOpen} onClose={() => setLightboxOpen(false)} />
          </>
        ) : null}

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
              onPress={() => onReact(reaction.emoji)}
            />
          ))}
          <Pressable
            onPress={() => { const next = !pickerOpen; setPickerOpen(next); if (next) track('feed_post_reaction_picker_opened', { post_id: post.postId, source: 'post_thread' }) }}
            accessibilityRole="button"
            accessibilityLabel="Add reaction"
            style={{
              borderRadius: 999,
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: colors.border,
              paddingHorizontal: 10,
              paddingVertical: 5,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <SmilePlus size={13} color={colors.textFaint} />
            <Text style={{ fontSize: 12, color: colors.textFaint }}>React</Text>
          </Pressable>
        </View>

        {pickerOpen ? (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {REACTION_CHOICES.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => {
                  setPickerOpen(false)
                  onReact(emoji)
                }}
                accessibilityRole="button"
                accessibilityLabel={`React ${emoji}`}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: colors.panel,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 18 }}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  )
}

function ActionMenuSheet({
  visible,
  colors,
  canPin,
  isAuthor,
  pinned,
  busy,
  postId,
  onClose,
  onTogglePin,
  onEdit,
  onDelete,
}: {
  visible: boolean
  colors: AppColors
  canPin: boolean
  isAuthor: boolean
  pinned: boolean
  busy: boolean
  postId: string
  onClose: () => void
  onTogglePin: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { track } = useAnalytics()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  useEffect(() => {
    if (!visible) setConfirmingDelete(false)
  }, [visible])

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingTop: 10,
            paddingBottom: 28,
            paddingHorizontal: 12,
            gap: 4,
          }}
        >
          <View
            style={{
              alignSelf: 'center',
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.border,
              marginBottom: 8,
            }}
          />
          {canPin ? (
            <MenuRow
              icon={pinned ? <PinOff size={18} color={colors.text} /> : <Pin size={18} color={colors.text} />}
              label={pinned ? 'Unpin post' : 'Pin post'}
              colors={colors}
              disabled={busy}
              onPress={onTogglePin}
            />
          ) : null}
          {isAuthor ? (
            <MenuRow
              icon={<Pencil size={18} color={colors.text} />}
              label="Edit post"
              colors={colors}
              disabled={busy}
              onPress={onEdit}
            />
          ) : null}
          {isAuthor ? (
            confirmingDelete ? (
              <View style={{ paddingVertical: 10, paddingHorizontal: 12, gap: 10 }}>
                <Text style={{ fontSize: 14, color: colors.text }}>
                  Delete this post for everyone?
                </Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Pressable
                    onPress={() => { setConfirmingDelete(false); track('feed_post_delete_cancelled', { post_id: postId, source: 'post_thread' }) }}
                    disabled={busy}
                    accessibilityRole="button"
                    accessibilityLabel="Cancel delete"
                    style={{
                      flex: 1,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: colors.border,
                      paddingVertical: 11,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 14, color: colors.text }}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={onDelete}
                    disabled={busy}
                    accessibilityRole="button"
                    accessibilityLabel="Confirm delete"
                    style={{
                      flex: 1,
                      borderRadius: 12,
                      backgroundColor: '#C2410C',
                      paddingVertical: 11,
                      alignItems: 'center',
                      opacity: busy ? 0.6 : 1,
                    }}
                  >
                    {busy ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={{ fontSize: 14, color: '#FFFFFF' }}>Delete</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            ) : (
              <MenuRow
                icon={<Trash2 size={18} color="#C2410C" />}
                label="Delete post"
                colors={colors}
                destructive
                disabled={busy}
                onPress={() => { setConfirmingDelete(true); track('feed_post_delete_confirm_shown', { post_id: postId, source: 'post_thread' }) }}
              />
            )
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function MenuRow({
  icon,
  label,
  colors,
  destructive = false,
  disabled = false,
  onPress,
}: {
  icon: React.ReactNode
  label: string
  colors: AppColors
  destructive?: boolean
  disabled?: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 13,
        paddingHorizontal: 12,
        borderRadius: 12,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {icon}
      <Text style={{ fontSize: 15, color: destructive ? '#C2410C' : colors.text }}>{label}</Text>
    </Pressable>
  )
}

function EditPostModal({
  visible,
  colors,
  value,
  busy,
  onChangeText,
  onCancel,
  onSave,
}: {
  visible: boolean
  colors: AppColors
  value: string
  busy: boolean
  onChangeText: (text: string) => void
  onCancel: () => void
  onSave: () => void
}) {
  const canSave = value.trim().length > 0 && !busy
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.35)',
          justifyContent: 'center',
          paddingHorizontal: 20,
        }}
      >
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 20,
            padding: 18,
            gap: 14,
          }}
        >
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 18, color: colors.text }}>
            Edit post
          </Text>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            editable={!busy}
            multiline
            placeholder="Update your post..."
            placeholderTextColor={colors.textFaint}
            style={{
              minHeight: 96,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.panel,
              padding: 12,
              fontSize: 15,
              color: colors.text,
              textAlignVertical: 'top',
            }}
          />
          <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
            <Pressable
              onPress={onCancel}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Cancel edit"
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                paddingVertical: 10,
                paddingHorizontal: 18,
              }}
            >
              <Text style={{ fontSize: 14, color: colors.text }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onSave}
              disabled={!canSave}
              accessibilityRole="button"
              accessibilityLabel="Save edit"
              accessibilityState={{ disabled: !canSave }}
              style={{
                borderRadius: 12,
                backgroundColor: colors.accent,
                paddingVertical: 10,
                paddingHorizontal: 18,
                opacity: canSave ? 1 : 0.45,
              }}
            >
              {busy ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={{ fontSize: 14, color: '#FFFFFF' }}>Save</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
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
  // Auto-grow: the input starts as a single line and grows with content up to
  // a cap. Tracking the measured content height (not a fixed minHeight) keeps
  // the pill exactly one line tall to start instead of rendering a tall box.
  const LINE_HEIGHT = 20
  const MAX_INPUT_HEIGHT = 120
  const [inputHeight, setInputHeight] = useState(LINE_HEIGHT)
  const grownHeight = Math.min(Math.max(LINE_HEIGHT, inputHeight), MAX_INPUT_HEIGHT)
  return (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.surface,
        paddingTop: compact ? 12 : 10,
        // Align the composer's horizontal inset with the thread content above
        // it (18 on the desktop card) so the avatars line up.
        paddingHorizontal: compact ? 18 : 12,
        paddingBottom: compact ? 14 : Math.max(bottomInset, 8) + 8,
      }}
    >
      {error ? (
        <Text style={{ fontSize: 12, color: '#C2410C', marginBottom: 8 }}>{error}</Text>
      ) : null}
      {/* Avatar pinned to the top and the send button to the bottom, so as the
          input grows vertically the row reads top-to-bottom instead of drifting
          to center. */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
        <View style={{ alignSelf: 'flex-start' }}>
          <Avatar name={authorName} initials={authorInitials} size={30} backgroundColor={authorColor} />
        </View>
        <View
          style={{
            flex: 1,
            borderRadius: 19,
            backgroundColor: colors.panel,
            paddingHorizontal: 14,
            paddingVertical: 9,
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
            onContentSizeChange={(e) => setInputHeight(e.nativeEvent.contentSize.height)}
            style={{
              fontSize: 15,
              lineHeight: LINE_HEIGHT,
              color: colors.text,
              height: grownHeight,
              padding: 0,
              textAlignVertical: 'center',
              ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
            }}
          />
        </View>
        <Pressable
          onPress={onSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Send reply"
          accessibilityState={{ disabled: !canSend }}
          style={{
            alignSelf: 'flex-end',
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

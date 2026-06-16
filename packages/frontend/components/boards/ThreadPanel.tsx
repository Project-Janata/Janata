import React, { useState } from 'react'
import { Image, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Building2, CalendarDays, Globe2, Lock, MessageCircle, MoreHorizontal, Send } from 'lucide-react-native'
import { Avatar, ImageLightbox } from '../ui'
import { useUser } from '../contexts'
import type { BoardMessage } from './__mocks__/mockData'

export type ComposerState = 'open' | 'locked'

export type ThreadPanelColors = {
  panelBg: string
  text: string
  textSecondary: string
  textMuted: string
  border: string
  iconBoxBg: string
  cardBg?: string
  avatarBorder?: string
  iconHeader?: string
  accent?: string
  accentSoft?: string
}

export function ThreadPanel({
  messages,
  colors,
  emptyTitle,
  emptySubtitle,
  composerPlaceholder,
  composerState = 'open',
  lockedTitle,
  lockedSubtitle,
  primaryActionLabel,
  secondaryActionLabel,
  onPrimaryAction,
  onSecondaryAction,
  scrollable = false,
  bottomInset = 0,
  visibleLabel,
  onMessagePress,
  onAuthorPress,
  onSubmitPost,
  showComposer = true,
  showSource = false,
}: {
  messages: BoardMessage[]
  colors: ThreadPanelColors
  emptyTitle: string
  emptySubtitle: string
  composerPlaceholder: string
  composerState?: ComposerState
  lockedTitle?: string
  lockedSubtitle?: string
  primaryActionLabel?: string
  secondaryActionLabel?: string
  onPrimaryAction?: () => void
  onSecondaryAction?: () => void
  scrollable?: boolean
  bottomInset?: number
  visibleLabel?: string
  onMessagePress?: (message: BoardMessage) => void
  onAuthorPress?: (authorId: string) => void
  onSubmitPost?: (body: string) => Promise<void> | void
  showComposer?: boolean
  showSource?: boolean
}) {
  if (composerState === 'locked') {
    return (
      <LockedBoardState
        colors={colors}
        title={lockedTitle || 'Member board'}
        subtitle={
          lockedSubtitle ||
          'Join this center or register for this event to participate in the board.'
        }
        primaryActionLabel={primaryActionLabel || 'Explore'}
        secondaryActionLabel={secondaryActionLabel || 'Back'}
        onPrimaryAction={onPrimaryAction}
        onSecondaryAction={onSecondaryAction}
        bottomInset={bottomInset}
      />
    )
  }

  const content = (
    <View>
      {showComposer ? (
        <BoardComposer
          colors={colors}
          placeholder={composerPlaceholder}
          visibleLabel={visibleLabel}
          onSubmit={onSubmitPost}
        />
      ) : null}

      {messages.length > 0 ? (
        <View>
          {messages.map((message) => (
            <BoardPostCard
              key={message.id}
              message={message}
              colors={colors}
              showSource={showSource}
              onPress={onMessagePress ? () => onMessagePress(message) : undefined}
              onAuthorPress={
                onAuthorPress && message.author.id ? () => onAuthorPress(message.author.id) : undefined
              }
            />
          ))}
        </View>
      ) : (
        <EmptyBoardState colors={colors} title={emptyTitle} subtitle={emptySubtitle} />
      )}
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: colors.panelBg }}>
      {scrollable ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: Math.max(bottomInset, 0) + 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </View>
  )
}

function BoardComposer({
  colors,
  placeholder,
  visibleLabel,
  onSubmit,
}: {
  colors: ThreadPanelColors
  placeholder: string
  visibleLabel?: string
  onSubmit?: (body: string) => Promise<void> | void
}) {
  const { user } = useUser()
  const composerName =
    user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}`
      : user?.firstName || user?.username || 'You'
  const [body, setBody] = useState('')
  const [focused, setFocused] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canSubmit = !!onSubmit && body.trim().length > 0 && !submitting
  const accent = colors.accent ?? '#E8862A'

  const handleSubmit = async () => {
    if (!canSubmit || !onSubmit) return
    const nextBody = body.trim()
    try {
      setError(null)
      setSubmitting(true)
      await onSubmit(nextBody)
      setBody('')
    } catch (err: any) {
      setError(err?.message || 'Could not create post.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: visibleLabel ? 14 : 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Avatar image={user?.profileImage || undefined} name={composerName} size={30} backgroundColor={accent} />
        <View
          style={{
            flex: 1,
            minHeight: 46,
            borderRadius: 12,
            backgroundColor: colors.cardBg ?? colors.panelBg,
            borderWidth: 1,
            borderColor: focused || body.length > 0 ? colors.border : 'transparent',
            flexDirection: 'row',
            alignItems: 'flex-end',
            paddingLeft: 12,
            paddingRight: 6,
            paddingVertical: 5,
            gap: 8,
          }}
        >
          <TextInput
            editable={!!onSubmit && !submitting}
            multiline
            value={body}
            onChangeText={setBody}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            style={{
              flex: 1,
              minHeight: 34,
              maxHeight: 120,
              paddingTop: 7,
              paddingBottom: 6,
              fontFamily: 'Inclusive Sans',
              fontSize: 15,
              lineHeight: 21,
              color: colors.text,
              textAlignVertical: 'top',
              outlineStyle: 'none',
            } as any}
          />
          <Pressable
            accessibilityLabel="Post to board"
            disabled={!canSubmit}
            onPress={handleSubmit}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: canSubmit ? accent : 'transparent',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            <Send size={15} color={canSubmit ? '#FFFFFF' : colors.textMuted} strokeWidth={2.3} />
          </Pressable>
        </View>
      </View>
      {visibleLabel ? (
        <Text
          style={{
            marginTop: 10,
            fontFamily: 'Inclusive Sans',
            fontSize: 13,
            color: colors.textMuted,
            lineHeight: 19,
          }}
        >
          {visibleLabel}
        </Text>
      ) : null}
      {error ? (
        <Text
          style={{
            marginTop: 10,
            fontFamily: 'Inclusive Sans',
            fontSize: 13,
            color: '#DC2626',
            lineHeight: 19,
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  )
}

function EmptyBoardState({
  colors,
  title,
  subtitle,
}: {
  colors: ThreadPanelColors
  title: string
  subtitle: string
}) {
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
        paddingTop: 72,
        paddingBottom: 88,
        gap: 12,
      }}
    >
      <Text
        style={{
          fontFamily: 'Inclusive Sans',
          fontSize: 19,
          color: colors.text,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: colors.textSecondary,
          lineHeight: 22,
          textAlign: 'center',
        }}
      >
        {subtitle}
      </Text>
    </View>
  )
}

export function BoardPostCard({
  message,
  colors,
  onPress,
  onAuthorPress,
  showSource = false,
  asCard = false,
}: {
  message: BoardMessage
  colors: ThreadPanelColors
  onPress?: () => void
  onAuthorPress?: () => void
  showSource?: boolean
  // Render the white rounded card chrome without forcing the source line.
  // (showSource still controls the board/event label; asCard just gives the
  // card frame so single-board feeds can use cards without redundant labels.)
  asCard?: boolean
}) {
  const replies = message.replyCount ?? 0
  const reactions = message.reactions ?? []
  const accent = colors.accent ?? '#E8862A'
  const accentSoft = colors.accentSoft ?? '#FFF7ED'
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const isFeedCard = showSource || asCard
  const sourceIcon =
    message.sourceKind === 'public' ? (
      <Globe2 size={11} color={accent} strokeWidth={2.4} />
    ) : message.sourceKind === 'event' ? (
      <CalendarDays size={11} color={accent} strokeWidth={2.4} />
    ) : (
      <Building2 size={11} color={colors.textSecondary} strokeWidth={2.3} />
    )

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress && Platform.OS !== 'web' ? 'button' : undefined}
      accessibilityLabel={onPress ? `Open post by ${message.author.name}` : undefined}
      style={{
        marginHorizontal: isFeedCard ? 0 : 0,
        marginBottom: isFeedCard ? 12 : 0,
        paddingHorizontal: isFeedCard ? 14 : 20,
        paddingVertical: isFeedCard ? 14 : 18,
        borderRadius: isFeedCard ? 16 : 0,
        borderWidth: isFeedCard ? 1 : 0,
        borderColor: isFeedCard ? (message.pinned ? '#FFE0C2' : colors.border) : 'transparent',
        borderBottomWidth: isFeedCard ? 1 : 1,
        borderBottomColor: isFeedCard
          ? message.pinned
            ? '#FFE0C2'
            : colors.border
          : colors.border,
        backgroundColor: isFeedCard ? (colors.cardBg ?? '#FFFFFF') : 'transparent',
        shadowColor: message.pinned ? '#C2410C' : '#000000',
        shadowOpacity: isFeedCard ? (message.pinned ? 0.08 : 0.03) : 0,
        shadowRadius: isFeedCard ? 12 : 0,
        shadowOffset: { width: 0, height: 4 },
      }}
    >
      {showSource && message.sourceLabel ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 }}>
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              backgroundColor: message.sourceKind === 'event' || message.sourceKind === 'public' ? accentSoft : colors.iconBoxBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {sourceIcon}
          </View>
          <Text
            style={{
              flex: 1,
              fontSize: 12,
              color: colors.textSecondary,
            }}
            numberOfLines={1}
          >
            {message.sourceLabel}
          </Text>
          {message.pinned ? <Pill label="Pinned" colors={colors} tone="accent" /> : null}
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <Pressable
          disabled={!onAuthorPress}
          onPress={(event) => {
            event.stopPropagation()
            onAuthorPress?.()
          }}
          accessibilityRole={onAuthorPress ? 'button' : undefined}
          accessibilityLabel={onAuthorPress ? `Open ${message.author.name}'s profile` : undefined}
          hitSlop={6}
        >
          <Avatar
            image={message.author.image}
            name={message.author.name}
            initials={message.author.initials}
            size={42}
            backgroundColor={message.author.accentColor}
          />
        </Pressable>

        <View style={{ flex: 1, gap: 8 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <View style={{ flex: 1 }}>
              <Pressable
                disabled={!onAuthorPress}
                onPress={(event) => {
                  event.stopPropagation()
                  onAuthorPress?.()
                }}
                accessibilityRole={onAuthorPress ? 'button' : undefined}
                accessibilityLabel={onAuthorPress ? `Open ${message.author.name}'s profile` : undefined}
                style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}
              >
                <Text
                  style={{
                    fontSize: isFeedCard ? 14 : 16,
                    color: colors.text,
                  }}
                >
                  {message.author.name}
                </Text>
                {message.author.verification === 'sevak' ? (
                  <Text
                    style={{
                      fontFamily: 'Inclusive Sans',
                      fontSize: 12,
                      letterSpacing: 0.4,
                      color: '#C2410C',
                    }}
                  >
                    {/* The author.verification === 'sevak' guard above means the label
                        is always SEVAK in this branch. PersonSummary used to have a
                        free-form `role` string that overrode the label; it was
                        consolidated into the `verification` enum, so the fallback is
                        the only path now. */}
                    SEVAK
                  </Text>
                ) : null}
                {!isFeedCard && message.pinned ? <Pill label="Pinned" colors={colors} /> : null}
              </Pressable>
              <Text
                style={{
                  fontSize: 13,
                  color: colors.textMuted,
                  marginTop: 2,
                }}
              >
                {message.timestamp}
              </Text>
            </View>
            {!isFeedCard ? <MoreHorizontal size={18} color={colors.textMuted} /> : null}
          </View>

          <Text
            style={{
              fontSize: isFeedCard ? 14 : 17,
              lineHeight: isFeedCard ? 20 : 26,
              color: colors.textSecondary,
            }}
          >
            {message.body}
          </Text>

          {message.imageUrl ? (
            <>
              <Pressable
                onPress={() => setLightboxOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="View image full screen"
                style={{ marginTop: 8, width: '100%', maxWidth: 360, height: 220, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.iconBoxBg }}
              >
                <Image source={{ uri: message.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              </Pressable>
              <ImageLightbox uri={message.imageUrl} visible={lightboxOpen} onClose={() => setLightboxOpen(false)} />
            </>
          ) : null}

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
              marginTop: 2,
            }}
          >
            {reactions.map((reaction, index) => (
              <ReactionPill
                key={`${reaction.emoji}-${index}`}
                emoji={reaction.emoji}
                count={reaction.count}
                colors={colors}
                active={index === 0}
              />
            ))}
            <Pressable
              disabled={!onPress}
              onPress={onPress}
              accessibilityRole={onPress ? 'button' : undefined}
              accessibilityLabel={onPress ? 'Open post to react' : undefined}
              style={{
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.border,
                borderStyle: 'dashed',
                paddingHorizontal: 12,
                paddingVertical: 5,
              }}
            >
              <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textMuted }}>
                + React
              </Text>
            </Pressable>
            <Pressable
              disabled={!onPress}
              onPress={onPress}
              accessibilityRole={onPress ? 'button' : undefined}
              accessibilityLabel={onPress ? 'Open post replies' : undefined}
              style={{
                marginLeft: isFeedCard ? 'auto' : 0,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {isFeedCard ? <MessageCircle size={13} color={accent} strokeWidth={2.3} /> : null}
              <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: accent }}>
                {replies} {replies === 1 ? 'reply' : 'replies'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  )
}

function ReactionPill({
  emoji,
  count,
  colors,
  active,
}: {
  emoji: string
  count: number
  colors: ThreadPanelColors
  active?: boolean
}) {
  return (
    <View
      style={{
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? (colors.accentSoft ?? colors.border) : colors.border,
        backgroundColor: active ? (colors.accentSoft ?? colors.iconBoxBg) : colors.iconBoxBg,
        paddingHorizontal: 10,
        paddingVertical: 5,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <Text style={{ fontSize: 13 }}>{emoji}</Text>
      <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textSecondary }}>
        {count}
      </Text>
    </View>
  )
}

function Pill({
  label,
  colors,
  tone = 'neutral',
}: {
  label: string
  colors: ThreadPanelColors
  tone?: 'neutral' | 'accent'
}) {
  return (
    <View
      style={{
        borderRadius: 999,
        backgroundColor:
          tone === 'accent' ? (colors.accentSoft ?? colors.iconBoxBg) : colors.iconBoxBg,
        paddingHorizontal: 9,
        paddingVertical: 3,
      }}
    >
      <Text
        style={{
          fontFamily: 'Inclusive Sans',
          fontSize: 12,
          color: tone === 'accent' ? (colors.accent ?? colors.textSecondary) : colors.textSecondary,
        }}
      >
        {label}
      </Text>
    </View>
  )
}

function LockedBoardState({
  colors,
  title,
  subtitle,
  primaryActionLabel,
  secondaryActionLabel,
  onPrimaryAction,
  onSecondaryAction,
  bottomInset,
}: {
  colors: ThreadPanelColors
  title: string
  subtitle: string
  primaryActionLabel: string
  secondaryActionLabel: string
  onPrimaryAction?: () => void
  onSecondaryAction?: () => void
  bottomInset: number
}) {
  const accent = colors.accent ?? '#E8862A'
  const hasPrimaryAction = !!onPrimaryAction
  const hasSecondaryAction = !!onSecondaryAction

  return (
    <View
      style={{
        flex: 1,
        minHeight: 460,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 26,
        paddingBottom: Math.max(bottomInset, 0) + 32,
        backgroundColor: colors.panelBg,
      }}
    >
      <View
        style={{
          width: 86,
          height: 86,
          borderRadius: 43,
          backgroundColor: colors.iconBoxBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 28,
        }}
      >
        <Lock size={34} color={colors.textMuted} strokeWidth={1.8} />
      </View>
      <Text
        style={{
          fontFamily: 'Inclusive Sans',
          fontSize: 21,
          color: colors.text,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          marginTop: 16,
          maxWidth: 360,
          fontFamily: 'Inclusive Sans',
          fontSize: 16,
          lineHeight: 25,
          color: colors.textSecondary,
          textAlign: 'center',
        }}
      >
        {subtitle}
      </Text>
      {hasPrimaryAction || hasSecondaryAction ? (
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 34, width: '100%', maxWidth: 430 }}>
          {hasPrimaryAction ? (
            <Pressable
              onPress={onPrimaryAction}
              style={{
                flex: 1,
                minHeight: 50,
                borderRadius: 999,
                backgroundColor: accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 15, color: '#FFFFFF' }}>
                {primaryActionLabel}
              </Text>
            </Pressable>
          ) : null}
          {hasSecondaryAction ? (
            <Pressable
              onPress={onSecondaryAction}
              style={{
                flex: 1,
                minHeight: 50,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.cardBg ?? colors.panelBg,
              }}
            >
              <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 15, color: colors.textSecondary }}>
                {secondaryActionLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  )
}

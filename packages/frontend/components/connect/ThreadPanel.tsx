import React from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Building2, CalendarDays, Lock, MessageCircle, MoreHorizontal } from 'lucide-react-native'
import { Avatar } from '../ui'
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
  showComposer?: boolean
  showSource?: boolean
}) {
  if (composerState === 'locked') {
    return (
      <LockedBoardState
        colors={colors}
        title={lockedTitle || 'For verified members'}
        subtitle={
          lockedSubtitle ||
          "Boards are conversations between verified CHYKs at a center. Get verified and you're in."
        }
        primaryActionLabel={primaryActionLabel || 'Redeem invite'}
        secondaryActionLabel={secondaryActionLabel || 'Apply'}
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
}: {
  colors: ThreadPanelColors
  placeholder: string
  visibleLabel?: string
}) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: visibleLabel ? 16 : 10 }}>
      <View
        style={{
          minHeight: 58,
          borderRadius: 16,
          backgroundColor: colors.iconBoxBg,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          gap: 12,
        }}
      >
        <Avatar name="Aditi Mehta" initials="AM" size={36} backgroundColor="#0478A5" />
        <TextInput
          editable={false}
          value=""
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          style={{
            flex: 1,
            fontFamily: 'Inclusive Sans',
            fontSize: 16,
            color: colors.textSecondary,
          }}
        />
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
  showSource = false,
}: {
  message: BoardMessage
  colors: ThreadPanelColors
  onPress?: () => void
  showSource?: boolean
}) {
  const replies = message.replyCount ?? Math.max(1, message.author.verification === 'sevak' ? 1 : 2)
  const reactions = message.reactions ?? [
    {
      emoji: message.author.verification === 'sevak' ? '🪔' : '🙏',
      count: message.author.verification === 'sevak' ? 6 : 2,
    },
  ]
  const accent = colors.accent ?? '#E8862A'
  const accentSoft = colors.accentSoft ?? '#FFF7ED'
  const isFeedCard = showSource
  const sourceIcon =
    message.sourceKind === 'event' ? (
      <CalendarDays size={11} color={accent} strokeWidth={2.4} />
    ) : (
      <Building2 size={11} color={colors.textSecondary} strokeWidth={2.3} />
    )

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
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
      {isFeedCard && message.sourceLabel ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 }}>
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              backgroundColor: message.sourceKind === 'event' ? accentSoft : colors.iconBoxBg,
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
        <Avatar
          name={message.author.name}
          initials={message.author.initials}
          size={42}
          backgroundColor={message.author.accentColor}
        />

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
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}
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
                    {message.author.role || 'SEVAK'}
                  </Text>
                ) : null}
                {!isFeedCard && message.pinned ? <Pill label="Pinned" colors={colors} /> : null}
              </View>
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

          {message.attachmentLabel ? (
            <View
              style={{
                marginTop: 2,
                height: 76,
                borderRadius: 18,
                backgroundColor: colors.iconBoxBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.textSecondary }}
              >
                {message.attachmentLabel}
              </Text>
            </View>
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
            <View
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
            </View>
            <View
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
            </View>
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
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 34, width: '100%', maxWidth: 430 }}>
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
      </View>
    </View>
  )
}

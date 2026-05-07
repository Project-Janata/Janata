import React from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Lock, MoreHorizontal, Send } from 'lucide-react-native'
import { Avatar } from '../ui'
import type { BoardMessage } from './mockData'

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
        <EmptyBoardState
          colors={colors}
          title={emptyTitle}
          subtitle={emptySubtitle}
        />
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
            fontFamily: 'Inter-Regular',
            fontSize: 16,
            color: colors.textSecondary,
          }}
        />
        <Send size={18} color={colors.textMuted} />
      </View>
      {visibleLabel ? (
        <Text
          style={{
            marginTop: 10,
            fontFamily: 'Inter-Regular',
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
          fontFamily: 'Inter-SemiBold',
          fontSize: 19,
          color: colors.text,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontFamily: 'Inter-Regular',
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
    { emoji: message.author.verification === 'sevak' ? '🪔' : '🙏', count: message.author.verification === 'sevak' ? 6 : 2 },
  ]

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={{
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <Avatar
          name={message.author.name}
          initials={message.author.initials}
          size={42}
          backgroundColor={message.author.accentColor}
        />

        <View style={{ flex: 1, gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 16, color: colors.text }}>
                  {message.author.name}
                </Text>
                {message.author.verification === 'sevak' ? (
                  <Text style={{ fontFamily: 'Inter-Bold', fontSize: 12, letterSpacing: 0.4, color: '#C2410C' }}>
                    SEVAK
                  </Text>
                ) : null}
                {message.pinned ? <Pill label="Pinned" colors={colors} /> : null}
              </View>
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
                {showSource && message.sourceLabel ? `${message.sourceLabel} · ${message.timestamp}` : message.timestamp}
              </Text>
            </View>
            <MoreHorizontal size={18} color={colors.textMuted} />
          </View>

          <Text
            style={{
              fontFamily: 'Inter-Regular',
              fontSize: 17,
              lineHeight: 26,
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
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: colors.textSecondary }}>
                {message.attachmentLabel}
              </Text>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
            {reactions.map((reaction, index) => (
              <ReactionPill
                key={`${reaction.emoji}-${index}`}
                emoji={reaction.emoji}
                count={reaction.count}
                colors={colors}
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
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: colors.textMuted }}>+ React</Text>
            </View>
            <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 13, color: colors.accent ?? '#E8862A' }}>
              {replies} {replies === 1 ? 'reply' : 'replies'}
            </Text>
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
}: {
  emoji: string
  count: number
  colors: ThreadPanelColors
}) {
  return (
    <View
      style={{
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.accentSoft ?? colors.border,
        backgroundColor: colors.accentSoft ?? colors.iconBoxBg,
        paddingHorizontal: 10,
        paddingVertical: 5,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <Text style={{ fontSize: 13 }}>{emoji}</Text>
      <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 13, color: colors.textSecondary }}>{count}</Text>
    </View>
  )
}

function Pill({ label, colors }: { label: string; colors: ThreadPanelColors }) {
  return (
    <View
      style={{
        borderRadius: 999,
        backgroundColor: colors.iconBoxBg,
        paddingHorizontal: 9,
        paddingVertical: 3,
      }}
    >
      <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 12, color: colors.textSecondary }}>{label}</Text>
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
      <Text style={{ fontFamily: 'Inter-Bold', fontSize: 21, color: colors.text, textAlign: 'center' }}>
        {title}
      </Text>
      <Text
        style={{
          marginTop: 16,
          maxWidth: 360,
          fontFamily: 'Inter-Regular',
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
          <Text style={{ fontFamily: 'Inter-Bold', fontSize: 15, color: '#FFFFFF' }}>{primaryActionLabel}</Text>
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
          <Text style={{ fontFamily: 'Inter-Bold', fontSize: 15, color: colors.textSecondary }}>{secondaryActionLabel}</Text>
        </Pressable>
      </View>
    </View>
  )
}

import React from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Camera, MessageSquare, Send } from 'lucide-react-native'
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
  scrollable = false,
  bottomInset = 0,
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
  scrollable?: boolean
  bottomInset?: number
}) {
  const content = messages.length > 0 ? (
    <View style={{ paddingTop: 8 }}>
      {messages.map((message, index) => (
        <ThreadMessageCard
          key={message.id}
          message={message}
          colors={colors}
          showConnector={index > 0 && index < messages.length - 1}
        />
      ))}
    </View>
  ) : (
    <EmptyThreadState
      colors={colors}
      title={emptyTitle}
      subtitle={emptySubtitle}
    />
  )

  return (
    <View style={{ flex: 1 }}>
      {scrollable ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 8 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}

      {composerState === 'locked' ? (
        <LockedComposer
          colors={colors}
          title={lockedTitle || 'Verify your email to post'}
          subtitle={lockedSubtitle || 'You can read along until then.'}
          primaryActionLabel={primaryActionLabel || 'Send verification email'}
          secondaryActionLabel={secondaryActionLabel || 'I already did'}
          bottomInset={bottomInset}
        />
      ) : (
        <OpenComposer colors={colors} placeholder={composerPlaceholder} bottomInset={bottomInset} />
      )}
    </View>
  )
}

function EmptyThreadState({
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
        gap: 14,
      }}
    >
      <View
        style={{
          width: 84,
          height: 84,
          borderRadius: 42,
          backgroundColor: colors.iconBoxBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MessageSquare size={34} color={colors.textMuted} />
      </View>
      <Text
        style={{
          fontFamily: 'Inter-SemiBold',
          fontSize: 18,
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

function ThreadMessageCard({
  message,
  colors,
  showConnector,
}: {
  message: BoardMessage
  colors: ThreadPanelColors
  showConnector: boolean
}) {
  return (
    <View
      style={{
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ alignItems: 'center' }}>
          <Avatar
            name={message.author.name}
            initials={message.author.initials}
            size={42}
            backgroundColor={message.author.accentColor}
          />
          {showConnector ? (
            <View
              style={{
                marginTop: 4,
                width: 2,
                flex: 1,
                minHeight: 72,
                backgroundColor: colors.border,
              }}
            />
          ) : null}
        </View>

        <View style={{ flex: 1, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 }}>
              <Text
                style={{
                  fontFamily: 'Inter-SemiBold',
                  fontSize: 15,
                  color: colors.text,
                }}
              >
                {message.author.name}
              </Text>
              {message.author.verification === 'sevak' ? (
                <Text
                  style={{
                    fontFamily: 'Inter-SemiBold',
                    fontSize: 13,
                    color: '#E8862A',
                  }}
                >
                  · Sevak
                </Text>
              ) : null}
            </View>
            <Text
              style={{
                fontFamily: 'Inter-Regular',
                fontSize: 13,
                color: colors.textMuted,
              }}
            >
              {message.timestamp}
            </Text>
          </View>

          <Text
            style={{
              fontFamily: 'Inter-Regular',
              fontSize: 17,
              lineHeight: 27,
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
                style={{
                  fontFamily: 'Inter-Medium',
                  fontSize: 12,
                  color: colors.textSecondary,
                }}
              >
                {message.attachmentLabel}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  )
}

function OpenComposer({
  colors,
  placeholder,
  bottomInset,
}: {
  colors: ThreadPanelColors
  placeholder: string
  bottomInset: number
}) {
  return (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: Math.max(bottomInset, 0) + 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: colors.panelBg,
      }}
    >
      <Pressable
        style={{
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: colors.iconBoxBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Camera size={18} color={colors.textSecondary} />
      </Pressable>

      <View
        style={{
          flex: 1,
          minHeight: 56,
          borderRadius: 28,
          backgroundColor: colors.iconBoxBg,
          paddingHorizontal: 18,
          justifyContent: 'center',
        }}
      >
        <TextInput
          editable={false}
          value=""
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          style={{
            fontFamily: 'Inter-Regular',
            fontSize: 14,
            color: colors.textSecondary,
          }}
        />
      </View>

      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: colors.accent ?? '#E8862A',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Send size={18} color="#FFFFFF" />
      </View>
    </View>
  )
}

function LockedComposer({
  colors,
  title,
  subtitle,
  primaryActionLabel,
  secondaryActionLabel,
  bottomInset,
}: {
  colors: ThreadPanelColors
  title: string
  subtitle: string
  primaryActionLabel: string
  secondaryActionLabel: string
  bottomInset: number
}) {
  const accent = colors.accent ?? '#E8862A'
  const accentSoft = colors.accentSoft ?? colors.iconBoxBg

  return (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: Math.max(bottomInset, 0) + 24,
        backgroundColor: colors.panelBg,
        gap: 12,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          backgroundColor: accentSoft,
          borderRadius: 18,
          paddingHorizontal: 14,
          paddingVertical: 14,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.cardBg ?? colors.panelBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: accent, fontSize: 16 }}>✉</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 15, color: colors.text }}>
            {title}
          </Text>
          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
            {subtitle}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable
          style={{
            flex: 1,
            borderRadius: 999,
            backgroundColor: accent,
            paddingVertical: 14,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 15, color: '#FFFFFF' }}>
            {primaryActionLabel}
          </Text>
        </Pressable>
        <Pressable style={{ paddingHorizontal: 6, paddingVertical: 6 }}>
          <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 15, color: colors.textSecondary }}>
            {secondaryActionLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

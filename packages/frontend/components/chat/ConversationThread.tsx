import React from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Camera, PaperPlaneTilt } from 'phosphor-react-native'
import { Avatar } from '../ui'
import type { AppColors } from '../../tokens'
import type { ChatMessage, Conversation } from './types'
import { GroupConversationAvatar } from './GroupAvatar'

function MessageBubble({
  message,
  previousSender,
  nextSender,
  colors,
  showAuthor,
}: {
  message: ChatMessage
  previousSender?: 'them' | 'you'
  nextSender?: 'them' | 'you'
  colors: AppColors
  showAuthor?: boolean
}) {
  const isYou = message.sender === 'you'
  const isFirstInRun = previousSender !== message.sender
  const isLastInRun = nextSender !== message.sender
  const incomingBubble = colors.card

  return (
    <View style={{ gap: 4, marginTop: isFirstInRun ? 8 : 0 }}>
      {isFirstInRun ? (
        <Text
          style={{
            alignSelf: isYou ? 'flex-end' : 'flex-start',
            paddingHorizontal: 8,
            fontFamily: 'Inclusive Sans',
            fontSize: 11,
            color: colors.textFaint,
          }}
        >
          {showAuthor && !isYou && message.authorName
            ? `${message.authorName} · ${message.timestamp}`
            : message.timestamp}
        </Text>
      ) : null}
      <View
        style={{
          alignSelf: isYou ? 'flex-end' : 'flex-start',
          maxWidth: '78%',
          paddingHorizontal: 14,
          paddingVertical: 10,
          backgroundColor: isYou ? colors.accentSoft : incomingBubble,
          borderWidth: 1,
          borderColor: isYou ? colors.borderStrong : colors.border,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderBottomLeftRadius: isYou || !isLastInRun ? 20 : 6,
          borderBottomRightRadius: isYou && isLastInRun ? 6 : 20,
        }}
      >
        <Text
          style={{
            fontFamily: 'Inclusive Sans',
            fontSize: 15,
            lineHeight: 21,
            color: colors.text,
          }}
        >
          {message.body}
        </Text>
      </View>
    </View>
  )
}

function ChatComposer({
  colors,
  bottomInset,
  placeholder,
  compact = false,
}: {
  colors: AppColors
  bottomInset: number
  placeholder: string
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
        <Pressable
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.bg,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Camera size={16} color={colors.textMuted} />
        </Pressable>
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
            placeholder={placeholder}
            placeholderTextColor={colors.textFaint}
            style={{ fontFamily: 'Inclusive Sans', fontSize: 15, color: colors.text }}
          />
        </View>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PaperPlaneTilt size={15} color="#FFFFFF" />
        </View>
      </View>
    </View>
  )
}

export function ConversationThread({
  conversation,
  colors,
  fullScreen = false,
  bottomInset = 0,
}: {
  conversation: Conversation
  colors: AppColors
  fullScreen?: boolean
  bottomInset?: number
}) {
  const messages = conversation.messages.map((message, index) => {
    const previous = conversation.messages[index - 1]
    const next = conversation.messages[index + 1]

    return (
      <MessageBubble
        key={message.id}
        message={message}
        previousSender={previous?.sender}
        nextSender={next?.sender}
        colors={colors}
        showAuthor={conversation.type === 'group'}
      />
    )
  })

  return (
    <View
      style={{
        flex: fullScreen ? 1 : undefined,
        backgroundColor: fullScreen ? colors.bg : 'transparent',
        borderWidth: 0,
        borderColor: 'transparent',
        borderRadius: fullScreen ? 0 : 22,
        overflow: fullScreen ? 'visible' : 'hidden',
      }}
    >
      {!fullScreen ? (
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {conversation.type === 'group' && conversation.groupMembers ? (
            <GroupConversationAvatar
              members={conversation.groupMembers}
              size={44}
              colors={colors}
            />
          ) : (
            <Avatar
              name={conversation.avatarName || conversation.title}
              initials={conversation.avatarInitials}
              size={44}
              backgroundColor={conversation.avatarColor}
            />
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, color: colors.text }}>{conversation.title}</Text>
            <Text style={{ fontSize: 13, color: colors.textMuted }}>{conversation.subtitle}</Text>
          </View>
        </View>
      ) : null}

      {fullScreen ? (
        <>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 12,
              paddingTop: 16,
              paddingBottom: 18,
              gap: 6,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {messages}
          </ScrollView>
          <ChatComposer
            colors={colors}
            bottomInset={bottomInset}
            placeholder={
              conversation.type === 'group'
                ? 'Message group'
                : `Message ${conversation.title.split(' ')[0]}`
            }
          />
        </>
      ) : (
        <>
          <View style={{ paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10, gap: 6 }}>
            {messages}
          </View>
          <ChatComposer
            colors={colors}
            bottomInset={0}
            placeholder={conversation.type === 'group' ? 'Message group' : 'Write a message...'}
            compact
          />
        </>
      )}
    </View>
  )
}

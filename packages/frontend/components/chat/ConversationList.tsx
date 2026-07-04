import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { Avatar } from '../ui'
import { EmptyPanel } from '../boards'
import type { AppColors } from '../../tokens'
import type { Conversation } from './types'
import { GroupConversationAvatar } from './GroupAvatar'

export function ConversationList({
  conversations,
  selectedConversationId,
  colors,
  onSelectConversation,
}: {
  conversations: Conversation[]
  selectedConversationId?: string
  colors: AppColors
  onSelectConversation: (id: string) => void
}) {
  return (
    <View style={{ gap: 2 }}>
      {conversations.length === 0 ? (
        <EmptyPanel title="No messages found" subtitle="Try a different search." colors={colors} />
      ) : null}
      {conversations.map((conversation) => (
        <Pressable
          key={conversation.id}
          onPress={() => onSelectConversation(conversation.id)}
          style={{
            paddingHorizontal: 4,
            paddingVertical: 12,
            borderRadius: 16,
            backgroundColor:
              conversation.id === selectedConversationId ? colors.cardActive : 'transparent',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
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
                size={42}
                backgroundColor={conversation.avatarColor}
              />
            )}
            <View style={{ flex: 1, gap: 3 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    minWidth: 0,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <Text style={{ fontSize: 15, color: colors.text }} numberOfLines={1}>
                    {conversation.title}
                  </Text>
                  {conversation.type === 'group' && conversation.groupMembers ? (
                    <Text
                      style={{
                        fontFamily: 'Inclusive Sans',
                        fontSize: 11,
                        color: colors.textFaint,
                      }}
                    >
                      - {conversation.groupMembers.length}
                    </Text>
                  ) : null}
                </View>
                <Text
                  style={{
                    fontSize: 12,
                    color: conversation.unread ? colors.accent : colors.textFaint,
                  }}
                >
                  {conversation.lastActiveLabel}
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: colors.textFaint }} numberOfLines={1}>
                {conversation.subtitle}
              </Text>
              <Text style={{ fontSize: 13, color: colors.textMuted }} numberOfLines={1}>
                {conversation.preview}
              </Text>
            </View>
            {conversation.unread ? (
              <View
                style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }}
              />
            ) : null}
          </View>
        </Pressable>
      ))}
    </View>
  )
}

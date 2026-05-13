import React from 'react'
import { View } from 'react-native'
import { EmptyPanel } from '../connect'
import type { AppColors } from '../../tokens'
import type { Conversation } from './types'
import { ConversationList } from './ConversationList'
import { ConversationThread } from './ConversationThread'
import { RequestsBanner } from './RequestsBanner'

export function MessagesWorkspace({
  conversations,
  selectedConversation,
  colors,
  isDesktop,
  nativeDetailOpen,
  mobileConversationOpen,
  onSelectConversation,
}: {
  conversations: Conversation[]
  selectedConversation?: Conversation
  colors: AppColors
  isDesktop: boolean
  nativeDetailOpen: boolean
  mobileConversationOpen: boolean
  onSelectConversation: (id: string) => void
}) {
  if (isDesktop) {
    return (
      <View style={{ flexDirection: 'row', gap: 18, alignItems: 'flex-start' }}>
        <View style={{ width: 360 }}>
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversation?.id}
            colors={colors}
            onSelectConversation={onSelectConversation}
          />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          {selectedConversation ? (
            <ConversationThread conversation={selectedConversation} colors={colors} />
          ) : (
            <EmptyPanel
              title="No messages found"
              subtitle="Try a different search."
              colors={colors}
            />
          )}
        </View>
      </View>
    )
  }

  if (mobileConversationOpen && !nativeDetailOpen && selectedConversation) {
    return <ConversationThread conversation={selectedConversation} colors={colors} />
  }

  return (
    <View style={{ gap: 14 }}>
      <RequestsBanner colors={colors} />
      <ConversationList
        conversations={conversations}
        selectedConversationId={selectedConversation?.id}
        colors={colors}
        onSelectConversation={onSelectConversation}
      />
    </View>
  )
}

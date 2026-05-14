import type { GroupKind, PersonSummary } from '../boards'

export type ChatMessage = {
  id: string
  sender: 'them' | 'you'
  timestamp: string
  body: string
  authorName?: string
}

export type Conversation = {
  id: string
  type: 'group' | 'dm'
  title: string
  subtitle: string
  preview: string
  lastActiveLabel: string
  unread: boolean
  groupKind?: GroupKind
  avatarName?: string
  avatarInitials?: string
  avatarColor?: string
  groupMembers?: PersonSummary[]
  messages: ChatMessage[]
}

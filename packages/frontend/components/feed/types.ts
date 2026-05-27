import type { BoardMessage, GroupKind } from '../boards'

export type GroupBoard = {
  id: string
  kind: GroupKind
  title: string
  eyebrow: string
  subtitle: string
  meta: string
  preview: string
  unreadCount: number
  messages: BoardMessage[]
  distanceMi?: number
  routeHref?: string
}

export type FeedPost = BoardMessage & {
  groupId: string
  groupKind: GroupKind
  sourceTitle: string
  sourceSubtitle: string
  sourceLabel: string
  replyMessages: BoardMessage[]
}

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
  parentId: string
  distanceMi?: number
  routeHref?: string
}

export type FeedPost = BoardMessage & {
  // Board-scoped compound key (`${groupId}-${postId}`) — unique for selection/routing.
  groupId: string
  groupKind: GroupKind
  // Real API ids used for reply/pin/edit/delete calls against the post's board.
  postId: string
  groupParentId: string
  sourceTitle: string
  sourceSubtitle: string
  sourceLabel: string
}

import type { User } from '../../src/auth/types'
import type { BoardMessage, PersonSummary, VerificationKind } from '../boards/__mocks__/mockData'
import type { FeedPost, GroupBoard } from './types'

const AVATAR_COLORS = ['#0F766E', '#1D4ED8', '#7C3AED', '#C2410C', '#0369A1', '#15803D']

function colorFor(seed: string) {
  const total = seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return AVATAR_COLORS[total % AVATAR_COLORS.length]
}

function verificationFor(user: User): VerificationKind | undefined {
  const level = user.verificationLevel ?? 0
  if (level >= 107) return 'admin'
  if (level >= 54) return 'sevak'
  if (user.isVerified) return 'member'
  return undefined
}

/**
 * Builds a PersonSummary for the signed-in user so optimistic replies render
 * with the same shape as server-mapped messages (see boardPostToMessage).
 */
export function authorFromUser(user: User | null): PersonSummary {
  if (!user) {
    return { id: 'me', name: 'You', initials: 'You' }
  }
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.username
  const initials = user.firstName
    ? `${user.firstName[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : user.username.slice(0, 2).toUpperCase()
  return {
    id: user.id || 'me',
    name,
    initials,
    verification: verificationFor(user),
    accentColor: colorFor(user.id || user.username),
  }
}

/**
 * Pending reply rendered immediately while the create request is in flight.
 * Replaced by the server-mapped message on success, removed on failure.
 */
export function optimisticReply(user: User | null, body: string, id: string): BoardMessage {
  return {
    id,
    author: authorFromUser(user),
    timestamp: 'Sending…',
    body,
    replyCount: 0,
  }
}

/**
 * Flattens real board messages into the feed list shape. Each post keeps its
 * real API id (`postId`) for reply/pin/edit/delete calls, while `id` stays a
 * board-scoped compound key so selection/routing is unique across boards.
 * Replies are fetched lazily in the detail thread, not synthesized here.
 */
export function buildFeedPosts(groups: GroupBoard[]): FeedPost[] {
  const posts = groups.flatMap((group) =>
    group.messages.map(
      (message): FeedPost => ({
        ...message,
        id: `${group.id}-${message.id}`,
        postId: message.id,
        sourceLabel: group.title,
        sourceKind: group.kind,
        sourceTitle: group.title,
        sourceSubtitle: group.subtitle,
        groupId: group.id,
        groupKind: group.kind,
        groupParentId: group.parentId,
      })
    )
  )

  return posts.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return a.id < b.id ? 1 : -1
  })
}

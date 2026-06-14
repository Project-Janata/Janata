import type { User } from '../../src/auth/types'
import type { BoardMessage, PersonSummary, VerificationKind } from '../boards/__mocks__/mockData'
import type { GroupKind } from '../boards'
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
    username: user.username,
  }
}

/** Pin/unpin is a sevak+ moderation action (tier ≥ 54). */
export function canPinPosts(user: User | null): boolean {
  return (user?.verificationLevel ?? 0) >= 54
}

/** Edit/delete are author-only in the member app (admin moderation lives in the admin app, #209). */
export function canModifyPost(user: User | null, authorId: string): boolean {
  return !!user?.id && user.id === authorId
}

/**
 * Optimistically bump the tapped emoji's count (adds a chip if absent). The
 * server's authoritative reaction list replaces this on response; reverted on
 * failure. Does not mutate the input.
 */
export function applyOptimisticReaction(
  reactions: Array<{ emoji: string; count: number }> | undefined,
  emoji: string
): Array<{ emoji: string; count: number }> {
  const list = (reactions ?? []).map((r) => ({ ...r }))
  const existing = list.find((r) => r.emoji === emoji)
  if (existing) existing.count += 1
  else list.push({ emoji, count: 1 })
  return list
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

export interface FeedPostContext {
  groupId: string
  kind: GroupKind
  parentId: string
  title: string
  subtitle: string
}

/**
 * Builds a single feed/detail post from a board message + its board context.
 * Keeps the real API id (`postId`) for reply/pin/edit/delete calls, while `id`
 * stays a board-scoped compound key unique across boards. Used by the Connect
 * Feed and by per-board surfaces (event/center boards) so they share the same
 * PostThread detail experience.
 */
export function buildFeedPostFromMessage(message: BoardMessage, ctx: FeedPostContext): FeedPost {
  return {
    ...message,
    id: `${ctx.groupId}-${message.id}`,
    postId: message.id,
    sourceLabel: ctx.title,
    sourceKind: ctx.kind,
    sourceTitle: ctx.title,
    sourceSubtitle: ctx.subtitle,
    groupId: ctx.groupId,
    groupKind: ctx.kind,
    groupParentId: ctx.parentId,
  }
}

/**
 * Flattens real board messages into the feed list shape (pinned first).
 * Replies are fetched lazily in the detail thread, not synthesized here.
 */
export function buildFeedPosts(groups: GroupBoard[]): FeedPost[] {
  const posts = groups.flatMap((group) =>
    group.messages.map((message) =>
      buildFeedPostFromMessage(message, {
        groupId: group.id,
        kind: group.kind,
        parentId: group.parentId,
        title: group.title,
        subtitle: group.subtitle,
      })
    )
  )

  return posts.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return a.id < b.id ? 1 : -1
  })
}

import { describe, it, expect } from 'vitest'
import {
  buildFeedPosts,
  authorFromUser,
  optimisticReply,
} from '../../components/feed/feedData'
import type { GroupBoard } from '../../components/feed/types'
import type { BoardMessage } from '../../components/boards/__mocks__/mockData'

function message(id: string, overrides: Partial<BoardMessage> = {}): BoardMessage {
  return {
    id,
    author: { id: `u-${id}`, name: `User ${id}`, initials: 'U' },
    timestamp: '10:00 AM',
    body: `body ${id}`,
    replyCount: 0,
    ...overrides,
  }
}

function group(id: string, parentId: string, messages: BoardMessage[]): GroupBoard {
  return {
    id,
    kind: 'center',
    title: `Group ${id}`,
    eyebrow: '',
    subtitle: 'sub',
    meta: '',
    preview: '',
    unreadCount: 0,
    messages,
    parentId,
  }
}

describe('buildFeedPosts', () => {
  it('preserves the real API post id as postId and the board parentId', () => {
    const groups = [group('center-abc', 'abc', [message('post-1')])]
    const [post] = buildFeedPosts(groups)
    expect(post.postId).toBe('post-1')
    expect(post.groupParentId).toBe('abc')
    expect(post.groupKind).toBe('center')
    // Compound id stays unique across boards for selection/routing.
    expect(post.id).toBe('center-abc-post-1')
  })

  it('does not fabricate replies from sibling posts', () => {
    const groups = [
      group('center-abc', 'abc', [
        message('post-1', { replyCount: 3 }),
        message('post-2'),
        message('post-3'),
      ]),
    ]
    const first = buildFeedPosts(groups).find((p) => p.postId === 'post-1')!
    // replyCount is metadata from the API; the real replies are fetched lazily.
    expect(first.replyCount).toBe(3)
    expect((first as any).replyMessages).toBeUndefined()
  })

  it('sorts pinned posts ahead of unpinned', () => {
    const groups = [
      group('center-abc', 'abc', [
        message('post-1'),
        message('post-2', { pinned: true }),
      ]),
    ]
    const ordered = buildFeedPosts(groups)
    expect(ordered[0].postId).toBe('post-2')
  })
})

describe('authorFromUser', () => {
  it('uses full name and initials when available', () => {
    const author = authorFromUser({
      username: 'rkrishna',
      firstName: 'Ravi',
      lastName: 'Krishna',
    } as any)
    expect(author.name).toBe('Ravi Krishna')
    expect(author.initials).toBe('RK')
  })

  it('falls back to username when no name is set', () => {
    const author = authorFromUser({ username: 'rkrishna' } as any)
    expect(author.name).toBe('rkrishna')
    expect(author.initials).toBe('RK')
  })

  it('maps verification level to a badge tier', () => {
    expect(authorFromUser({ username: 'a', verificationLevel: 120 } as any).verification).toBe('admin')
    expect(authorFromUser({ username: 'a', verificationLevel: 54 } as any).verification).toBe('sevak')
    expect(authorFromUser({ username: 'a', isVerified: true } as any).verification).toBe('member')
    expect(authorFromUser({ username: 'a' } as any).verification).toBeUndefined()
  })

  it('returns a safe placeholder when there is no user', () => {
    const author = authorFromUser(null)
    expect(author.name).toBe('You')
    expect(author.id).toBe('me')
  })
})

describe('optimisticReply', () => {
  it('builds a pending reply message carrying the typed body', () => {
    const reply = optimisticReply({ username: 'rkrishna', firstName: 'Ravi' } as any, 'Hello there', 'temp-1')
    expect(reply.id).toBe('temp-1')
    expect(reply.body).toBe('Hello there')
    expect(reply.author.name).toBe('Ravi')
    expect(reply.replyCount).toBe(0)
  })
})

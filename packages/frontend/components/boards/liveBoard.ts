import type { BoardPostData, UserData } from '../../utils/api'
import type { BoardMessage, VerificationKind } from './__mocks__/mockData'

const AVATAR_COLORS = ['#0F766E', '#1D4ED8', '#7C3AED', '#C2410C', '#0369A1', '#15803D']

function displayName(user: UserData) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
  return fullName || user.username
}

function initialsFor(user: UserData) {
  if (user.firstName) {
    return `${user.firstName[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
  }
  return user.username.slice(0, 2).toUpperCase()
}

function verificationFor(user: UserData): VerificationKind | undefined {
  if (user.verificationLevel >= 107) return 'admin'
  if (user.verificationLevel >= 54) return 'sevak'
  if (user.isVerified) return 'member'
  return undefined
}

function colorFor(seed: string) {
  const total = seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return AVATAR_COLORS[total % AVATAR_COLORS.length]
}

function formatTimestamp(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function boardPostToMessage(post: BoardPostData): BoardMessage {
  const name = displayName(post.author)
  return {
    id: post.id,
    author: {
      id: post.author.id,
      name,
      initials: initialsFor(post.author),
      subtitle: post.author.centerID ? 'Verified member' : undefined,
      verification: verificationFor(post.author),
      accentColor: colorFor(post.author.id || post.author.username),
    },
    timestamp: formatTimestamp(post.createdAt),
    body: post.body,
    attachmentLabel: post.imageUrl ? 'Image attachment' : undefined,
    reactions: post.reactions,
    replyCount: post.replyCount,
  }
}

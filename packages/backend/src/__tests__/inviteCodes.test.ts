/**
 * inviteCodes.test.ts
 *
 * Om Sri Chinmaya Sadgurave Namaha. Om Sri Gurubyo Namaha.
 *
 * Unit tests for invite code functions and API endpoints
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as inviteCodes from '../inviteCodes'
import type { Env } from '../types'

// Mock D1Database
class MockD1Database {
  private data: Map<string, any> = new Map()
  private statements: any[] = []

  prepare(sql: string) {
    const stmt = {
      sql,
      bindings: [],
      bind: (...args: any[]) => {
        stmt.bindings = args
        return stmt
      },
      first: async (type?: any) => {
        const key = stmt.bindings[0]
        const data = this.data.get(key)
        
        // For validateInviteCode (has WHERE ... AND is_active = 1), only return if is_active = 1
        if (stmt.sql.includes('is_active = 1')) {
          if (!data || data.is_active !== 1) {
            return null
          }
        }
        // For getInviteCode (no WHERE is_active filter), return regardless of active status
        return data || null
      },
      all: async (type?: any) => {
        const results = Array.from(this.data.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        return { results }
      },
      run: async () => {
        const code = stmt.bindings[0]?.toUpperCase?.()
        if (stmt.sql.includes('INSERT')) {
          this.data.set(code, {
            code,
            label: stmt.bindings[1],
            verification_level: stmt.bindings[2],
            is_active: stmt.bindings[3],
            created_at: stmt.bindings[4],
          })
        } else if (stmt.sql.includes('UPDATE')) {
          const existing = this.data.get(code)
          if (existing) {
            this.data.set(code, { ...existing, is_active: stmt.bindings[1] })
            return { success: true }
          }
        }
        return { success: this.data.has(code) }
      },
    }
    return stmt
  }

  setData(key: string, data: any) {
    this.data.set(key, data)
  }
}

const createMockEnv = (): Env => {
  return {
    DB: new MockD1Database() as any,
    JWT_SECRET: 'test-secret',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
  } as any
}

describe('Invite Codes Module', () => {
  let env: Env

  beforeEach(() => {
    env = createMockEnv()
  })

  describe('validateInviteCode', () => {
    it('returns null for empty code', async () => {
      const result = await inviteCodes.validateInviteCode(env, '')
      expect(result).toBeNull()
    })

    it('returns null for undefined code', async () => {
      const result = await inviteCodes.validateInviteCode(env, undefined as any)
      expect(result).toBeNull()
    })

    it('returns null for inactive code', async () => {
      const mockEnv = createMockEnv()
      const db = mockEnv.DB as any
      db.setData('BETA001', {
        code: 'BETA001',
        label: 'Beta Access',
        verification_level: 45,
        is_active: 0,
        created_at: '2026-04-07T00:00:00Z',
      })
      const result = await inviteCodes.validateInviteCode(mockEnv, 'beta001')
      expect(result).toBeNull()
    })

    it('returns code data for valid active code', async () => {
      const mockEnv = createMockEnv()
      const db = mockEnv.DB as any
      db.setData('BETA001', {
        code: 'BETA001',
        label: 'Beta Access',
        verification_level: 45,
        is_active: 1,
        created_at: '2026-04-07T00:00:00Z',
      })
      const result = await inviteCodes.validateInviteCode(mockEnv, 'beta001')
      expect(result).not.toBeNull()
      expect(result?.code).toBe('BETA001')
      expect(result?.is_active).toBe(1)
    })

    it('converts lowercase input to uppercase', async () => {
      const mockEnv = createMockEnv()
      const db = mockEnv.DB as any
      db.setData('BETA001', {
        code: 'BETA001',
        label: 'Beta Access',
        verification_level: 45,
        is_active: 1,
        created_at: '2026-04-07T00:00:00Z',
      })
      const result = await inviteCodes.validateInviteCode(mockEnv, 'BeTa001')
      expect(result?.code).toBe('BETA001')
    })
  })

  describe('getInviteCode', () => {
    it('returns code regardless of active status', async () => {
      const mockEnv = createMockEnv()
      const db = mockEnv.DB as any
      db.setData('BETA001', {
        code: 'BETA001',
        label: 'Beta Access',
        verification_level: 45,
        is_active: 0,
        created_at: '2026-04-07T00:00:00Z',
      })
      const result = await inviteCodes.getInviteCode(mockEnv, 'beta001')
      expect(result).not.toBeNull()
      expect(result?.is_active).toBe(0)
    })

    it('returns null for non-existent code', async () => {
      const result = await inviteCodes.getInviteCode(env, 'nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('createInviteCode', () => {
    it('creates a new invite code successfully', async () => {
      const result = await inviteCodes.createInviteCode(env, 'NEWCODE', 'Test Code', 45, true)
      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('returns error for empty code', async () => {
      const result = await inviteCodes.createInviteCode(env, '', 'Test Code', 45)
      expect(result.success).toBe(false)
      expect(result.error).toContain('Code is required')
    })

    it('returns error for empty label', async () => {
      const result = await inviteCodes.createInviteCode(env, 'CODE', '', 45)
      expect(result.success).toBe(false)
      expect(result.error).toContain('Label is required')
    })

    it('returns error for invalid verification level', async () => {
      const result = await inviteCodes.createInviteCode(env, 'CODE', 'Label', -1)
      expect(result.success).toBe(false)
      expect(result.error).toContain('Valid verification_level is required')
    })

    it('converts code to uppercase', async () => {
      const mockEnv = createMockEnv()
      const result = await inviteCodes.createInviteCode(mockEnv, 'lowercase', 'Test', 45)
      expect(result.success).toBe(true)
      // Verify by trying to retrieve the uppercase version
      const retrieved = await inviteCodes.getInviteCode(mockEnv, 'LOWERCASE')
      expect(retrieved).not.toBeNull()
    })

    it('defaults isActive to true', async () => {
      const mockEnv = createMockEnv()
      await inviteCodes.createInviteCode(mockEnv, 'CODE', 'Label', 45)
      const result = await inviteCodes.getInviteCode(mockEnv, 'CODE')
      expect(result?.is_active).toBe(1)
    })

    it('respects isActive parameter', async () => {
      const mockEnv = createMockEnv()
      await inviteCodes.createInviteCode(mockEnv, 'CODE', 'Label', 45, false)
      const result = await inviteCodes.getInviteCode(mockEnv, 'CODE')
      expect(result?.is_active).toBe(0)
    })
  })

  describe('deactivateInviteCode', () => {
    it('deactivates an existing code', async () => {
      const mockEnv = createMockEnv()
      const db = mockEnv.DB as any
      db.setData('CODE', {
        code: 'CODE',
        label: 'Test',
        verification_level: 45,
        is_active: 1,
        created_at: '2026-04-07T00:00:00Z',
      })
      const result = await inviteCodes.deactivateInviteCode(mockEnv, 'code')
      expect(result.success).toBe(true)
    })

    it('returns error for non-existent code', async () => {
      const result = await inviteCodes.deactivateInviteCode(env, 'nonexistent')
      expect(result.success).toBe(false)
    })
  })

  describe('reactivateInviteCode', () => {
    it('reactivates a deactivated code', async () => {
      const mockEnv = createMockEnv()
      const db = mockEnv.DB as any
      db.setData('CODE', {
        code: 'CODE',
        label: 'Test',
        verification_level: 45,
        is_active: 0,
        created_at: '2026-04-07T00:00:00Z',
      })
      const result = await inviteCodes.reactivateInviteCode(mockEnv, 'code')
      expect(result.success).toBe(true)
    })

    it('returns error for non-existent code', async () => {
      const result = await inviteCodes.reactivateInviteCode(env, 'nonexistent')
      expect(result.success).toBe(false)
    })
  })

  describe('getAllInviteCodes', () => {
    it('returns empty array when no codes exist', async () => {
      const result = await inviteCodes.getAllInviteCodes(env)
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(0)
    })

    it('returns all codes sorted by created_at descending', async () => {
      const mockEnv = createMockEnv()
      const db = mockEnv.DB as any
      db.setData('OLDER', {
        code: 'OLDER',
        label: 'Old',
        verification_level: 45,
        is_active: 1,
        created_at: '2026-01-01T00:00:00Z',
      })
      db.setData('NEWER', {
        code: 'NEWER',
        label: 'New',
        verification_level: 45,
        is_active: 1,
        created_at: '2026-04-07T00:00:00Z',
      })
      const result = await inviteCodes.getAllInviteCodes(mockEnv)
      expect(result.length).toBeGreaterThan(0)
      // Newer code should come first
      if (result.length >= 2) {
        const newerIndex = result.findIndex((c) => c.code === 'NEWER')
        const olderIndex = result.findIndex((c) => c.code === 'OLDER')
        expect(newerIndex).toBeLessThan(olderIndex)
      }
    })
  })

  describe('countUsersWithCode', () => {
    it('returns 0 when no users with code', async () => {
      const result = await inviteCodes.countUsersWithCode(env, 'CODE')
      expect(result).toBe(0)
    })
  })

  describe('getUsersWithCode', () => {
    it('returns empty array when no users with code', async () => {
      const result = await inviteCodes.getUsersWithCode(env, 'CODE')
      expect(result).toEqual([])
    })
  })

  describe('inviteCodeRowToApi', () => {
    it('converts database row to API format', () => {
      const row = {
        code: 'BETA001',
        label: 'Beta Access',
        verification_level: 45,
        is_active: 1,
        created_at: '2026-04-07T00:00:00Z',
      }
      const api = inviteCodes.inviteCodeRowToApi(row)
      expect(api.code).toBe('BETA001')
      expect(api.label).toBe('Beta Access')
      expect(api.verificationLevel).toBe(45)
      expect(api.isActive).toBe(true)
      expect(api.createdAt).toBe('2026-04-07T00:00:00Z')
    })

    it('converts is_active 0 to false', () => {
      const row = {
        code: 'CODE',
        label: 'Test',
        verification_level: 45,
        is_active: 0,
        created_at: '2026-04-07T00:00:00Z',
      }
      const api = inviteCodes.inviteCodeRowToApi(row)
      expect(api.isActive).toBe(false)
    })
  })

  describe('clampMaxUses / clampTtlDays (#272)', () => {
    it('clamps maxUses into [1, 100]', () => {
      expect(inviteCodes.clampMaxUses(0)).toBe(1)
      expect(inviteCodes.clampMaxUses(-5)).toBe(1)
      expect(inviteCodes.clampMaxUses(25)).toBe(25)
      expect(inviteCodes.clampMaxUses(100)).toBe(100)
      expect(inviteCodes.clampMaxUses(9999)).toBe(100)
      expect(inviteCodes.clampMaxUses(2.9)).toBe(2) // floored
    })

    it('clamps ttl days into [1, 30]', () => {
      expect(inviteCodes.clampTtlDays(0)).toBe(1)
      expect(inviteCodes.clampTtlDays(7)).toBe(7)
      expect(inviteCodes.clampTtlDays(30)).toBe(30)
      expect(inviteCodes.clampTtlDays(9999)).toBe(30)
    })
  })

  describe('classifyInviteCode (#272)', () => {
    const baseRow = (over: Record<string, any>) => ({
      code: 'MULTI001',
      label: 'multi',
      verification_level: 45,
      is_active: 1,
      created_at: '2026-04-07T00:00:00Z',
      created_by_user_id: 'u1',
      expires_at: null,
      max_uses: 25,
      uses_count: 0,
      ...over,
    })
    const now = new Date('2026-05-28T00:00:00Z')

    it('returns not_found for a missing code', async () => {
      expect(await inviteCodes.classifyInviteCode(env, 'NOPE', now)).toBe('not_found')
    })

    it('returns inactive for a deactivated code', async () => {
      ;(env.DB as any).setData('MULTI001', baseRow({ is_active: 0 }))
      expect(await inviteCodes.classifyInviteCode(env, 'multi001', now)).toBe('inactive')
    })

    it('returns expired when past expires_at', async () => {
      ;(env.DB as any).setData('MULTI001', baseRow({ expires_at: '2026-05-01T00:00:00Z' }))
      expect(await inviteCodes.classifyInviteCode(env, 'MULTI001', now)).toBe('expired')
    })

    it('returns exhausted when uses_count >= max_uses', async () => {
      ;(env.DB as any).setData('MULTI001', baseRow({ max_uses: 3, uses_count: 3 }))
      expect(await inviteCodes.classifyInviteCode(env, 'MULTI001', now)).toBe('exhausted')
    })

    it('returns ok for an active, in-window, non-exhausted code', async () => {
      ;(env.DB as any).setData(
        'MULTI001',
        baseRow({ expires_at: '2026-06-30T00:00:00Z', max_uses: 25, uses_count: 4 }),
      )
      expect(await inviteCodes.classifyInviteCode(env, 'MULTI001', now)).toBe('ok')
    })
  })
})

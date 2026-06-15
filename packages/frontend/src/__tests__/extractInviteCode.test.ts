import { describe, it, expect } from 'vitest'
import { extractInviteCode } from '../../utils/validation'

/**
 * extractInviteCode is the parsing backbone of the whole invite flow — Door 1
 * (/i/[code]), the /join paste screen, the dead-code recovery, and the auth
 * applied-bar all run pasted input through it. A regression here silently
 * breaks invite acceptance, so pin the contract.
 */
describe('extractInviteCode', () => {
  it('returns a bare code unchanged', () => {
    expect(extractInviteCode('ABC123DEF456')).toBe('ABC123DEF456')
  })

  it('trims surrounding whitespace', () => {
    expect(extractInviteCode('  ABC123  ')).toBe('ABC123')
  })

  it('pulls the code out of a canonical /i/ link', () => {
    expect(extractInviteCode('https://chinmayajanata.org/i/ABC123')).toBe('ABC123')
  })

  it('pulls the code out of a legacy /invite/ link', () => {
    expect(extractInviteCode('https://chinmayajanata.org/invite/XYZ789')).toBe('XYZ789')
  })

  it('pulls the code out of a legacy /join?code= link', () => {
    expect(extractInviteCode('https://chinmayajanata.org/join?code=DEF456')).toBe('DEF456')
  })

  it('ignores trailing path/query after the code', () => {
    expect(extractInviteCode('chinmayajanata.org/i/ABC123?utm=x')).toBe('ABC123')
    expect(extractInviteCode('chinmayajanata.org/i/ABC123/')).toBe('ABC123')
  })

  it('stops the join code at the next query param', () => {
    expect(extractInviteCode('chinmayajanata.org/join?code=DEF456&ref=y')).toBe('DEF456')
  })

  it('url-decodes a join code', () => {
    expect(extractInviteCode('chinmayajanata.org/join?code=AB%2DC')).toBe('AB-C')
  })

  it('is case-insensitive on the host/path, keeping the code as typed', () => {
    expect(extractInviteCode('HTTPS://ChinmayaJanata.org/I/AbC123')).toBe('AbC123')
  })

  it('returns empty string for empty or nullish input', () => {
    expect(extractInviteCode('')).toBe('')
    expect(extractInviteCode(undefined as unknown as string)).toBe('')
    expect(extractInviteCode('   ')).toBe('')
  })
})

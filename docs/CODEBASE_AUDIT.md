# Project-Janatha Codebase Audit Report

**Date:** May 4, 2026
**Auditor:** Claude Code
**Version:** 1.0.0

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Security Issues](#security-issues)
3. [Code Quality Issues](#code-quality-issues)
4. [Architecture Issues](#architecture-issues)
5. [Configuration Issues](#configuration-issues)
6. [Expo SDK Compatibility Analysis](#expo-sdk-compatibility-analysis)
7. [Priority Recommendations](#priority-recommendations)

---

## Executive Summary

This audit analyzed the entire Project-Janatha codebase including:
- **Frontend:** React Native/Expo app (packages/frontend)
- **Backend:** Hono + Cloudflare Workers API (packages/backend)
- **Infrastructure:** EAS build config, wrangler configs, migrations

### Issue Count by Severity

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Security | 2 | 5 | 12 | 14 |
| Code Quality | 0 | 4 | 18 | 22 |
| Architecture | 1 | 2 | 5 | 4 |
| Configuration | 2 | 6 | 8 | 5 |
| **TOTAL** | **5** | **17** | **43** | **45** |

### Quick Stats

| Metric | Value |
|--------|-------|
| Total TypeScript any abuses | 135+ |
| Lines in largest file (app.ts) | 1,679 |
| Lines in useApiData hook | 820 |
| Lines in index.tsx | 685 |
| Migration files | 15+ |
| Bundle ID variations | 3 |

---

## Security Issues

### CRITICAL

#### 1. Hardcoded Admin Email for Authorization Bypass

**Frontend - Multiple Files:**
- `packages/frontend/utils/admin.ts:3, 8-14`
- `packages/frontend/app/events/[id].tsx:24`
- `packages/frontend/app/(tabs)/index.web.tsx:329, 968`

```typescript
export const ADMIN_EMAIL = 'chinmayajanata@gmail.com'

export function isSuperAdmin(user: ...): boolean {
  return (
    user.email === ADMIN_EMAIL ||
    (user.verificationLevel !== undefined && user.verificationLevel >= 107) ||
    isLocal  // bypass if hostname is localhost
  )
}
```

**Impact:** Anyone with knowledge of this email can target the account. The isLocal bypass allows anyone running a local server to get superadmin access.

---

#### 2. Web Token Storage - XSS Vulnerability

**File:** `packages/frontend/components/utils/tokenStorage.web.ts:42-57, 100-111`

```typescript
export const setStoredToken = async (token: string): Promise<void> => {
  // Try localStorage first - VULNERABLE TO XSS
  localStorage.setItem(TOKEN_KEY, token)
  // Also set cookie as backup for ITP
  setCookie(TOKEN_KEY, token, 7)  // No HttpOnly, Secure, SameSite flags
}
```

**Issues:**
- Tokens in localStorage are accessible to JavaScript (XSS risk)
- Cookies lack HttpOnly, Secure, and SameSite attributes
- Refresh tokens valid for 90 days on web

**Impact:** If any XSS vulnerability exists, attacker can steal tokens.

---

#### 3. Hardcoded JWT Secrets in wrangler.toml

**File:** `packages/backend/wrangler.toml:28-29`

```toml
[vars]
JWT_SECRET = "dev-secret-key-change-in-production"
JWT_REFRESH_SECRET = "dev-refresh-secret-key-change-in-production"
```

**Issue:** vars in wrangler.toml are NOT secret - they are publicly visible in the compiled Worker. These should be set via wrangler secret put instead.

**Same issue in:** `wrangler.staging.toml:18-19`

---

### HIGH

#### 4. Error Boundary Exposes Debug Information

**File:** `packages/frontend/components/ui/ErrorBoundary.tsx:33, 49-62, 183-243`

```typescript
// Line 33: Logs error with full stack to console
console.error('ErrorBoundary caught:', error, info.componentStack)

// Lines 183-184 comment admits this is intentional for beta:
/* Beta-phase debug panel: shown to every user so a screenshot is
   enough to triage. Remove or gate behind a flag at public launch. */
```

**Issues:**
- Full error messages, URLs, user agent strings, and stack traces exposed via window.__lastErrorInfo
- Debug panel shown to ALL users, not just developers
- User can copy full error report to clipboard

**Impact:** Attackers can gather internal system information from error messages.

---

#### 5. DEV_BYPASS_ADMIN_AUTH Escape Hatch

**File:** `packages/backend/src/types.ts:17-22`

```typescript
DEV_BYPASS_ADMIN_AUTH?: string
```

**Issue:** If DEV_BYPASS_ADMIN_AUTH=true is set in production, admin authentication is completely bypassed.

---

#### 6. Mass Assignment Vulnerability

**File:** `packages/backend/src/app.ts:388-425`

```typescript
if (body.firstName !== undefined) updates.first_name = body.firstName
if (body.lastName !== undefined) updates.last_name = body.lastName
if (body.email !== undefined) updates.email = body.email
// ... users can modify ANY field in UserRow
```

**Impact:** Users can modify fields they should not (e.g., verificationLevel, points, isVerified).

---

#### 7. Admin User Update - No Validation

**File:** `packages/backend/src/app.ts:615-651`

```typescript
const { username, userJSON } = await c.req.json<{
  username: string
  userJSON: any  // No validation!
}>()
```

**Impact:** userJSON can contain any fields including sensitive ones.

---

#### 8. No Refresh Token Rotation

**File:** `packages/backend/src/auth.ts:125-136`

**Issue:** No token rotation or refresh token reuse detection. If a refresh token is stolen, attacker can get new access tokens indefinitely.

---

#### 9. User Enumeration via Check User Exists

**File:** `packages/frontend/app/auth.tsx:49-73`

```typescript
const exists = await checkUserExists(username)
if (exists) {
  setAuthStep('login')   // Username is valid
} else {
  setAuthStep('invite-code')  // Username does not exist
}
```

**Impact:** Attacker can enumerate valid usernames by observing auth flow response.

---

### MEDIUM

| ID | Issue | Location |
|----|-------|----------|
| M1 | Sensitive data in URL query params (returnTo) | `app/auth.tsx:147` |
| M2 | Missing input sanitization in admin search | `utils/api.ts:477-481` |
| M3 | credentials: 'include' on fetch calls | `src/auth/authClient.ts:29, 274` |
| M4 | Basic email validation regex | `utils/validation.ts:2` |
| M5 | US-centric phone validation (10 digits only) | `utils/validation.ts:40` |
| M6 | Error messages expose internal details | `src/app.ts:60-66, 261` |
| M7 | Missing security headers (CSP, HSTS) | `src/middleware.ts:175-180` |
| M8 | Wildcard subdomain CORS | `src/app.ts:85-86` |
| M9 | File extension not validated on upload | `src/app.ts:1039-1040` |
| M10 | No rate limiting on public endpoints | `src/app.ts:139, 562, 570, 860` |
| M11 | Username accepted as any string (becomes email) | `src/app.ts:178-263` |

---

## Code Quality Issues

### TypeScript Issues

#### Excessive any Type Usage (135+ occurrences)

| File | Count | Notable Uses |
|------|-------|--------------|
| `app/events/[id].tsx` | 12+ | `id as string`, `catch (err: any)` |
| `app/(tabs)/index.tsx` | 8+ | `key={i}` (index as key anti-pattern) |
| `hooks/useApiData.ts` | 20+ | All catch blocks use `err: any` |
| `src/app.ts` | 15+ | `adminMiddleware(c: any)`, `userJSON: any` |
| `src/db.ts` | 12+ | All 12 catch blocks use `err: any` |

---

### React Native Bad Practices

#### Missing Key Props (Index as Key)

```typescript
// app/(tabs)/index.tsx:74
{attendees.slice(0, shown).map((attendee, i) => (
  <View key={i}>  // BAD: using index
))}

// app/events/[id].tsx:118
attendees.map((a, i) => (
  <Avatar key={i}>  // BAD: using index
))
```

**Impact:** When list items are reordered or removed, React uses keys to track identity. Using index causes incorrect animations/re-renders.

---

#### Missing useEffect Dependencies

| File | Line | Issue |
|------|------|-------|
| `app/_layout.tsx` | 144 | Effect depends on fadeAnim but does not include it in deps |
| `app/(tabs)/_layout.tsx` | 30 | router.replace('/auth') missing router in deps |
| `app/onboarding.tsx` | 12-18 | Effect depends on animatedWidth but misses in deps |

---

#### Bare try-catch Without Handling (13+ occurrences)

```typescript
// app/settings/profile.tsx:153-155
} catch (e) {
  // Silently fail - no error display, no logging
}

// app/center/[id].tsx:194-196
} catch {
  // Share cancelled or failed - silently swallowed
}
```

---

#### Inline Component Definitions (10+ occurrences)

```typescript
// app/(tabs)/_layout.tsx:51-175
// HeaderRight and HeaderTitle defined inside component
const HeaderRight = () => { ... }  // Recreated every render

// app/settings/preferences.tsx:64-87
const MenuRow = (...) => { ... }  // Recreated every render
```

**Impact:** Causes child components to re-render even when props have not changed.

---

### Backend Issues

#### Route Handler Bloat

**File:** `packages/backend/src/app.ts` - **1,679 lines**

All routes in single file: auth, centers, users, events, notifications, admin. Should be split into separate route files.

---

#### N+1 Query Problems

**Problem 1: Endorser lookup in addEvent (lines 811-820)**
```typescript
if (data.endorsers && data.endorsers.length > 0) {
  for (const endorserUsername of data.endorsers) {
    const endorserUser = await db.getUserByUsername(c.env.DB, endorserUsername)
    // Sequential queries - N+1 problem
  }
}
```

**Problem 2: Invite code usage counts (lines 1322-1327)**
```typescript
const codesWithUsage = await Promise.all(
  codes.map(async (code) => ({
    usageCount: await inviteCodes.countUsersWithCode(c.env, code.code),
  }))
)
```

---

#### REST Violations

| Route | Issue |
|-------|-------|
| `POST /fetchAllCenters` | Should be GET - fetching without mutation |
| `POST /fetchCenter` | Should be GET /centers/:id |
| `POST /fetchEventsByCenter` | Should be GET /centers/:id/events |
| `POST /fetchEvent` | Should be GET /events/:id |

---

## Architecture Issues

### CRITICAL: Map Component Platform Delegation Bug

**File:** `packages/frontend/components/Map.tsx:1`

```typescript
export { default, type MapProps, type MapPoint } from './Map.web'
```

**Problem:** This unconditionally delegates to Map.web even on native platforms. On native iOS/Android, it should delegate to Map.native.tsx.

**Impact:** On iOS/Android, the Map component uses the web version instead of the proper native Maps implementation.

---

### Duplicate Onboarding State

**Files:**
- `packages/frontend/components/contexts/UserContext.tsx`
- `packages/frontend/components/contexts/OnboardingProvider.tsx`

**Problem:** Two separate sources of truth for onboardingComplete. When completeOnboarding succeeds in OnboardingProvider, UserContext does not know the state was completed through OnboardingProvider.

---

### Backend Admin Auth Not Enforced

**File:** `packages/frontend/app/admin.web.tsx:18`

```typescript
// TODO: backend must enforce admin auth on all admin-specific endpoints
```

**Impact:** Frontend auth checks can be bypassed. Backend MUST validate admin permissions on every request.

---

### Tab Layout Auth Guard Only on Native

**File:** `packages/frontend/app/(tabs)/_layout.tsx:26-30`

```typescript
useEffect(() => {
  if (Platform.OS !== 'web' && !loading && !user) {
    router.replace('/auth')
  }
}, [user, loading])
```

**Problem:** On web, unauthenticated users can see tab content briefly before redirect.

---

## Configuration Issues

### CRITICAL: Bundle ID Inconsistencies

| File | Platform | Value |
|------|----------|-------|
| `app.json` (root) | iOS | `com.theabhiramr.project-janatha` |
| `app.json` (root) | Android | `com.theabhiramr.projectjanatha` (missing hyphen) |
| `packages/frontend/app.json` | iOS | `org.chinmayamission.janata` |
| `packages/frontend/app.json` | Android | `org.chinmayamission.janata` |

**Three different bundle IDs across two app.json files!**

---

### CRITICAL: Missing Dependency

**File:** `packages/frontend/package.json`

```
expo-system-ui  MISSING  55.0.16  55.0.16
```

Listed in app.json plugins but not in package.json dependencies.

---

### HIGH: Version Mismatches

| Package | Root | Frontend | Issue |
|---------|------|----------|-------|
| `react-native-worklets` | ^0.8.1 | ^0.7.2 | Mismatch |
| `expo` | ~55.0.15 | ~55.0.0 | Minor version diff |
| `jest-expo` | N/A | ~55.0.0 | Not in root |

---

### HIGH: Migration Filename Bug

**File:** `migrations/0009_extend_events_schema.sql`

- Filename is 0009 but header comment says 0010_extend_events_schema.sql

---

### EAS Configuration Gaps

**File:** `packages/frontend/eas.json`

- Production build profile missing android.package setting
- No android configuration for any build profile

---

### TypeScript Configuration Conflicts

**File:** `tsconfig.base.json`

```json
"noImplicitAny": false,    // Contradicts strict mode intent
"module": "system",        // Non-standard module system
```

---

## Expo SDK Compatibility Analysis

### Current SDK Version

| Package | Current Version |
|---------|-----------------|
| Expo SDK | 55.0.15 |
| React Native | 0.83.4 |
| React | 19.2.0 |
| expo-router | 55.0.12 |
| react-native-reanimated | 4.2.1 |
| react-native-worklets | 0.7.2 |
| react-native-nitro-modules | 0.35.4 |

---

### Upgrade Path to SDK 56/57/58

#### Compatibility Assessment

| Package | Current | SDK 56 Status | SDK 57 Status | SDK 58 Status |
|---------|---------|---------------|---------------|---------------|
| expo | ~55.0.0 | Compatible | Needs update | Needs update |
| expo-router | ~55.0.12 | Compatible | Breaking changes | Breaking changes |
| react-native | 0.83.4 | Compatible | New Architecture required | RN 0.85+ |
| react-native-reanimated | 4.2.1 | Compatible | Compatible | Worklets 0.8+ |
| react-native-worklets | 0.7.2 | Compatible | Compatible | Need 0.8+ |

---

### SDK 58+ Breaking Changes (Major Concerns)

#### 1. React 19.3+ Requirement
- SDK 58 likely requires React 19.3+
- Current: React 19.2.0
- **Action:** Review all React 19.3 breaking changes

#### 2. New Architecture Hard Requirement
- SDK 58 may require New Architecture (React 18ish)
- Current Old Architecture with bridgeless mode
- **Action:** Test New Architecture in staging

#### 3. react-native-worklets 0.8+
- SDK 58 may require worklets 0.8+
- Current: 0.7.2 (root has 0.8.1 - version mismatch!)
- **Action:** Align worklets version across monorepo

---

### Immediate Upgrade Risks

#### Risk 1: react-native-worklets Version Mismatch

| Location | Version |
|----------|---------|
| Root package.json | ^0.8.1 |
| Frontend package.json | ^0.7.2 |

**Impact:** Inconsistent behavior between dev and production builds.

**Recommendation:** Use expo install to get correct matching versions.

---

#### Risk 2: expo-system-ui Missing from Direct Dependencies

**Current State:**
- Listed in app.json plugins
- Listed in package.json dependencies at ~55.0.16
- But npm outdated shows it as MISSING

**Impact:** Build may fail without this transitive dependency properly installed.

**Recommendation:** Run npx expo install --fix to ensure all Expo dependencies are properly linked.

---

#### Risk 3: Reanimated 4.x Compatibility Matrix

From react-native-reanimated/compatibility.json:

| Reanimated | Worklets Required |
|------------|-------------------|
| 4.2.1 (current) | 0.7.x |
| Nightly | nightly |
| 0.5.x, 0.6.x | 0.5.x, 0.6.x |
| 0.4.x | 0.4.x |

**Issue:** If upgrading to Reanimated 4.3+, must also upgrade worklets.

---

### Recommended Upgrade Sequence

#### Phase 1: Fix Current Issues (Before Any Upgrade)
1. Run npx expo install --fix to fix dependency issues
2. Align react-native-worklets version across monorepo
3. Add expo-system-ui explicitly if missing
4. Fix bundle ID inconsistencies

#### Phase 2: Test SDK 56
1. Update expo to ~56.0.0
2. Run npx expo install to update Expo packages
3. Test all native modules (maps, camera, location)
4. Verify Reanimated compatibility

#### Phase 3: Test SDK 57
1. Check breaking changes in expo-router
2. Test New Architecture compatibility
3. Update to Reanimated 4.3+ if required

#### Phase 4: Plan for SDK 58
1. Align worklets to 0.8+
2. Test New Architecture fully
3. Prepare for React 19.3+ if required

---

### Dependency Update Recommendations

| Package | Current | Recommended | Priority |
|---------|---------|-------------|----------|
| lucide-react-native | 1.7.0 | 1.14.0 | HIGH (major version jump with security fixes) |
| maplibre-gl | 4.7.1 | 5.24.0 | HIGH (major version jump) |
| expo | 55.0.15 | 55.0.19 | MEDIUM (stay within SDK 55) |
| react-native-screens | 4.23.0 | 4.24.0 | LOW |
| react-native-reanimated | 4.2.1 | 4.3.0 | MEDIUM |

---

## Priority Recommendations

### Critical (Fix Immediately)

1. **Remove hardcoded admin email** from utils/admin.ts - use environment variable
2. **Fix web token storage** - use HttpOnly, Secure, SameSite cookies
3. **Remove hardcoded JWT secrets** from wrangler.toml - use wrangler secret put
4. **Fix Map component delegation** - Map.tsx exports wrong platform version
5. **Fix bundle ID inconsistencies** - pick one bundle ID scheme

### High (Fix Before Next Release)

6. **Add Zod schema validation** for API endpoints
7. **Implement refresh token rotation** in backend
8. **Fix all catch (err: any) blocks** - use proper error types
9. **Add rate limiting** to public endpoints
10. **Align react-native-worklets version** across monorepo

### Medium (Fix in Next Sprint)

11. **Split backend app.ts** into route modules (1,679 lines is unmaintainable)
12. **Fix all index-as-key issues** in list renders
13. **Extract inline components** to prevent re-renders
14. **Add auth guard to web** - consistent with native
15. **Fix N+1 queries** in endorser and invite code lookups

### Low (Technical Debt)

16. **Standardize API response format** across all endpoints
17. **Add CSP and HSTS security headers**
18. **Create shared types package** to reduce duplication
19. **Fix migration filename mismatch** (0009 vs 0010)
20. **Update TypeScript config** to enable strict mode properly

---

## Appendix: File Reference

### Security-Critical Files

| File | Lines | Issue Count |
|------|-------|-------------|
| `packages/frontend/utils/admin.ts` | ~50 | 3 |
| `packages/frontend/components/utils/tokenStorage.web.ts` | ~130 | 2 |
| `packages/frontend/components/ui/ErrorBoundary.tsx` | ~250 | 2 |
| `packages/backend/wrangler.toml` | ~50 | 2 |
| `packages/backend/src/app.ts` | 1679 | 8+ |
| `packages/backend/src/auth.ts` | ~200 | 3 |

### Largest Files

| File | Lines | Category |
|------|-------|----------|
| `packages/backend/src/app.ts` | 1679 | Backend API |
| `packages/frontend/hooks/useApiData.ts` | 820 | Data fetching |
| `packages/frontend/app/events/[id].tsx` | 873 | Event detail |
| `packages/frontend/app/settings/profile.tsx` | 786 | Settings |
| `packages/frontend/app/(tabs)/index.tsx` | 685 | Main tab |

---

*Report generated by Claude Code on May 4, 2026*

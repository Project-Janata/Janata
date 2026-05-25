# Mobile Web Bottom-Tab Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On mobile-width web, replace the overflowing horizontal top nav with an iOS-style persistent bottom tab bar (visible even on the full-page Create Event form), and make the desktop "Create Event" button open the form on the Explore page.

**Architecture:** A new `WebBottomNav` component is rendered at the **root layout** (sibling of the Stack) so it persists across every route including `/events/form`. It shows only on authenticated mobile-web routes. The `(tabs)` layout switches per-screen headers from the desktop `WebHeader` to the compact native `TabHeader` at mobile width. Desktop web is unchanged except the "Create Event" button now navigates to `/explore?action=create`, which the Explore page reads to open its side-panel form.

**Tech Stack:** Expo Router, React Native (web), TypeScript, lucide-react-native, jest-expo + @testing-library/react-native.

**Spec:** `docs/superpowers/specs/2026-05-24-mobile-web-bottom-nav-design.md`

---

## File Structure

- **Create** `packages/frontend/components/ui/WebBottomNav.tsx` — persistent bottom tab bar for mobile web.
- **Create** `packages/frontend/src/__tests__/app/WebBottomNav.test.tsx` — unit test for the component.
- **Modify** `packages/frontend/app/_layout.tsx` — mount `WebBottomNav` below the Stack with a visibility gate.
- **Modify** `packages/frontend/app/(tabs)/_layout.tsx` — desktop-vs-mobile header switching; Explore mobile `+` create action; desktop "Create Event" → `/explore?action=create`.
- **Modify** `packages/frontend/app/(tabs)/explore.web.tsx` — handle `action=create` param; remove the dead `open-event-form` window listener.

All paths below are relative to `packages/frontend`. Run all commands from `packages/frontend`.

---

## Task 1: WebBottomNav component

**Files:**
- Create: `components/ui/WebBottomNav.tsx`
- Test: `src/__tests__/app/WebBottomNav.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/app/WebBottomNav.test.tsx`:

```tsx
import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { render, screen, fireEvent } from '@testing-library/react-native'

jest.mock('expo-router', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(),
}))
jest.mock('../../../components/contexts', () => ({
  useUser: jest.fn(),
  useTheme: jest.fn(() => ({ isDark: false })),
}))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))
jest.mock('../../../components/ui/Avatar', () => 'Avatar')

const { usePathname, useRouter } = jest.requireMock('expo-router')
const { useUser } = jest.requireMock('../../../components/contexts')
const mockPush = jest.fn()
const WebBottomNav = require('../../../components/ui/WebBottomNav').default

describe('WebBottomNav', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    ;(usePathname as jest.Mock).mockReturnValue('/')
    ;(useUser as jest.Mock).mockReturnValue({ user: { username: 'kish' } })
  })

  it('renders all five tabs', () => {
    render(<WebBottomNav />)
    expect(screen.getByText('Home')).toBeTruthy()
    expect(screen.getByText('Explore')).toBeTruthy()
    expect(screen.getByText('Feed')).toBeTruthy()
    expect(screen.getByText('Messages')).toBeTruthy()
    expect(screen.getByText('Profile')).toBeTruthy()
  })

  it('navigates to the tab route when pressed', () => {
    render(<WebBottomNav />)
    fireEvent.press(screen.getByText('Explore'))
    expect(mockPush).toHaveBeenCalledWith('/explore')
  })
})
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `npm run test:jest -- WebBottomNav`
Expected: FAIL — cannot resolve `../../../components/ui/WebBottomNav` (module not created yet).

- [ ] **Step 3: Create the component**

Create `components/ui/WebBottomNav.tsx`:

```tsx
import { View, Text, Pressable } from 'react-native'
import { usePathname, useRouter } from 'expo-router'
import { House, Compass, Newspaper, MessageSquare } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useUser, useTheme } from '../contexts'
import Avatar from './Avatar'

const NAV_ITEMS = [
  { label: 'Home', href: '/', icon: House },
  { label: 'Explore', href: '/explore', icon: Compass },
  { label: 'Feed', href: '/feed', icon: Newspaper },
  { label: 'Messages', href: '/chat', icon: MessageSquare },
  { label: 'Profile', href: '/profile', icon: null },
] as const

export default function WebBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()
  const { isDark } = useTheme()
  const insets = useSafeAreaInsets()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const ACTIVE = '#E8862A'
  const inactive = isDark ? '#A8A29E' : '#78716C'

  return (
    <View
      style={{
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: isDark ? '#262626' : '#E7E5E4',
        backgroundColor: isDark ? '#171717' : '#FFFFFF',
        paddingTop: 8,
        paddingBottom: Math.max(insets.bottom, 8),
      }}
    >
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const on = isActive(href)
        const color = on ? ACTIVE : inactive
        return (
          <Pressable
            key={href}
            onPress={() => router.push(href as never)}
            accessibilityRole="button"
            accessibilityLabel={label}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 }}
          >
            {href === '/profile' ? (
              <Avatar
                image={user?.profileImage ?? undefined}
                name={
                  user?.firstName
                    ? `${user.firstName} ${user.lastName ?? ''}`.trim()
                    : user?.username
                }
                size={24}
                style={{ borderWidth: on ? 2 : 0, borderColor: ACTIVE }}
              />
            ) : Icon ? (
              <Icon size={24} color={color} />
            ) : null}
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 10, color }}>{label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `npm run test:jest -- WebBottomNav`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add components/ui/WebBottomNav.tsx src/__tests__/app/WebBottomNav.test.tsx
git commit -m "feat(web): add WebBottomNav bottom-tab bar component"
```

---

## Task 2: Mount WebBottomNav in the root layout (mobile web only)

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Add imports**

In `app/_layout.tsx`, update the `react-native` import (currently `import { Animated, LogBox, Platform, Text } from 'react-native'`) to add `View` and `useWindowDimensions`:

```tsx
import { Animated, LogBox, Platform, Text, View, useWindowDimensions } from 'react-native'
```

Add the component import alongside the other component imports (near the `ErrorBoundary` import):

```tsx
import WebBottomNav from '../components/ui/WebBottomNav'
```

- [ ] **Step 2: Compute the visibility flag in `RootLayoutNav`**

In `RootLayoutNav`, just after `const isAuthenticated = !!user` (currently line 111), add:

```tsx
  const { width } = useWindowDimensions()
  const showBottomNav =
    Platform.OS === 'web' &&
    width < 768 &&
    isAuthenticated &&
    !pathname.startsWith('/auth') &&
    !pathname.startsWith('/onboarding') &&
    pathname !== '/landing'
```

- [ ] **Step 3: Render the bar below the Stack**

Replace the returned JSX block (currently the `<Animated.View>…</Animated.View>` containing `<NavigationThemeProvider><Stack>…</Stack></NavigationThemeProvider>`) so the Stack is wrapped in a flex `View` and the bar is a sibling below it:

```tsx
  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <NavigationThemeProvider value={navTheme}>
        <View style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="landing" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
            <Stack.Screen
              name="events/index"
              options={{ headerShown: true, title: 'My Events', headerBackTitle: '' }}
            />
            <Stack.Screen name="events/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="events/form" options={{ headerShown: false }} />
            <Stack.Screen name="center/[id]" options={{ headerShown: false }} />
            <Stack.Screen
              name="privacy"
              options={{ headerShown: Platform.OS !== 'web', title: 'Privacy Policy', headerBackTitle: '' }}
            />
            <Stack.Screen
              name="terms"
              options={{ headerShown: Platform.OS !== 'web', title: 'Terms of Service', headerBackTitle: '' }}
            />
            <Stack.Screen
              name="cookies"
              options={{ headerShown: Platform.OS !== 'web', title: 'Cookie Policy', headerBackTitle: '' }}
            />
            <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
            <Stack.Screen name="center-picker" options={{ headerShown: false }} />
            <Stack.Screen name="admin" options={{ headerShown: false }} />
          </Stack>
        </View>
        {showBottomNav && <WebBottomNav />}
      </NavigationThemeProvider>
    </Animated.View>
  )
```

- [ ] **Step 4: Verify by running the app at mobile width**

The dev server is already running (`npm run dev`, web on :8081). With Playwright (or browser devtools), resize the viewport to 390×800, navigate to `http://localhost:8081/` while logged in, and confirm a bottom bar with Home/Explore/Feed/Messages/Profile appears. Navigate to `/events/form` and confirm the bottom bar is **still visible**. Resize to 1200 wide and confirm the bottom bar is **gone** (desktop unchanged).

Note: the top nav will still overflow at this point — Task 3 fixes the header. This step only verifies the bottom bar mounts, persists on the form route, and is desktop-gated.

- [ ] **Step 5: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat(web): mount persistent bottom nav on mobile web routes"
```

---

## Task 3: Switch mobile-web headers to TabHeader + add Explore create action

**Files:**
- Modify: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Add a width-based desktop flag**

In `app/(tabs)/_layout.tsx`, update the `react-native` import to add `useWindowDimensions`:

```tsx
import { Platform, View, Text, Pressable, Image, StatusBar, useWindowDimensions } from 'react-native'
```

Inside `TabLayout`, just after `const tabBarShowLabel = Platform.OS === 'web'` (currently line 21), add:

```tsx
  const { width } = useWindowDimensions()
  const isDesktopWeb = Platform.OS === 'web' && width >= 768
```

- [ ] **Step 2: Replace `isWeb` with `isDesktopWeb` for header selection**

Currently `const isWeb = Platform.OS === 'web'` (line 179) is used for both the tab-bar style and every screen's `header`. Keep `isWeb` for `tabBarStyle` (the built-in bar stays hidden on all web), but switch the per-screen `header` selection to `isDesktopWeb`. In each `Tabs.Screen`, change `header: isWeb ? () => <WebHeader /> : …` to `header: isDesktopWeb ? () => <WebHeader /> : …`.

For the **index** screen:
```tsx
              header: isDesktopWeb
                ? () => <WebHeader />
                : () => <TabHeader showLogo action="notifications" />,
```

For the **feed** screen:
```tsx
              header: isDesktopWeb
                ? () => <WebHeader />
                : () => <TabHeader title="Feed" action="create" />,
```

For the **chat** screen:
```tsx
              header: isDesktopWeb
                ? () => <WebHeader />
                : () => <TabHeader title="Chat" action="create" />,
```

For the **profile** screen:
```tsx
              header: isDesktopWeb
                ? () => <WebHeader />
                : () => <TabHeader title="You" action="settings" />,
```

- [ ] **Step 3: Explore screen — desktop flag, transparent fix, and mobile-web create `+`**

For the **explore** `Tabs.Screen`, change `headerTransparent: !isWeb` to `headerTransparent: !isDesktopWeb`, and replace its `header` with one that adds a create action only on mobile web (`Platform.OS === 'web'` is only reachable here when `!isDesktopWeb`, i.e. mobile web):

```tsx
          <Tabs.Screen
            name="explore"
            options={{
              tabBarShowLabel: false,
              title: 'Explore',
              headerTransparent: !isDesktopWeb,
              header: isDesktopWeb
                ? () => <WebHeader />
                : () => (
                    <TabHeader
                      title="Explore"
                      transparent
                      pillTitle
                      borderAvatar
                      {...(Platform.OS === 'web'
                        ? { action: 'create' as const, onActionPress: () => router.push('/events/form') }
                        : {})}
                    />
                  ),
              tabBarIcon: ({ color, size }) => <Compass size={size} color={color} />,
            }}
          />
```

- [ ] **Step 4: Verify by running the app**

At 390px width (logged in): each tab shows a compact `TabHeader` (no horizontal overflow); the Explore screen shows a `+` in its header; tapping `+` opens `/events/form` and the bottom nav stays visible. At 1200px width: the desktop `WebHeader` renders exactly as before. Native is unaffected (the `Platform.OS === 'web'` guard keeps the Explore `+` off native).

- [ ] **Step 5: Commit**

```bash
git add "app/(tabs)/_layout.tsx"
git commit -m "feat(web): use compact TabHeader on mobile web + Explore create action"
```

---

## Task 4: Desktop "Create Event" → Explore with form open

**Files:**
- Modify: `app/(tabs)/_layout.tsx` (the `WebHeader` create button)
- Modify: `app/(tabs)/explore.web.tsx`

- [ ] **Step 1: Point the desktop Create Event button at the Explore route**

In `app/(tabs)/_layout.tsx`, in the `WebHeader` "Create Event" `Pressable` `onPress` (currently the block that branches on `window.innerWidth` and dispatches `open-event-form`), replace the body with a single navigation:

```tsx
              onPress={() => {
                posthog?.capture('nav_create_event')
                router.push('/explore?action=create')
              }}
```

- [ ] **Step 2: Handle the `action=create` param on the Explore page**

In `app/(tabs)/explore.web.tsx`, find the effect labeled "Listen for create event from header nav button" (currently around lines 1047–1056, the one that does `window.addEventListener('open-event-form', handler)`). **Replace that entire effect** with a param-driven one:

```tsx
  // Open the create-event form when navigated with ?action=create (from the
  // desktop "Create Event" button). Clear the param so refresh/back doesn't
  // reopen it and repeat clicks re-trigger.
  useEffect(() => {
    if (params.action === 'create') {
      setSelectedItem(null)
      setFormPanel({})
      router.setParams({ action: undefined } as never)
    }
  }, [params.action])
```

(`params`, `router`, `setSelectedItem`, and `setFormPanel` are already defined in this component — `useLocalSearchParams<{ detail?; id?; action? }>` at ~line 1002, `useRouter` at ~line 966, `formPanel` state at ~line 989.)

- [ ] **Step 3: Verify the dead window-event path is gone**

Run: `grep -rn "open-event-form" app`
Expected: no matches (both the dispatch in `_layout.tsx` and the listener in `explore.web.tsx` are removed).

- [ ] **Step 4: Verify by running the app at desktop width**

At ≥768px width, logged in: from Home/Feed/Messages, click "Create Event" → lands on `/explore` with the side-panel form open. Close the form → returns to the list, URL has no `?action=create`. Click "Create Event" again → form reopens (param re-triggers).

- [ ] **Step 5: Commit**

```bash
git add "app/(tabs)/_layout.tsx" "app/(tabs)/explore.web.tsx"
git commit -m "feat(web): desktop Create Event opens Explore form via action param"
```

---

## Final verification

- [ ] Run the full frontend unit suite: `npm run test:jest` — expect no new failures.
- [ ] Desktop web (≥768): nav + Create Event pill render as before; pill opens Explore side-panel form; close + reopen work.
- [ ] Mobile web (<768): bottom tabs (Home/Explore/Feed/Messages/Profile) with no overflow; each navigates with active state; Explore `+` opens full-page `/events/form` with the bottom nav still visible.
- [ ] Bottom nav hidden on landing/auth/onboarding and on desktop web.
- [ ] Native untouched (Explore has no `+`; bottom tab bar is the native Tabs bar).

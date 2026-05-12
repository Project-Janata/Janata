# Styling Guidelines

Janata uses a centralized design token system defined in `tokens/`. All colors, typography, spacing, and radii come from tokens — never hardcode values.

---

## Colors

**Source of truth:** `tokens/colors.ts`

Use the `useColors()` hook to get the current theme's color set. Never use `useTheme()` + `isDark ? '#...' : '#...'` ternaries.

```tsx
const c = useColors()

<View style={{ backgroundColor: c.card, borderColor: c.border }}>
  <Text style={{ color: c.text }}>Hello</Text>
</View>
```

### Token Reference

| Token | Light | Dark | Use for |
|---|---|---|---|
| `bg` | `#F5F5F4` | `#1A1A1A` | Screen / page background |
| `surface` | `#F0EDE8` | `#171717` | Sunken surfaces: input bg, icon pill, date pill |
| `panel` | `#F7F4EF` | `#1F1F1F` | Panel areas, card interiors |
| `rail` | `#FFFFFF` | `#171717` | Navigation rail / column background |
| `card` | `#FFFFFF` | `#262626` | Raised card background |
| `cardActive` | `#FFF7ED` | `#2E2E2E` | Pressed / selected card state |
| `border` | `#E7E5E4` | `#3A3A3A` | Default border |
| `borderStrong` | `#D6D3D1` | `#525252` | Emphasis border |
| `divider` | `#F1ECE3` | `#2A2A2A` | Hairline divider |
| `text` | `#1C1917` | `#FAFAFA` | Primary text — headings, body |
| `textSecondary` | `#44403C` | `#D6D3D1` | Supporting copy |
| `textMuted` | `#78716C` | `#A8A29E` | Labels, metadata |
| `textFaint` | `#A8A29E` | `#737373` | Placeholders, disabled |
| `textInverse` | `#FFFFFF` | `#1C1917` | Text on accent / dark surfaces |
| `accent` | `#E8862A` | `#E8862A` | Brand orange — interactive elements |
| `accentPress` | `#D97520` | `#F59340` | Pressed-state orange |
| `accentSoft` | `#FFF7ED` | `rgba(232,134,42,0.12)` | Orange tint background |
| `success` | `#059669` | `#34D399` | Success state |
| `successSoft` | `#ECFDF5` | `rgba(6,95,70,0.2)` | Success background |
| `error` | `#DC2626` | `#F87171` | Error state |
| `errorSoft` | `#FEF2F2` | `rgba(220,38,38,0.15)` | Error background |
| `icon` | `#1C1917` | `#FAFAFA` | Icon fill / stroke |
| `iconMuted` | `#78716C` | `#A8A29E` | Secondary icon |

---

## Typography

**Source of truth:** `tokens/typography.ts`

Two-font system:

| Font | Use for |
|---|---|
| **Inclusive Sans** | Headings, titles, names, primary viewed info, navigation labels |
| **System font** (no `fontFamily`) | Long-form text, secondary screens, actions, metadata |

### The rule

**Inclusive Sans is the default.** Use it for everything that is the primary thing a user is reading or identifying — titles, headings, names, the main content of cards.

**System font** (SF Pro on iOS, Roboto on Android, system-ui on web) is used when:
- Text is part of a **secondary screen** (settings, edit profile, onboarding forms)
- Text is a **user action** (button labels, "Sign in", "Post", "Save")
- Text is **long-form reading** (post body, message content, event descriptions, bio)
- Text is **small metadata** (timestamps, counts, subtext ≤ 12px)

This matches how Duolingo, Spotify, Airbnb, and Monzo handle their brand fonts — the custom font appears at the "moment of perception" (glance, identity, navigation), the platform font appears at the "moment of reading" (paragraphs, forms, actions).

For weight on system font, use `fontWeight` instead of a named family:
- Regular → no `fontFamily`, no `fontWeight`
- Medium → `fontWeight: '500'`
- SemiBold → `fontWeight: '600'`
- Bold → `fontWeight: '700'`

### Examples

```tsx
// ✅ Inclusive Sans — primary viewed content
<Text style={{ fontFamily: 'Inclusive Sans', fontSize: 24 }}>Event title</Text>
<Text style={{ fontFamily: 'Inclusive Sans', fontSize: 16 }}>Person name</Text>
<Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14 }}>Tab label</Text>

// ✅ System font — secondary / action / body
<Text style={{ fontSize: 15, lineHeight: 22 }}>Post body paragraph</Text>
<Text style={{ fontWeight: '500', fontSize: 15 }}>Button label</Text>
<Text style={{ fontSize: 12 }}>Jan 1 · 5:00 PM</Text>
<Text style={{ fontSize: 11, letterSpacing: 0.9 }}>SECTION EYEBROW</Text>
```

### Type Scale

```tsx
import { type } from '../tokens'

// Inclusive Sans — primary identity content
<Text style={type.display}>   // 30/34, -0.5 tracking — hero heading
<Text style={type.h1}>        // 24/28, -0.3 tracking
<Text style={type.h2}>        // 20/24
<Text style={type.h3}>        // 17/22
<Text style={type.body}>      // 15/22 — Inclusive Sans body copy
<Text style={type.bodySmall}> // 14/20

// System font — secondary content, actions, metadata
<Text style={type.eyebrow}>      // 11px, 0.9 tracking — eyebrow labels
<Text style={type.label}>        // 500-weight 13/18 — chips, tags
<Text style={type.button}>       // 500-weight 15/20 — button labels
<Text style={type.caption}>      // 12/16 — timestamps, counts
<Text style={type.captionSmall}> // 11/14 — badges, pills
```

---

## Spacing

**Source of truth:** `tokens/spacing.ts` — 8-point grid

```tsx
import { space } from '../tokens'

space[1]  =  4   // tight gap
space[2]  =  8   // small gap / icon padding
space[3]  = 12   // standard inner padding
space[4]  = 16   // page horizontal padding
space[5]  = 20   // section gap
space[6]  = 24   // card padding / large gap
space[8]  = 32
space[10] = 40
space[12] = 48
```

---

## Border Radius

**Source of truth:** `tokens/radii.ts`

```tsx
import { radius } from '../tokens'

radius.xs   =  6   // small badges, tight chips
radius.sm   =  8   // inputs, small cards
radius.md   = 12   // standard cards
radius.lg   = 16   // prominent cards
radius.xl   = 20   // hero cards, large surfaces
radius['2xl'] = 24 // modals, sheets
radius.full = 999  // pills, circular avatars
```

---

## Patterns

### Using colors in a component

```tsx
import { useColors } from '../hooks/useColors'

function MyCard() {
  const c = useColors()
  return (
    <View style={{ backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border }}>
      <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 18, color: c.text }}>Title</Text>
      <Text style={{ fontFamily: 'Inter', fontSize: 12, color: c.textMuted }}>Jan 1 · 5:00 PM</Text>
    </View>
  )
}
```

### Pressable — use static style, not function form

On React Native Web, `style={({ pressed }) => ...}` on `Pressable` is unreliable and can fail to apply styles entirely. Always use a static style object:

```tsx
// ✅ Do this
<Pressable style={{ backgroundColor: c.card, padding: 12 }}>

// ❌ Avoid this on web
<Pressable style={({ pressed }) => ({ backgroundColor: pressed ? c.cardActive : c.card })}>
```

### NativeWind className vs inline style

- Use `className` (NativeWind) for layout-critical flex containers and when a class is shared across many states (e.g., `flex-1 items-center`).
- Use inline `style` for dynamic values that depend on token colors or conditional logic.
- Never mix `className` and `style` for the same property on the same element.

### Dark mode

Dark mode is handled automatically by `useColors()`. Never branch on `isDark` to pick colors — use the token instead.

```tsx
// ✅ Token handles both modes
const c = useColors()
<View style={{ backgroundColor: c.surface }}>

// ❌ Manual isDark branching
const { isDark } = useTheme()
<View style={{ backgroundColor: isDark ? '#171717' : '#F0EDE8' }}>
```

The only valid use of `isDark` is for non-color logic (e.g., SVG gradient stops, map style, status bar).

---

## Token import path

```tsx
import { useColors } from '../hooks/useColors'
import { type, family, space, radius } from '../tokens'
```

Adjust the relative path based on your file's location.

import React from 'react'
import { Image, Pressable, Text, View } from 'react-native'
import { Clock3, MapPin } from 'lucide-react-native'
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient as SvgLinearGradient,
  Rect,
  Stop,
} from 'react-native-svg'
import { Avatar } from '../ui'
import { useColors } from '../../hooks/useColors'
import type { FeaturedHomeEvent } from '../boards'
import type { EventDisplay } from '../../utils/api'

export type FeaturedSource =
  | { kind: 'live'; event: EventDisplay; centerName?: string }
  | { kind: 'mock'; event: FeaturedHomeEvent }

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null
  const parsed = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((parsed.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function countdownLabel(dateStr?: string): string | null {
  const days = daysUntil(dateStr)
  if (days == null || days < 0) return null
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days < 7) return `In ${days} days`
  if (days < 30) return `In ${Math.round(days / 7)} weeks`
  return `In ${days} days`
}

function GradientHero({ isDark }: { isDark: boolean }) {
  return (
    <View style={{ flex: 1 }}>
      <Svg width="100%" height="100%" viewBox="0 0 300 124" preserveAspectRatio="none">
        <Defs>
          <SvgLinearGradient id="featGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={isDark ? '#7C2D12' : '#FFF1E5'} />
            <Stop offset="0.6" stopColor={isDark ? '#C2410C' : '#FED7AA'} />
            <Stop offset="1" stopColor={isDark ? '#9A3412' : '#FB923C'} />
          </SvgLinearGradient>
        </Defs>
        <Rect x="0" y="0" width="300" height="124" fill="url(#featGrad)" />
        <Circle
          cx="248"
          cy="62"
          r="14"
          stroke="#7C2D12"
          strokeOpacity="0.18"
          strokeWidth="0.8"
          fill="none"
        />
        <Circle
          cx="248"
          cy="62"
          r="26"
          stroke="#7C2D12"
          strokeOpacity="0.16"
          strokeWidth="0.8"
          fill="none"
        />
        <Circle
          cx="248"
          cy="62"
          r="38"
          stroke="#7C2D12"
          strokeOpacity="0.14"
          strokeWidth="0.8"
          fill="none"
        />
        <Circle
          cx="248"
          cy="62"
          r="50"
          stroke="#7C2D12"
          strokeOpacity="0.12"
          strokeWidth="0.8"
          fill="none"
        />
        <Circle
          cx="248"
          cy="62"
          r="62"
          stroke="#7C2D12"
          strokeOpacity="0.10"
          strokeWidth="0.8"
          fill="none"
        />
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
          const rad = (deg * Math.PI) / 180
          return (
            <Line
              key={deg}
              x1="248"
              y1="62"
              x2={248 + 70 * Math.cos(rad)}
              y2={62 + 70 * Math.sin(rad)}
              stroke="#7C2D12"
              strokeOpacity="0.11"
              strokeWidth="0.8"
            />
          )
        })}
      </Svg>
    </View>
  )
}

function InkPill({ label }: { label: string }) {
  return (
    <View
      style={{
        backgroundColor: '#1C1917',
        borderRadius: 999,
        paddingHorizontal: 9,
        paddingVertical: 4,
      }}
    >
      <Text style={{ fontSize: 11, color: '#FAFAF7', letterSpacing: 0.2 }}>{label}</Text>
    </View>
  )
}

function GoingPill({ label }: { label: string }) {
  return (
    <View
      style={{
        backgroundColor: '#DCFCE7',
        borderRadius: 999,
        paddingHorizontal: 9,
        paddingVertical: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
      }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#15803D' }} />
      <Text style={{ fontWeight: '500', fontSize: 11, color: '#15803D' }}>{label}</Text>
    </View>
  )
}

function AttendeeStack({
  attendees,
  fallback,
}: {
  attendees?: EventDisplay['attendeesList']
  fallback: { name: string; initials: string; accentColor?: string }[]
}) {
  const max = 4
  const items =
    attendees && attendees.length > 0
      ? attendees.slice(0, max).map((a) => ({ name: a.name, initials: a.initials, image: a.image }))
      : fallback
          .slice(0, max)
          .map((p) => ({ name: p.name, initials: p.initials, accentColor: p.accentColor }))

  return (
    <View style={{ flexDirection: 'row' }}>
      {items.map((item, index) => (
        <View
          key={`${item.name}-${index}`}
          style={{
            marginLeft: index === 0 ? 0 : -7,
            borderWidth: 2,
            borderColor: '#FFFFFF',
            borderRadius: 14,
          }}
        >
          <Avatar
            name={item.name}
            initials={item.initials}
            image={(item as any).image}
            backgroundColor={(item as any).accentColor}
            size={22}
          />
        </View>
      ))}
    </View>
  )
}

export function FeaturedEventCard({
  featured,
  onPress,
}: {
  featured: FeaturedSource
  onPress: () => void
}) {
  const c = useColors()
  const isDark = c.bg === '#1A1A1A'

  const event = featured.kind === 'live' ? featured.event : null
  const mock = featured.kind === 'mock' ? featured.event : null
  const title = event?.title ?? mock!.title
  const dateLabel = event
    ? event.date
      ? new Date(`${event.date}T00:00:00`).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
      : 'TBD'
    : mock!.dateLabel
  const timeLabel = event?.time || mock?.timeLabel || 'TBD'
  const locationLabel = event
    ? event.location || event.address || 'Location TBA'
    : mock!.locationLabel
  const goingPill = event ? event.isRegistered : mock!.going
  const countdown = event ? countdownLabel(event.date) : (mock?.countdownLabel ?? null)
  const attendeesGoingLabel = event
    ? event.attendees > 0
      ? `${event.attendees} going`
      : null
    : mock!.attendeesGoingLabel
  const attendeesList = event?.attendeesList?.slice(0, 4)
  const fallbackAttendees = mock?.attendees ?? []
  const heroImage = event?.image
  const heroDate = event?.date ? new Date(`${event.date}T00:00:00`) : null
  const heroMonth = heroDate ? heroDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : null
  const heroDay = heroDate ? String(heroDate.getDate()) : null

  return (
    <Pressable
      onPress={onPress}
      disabled={featured.kind !== 'live'}
      style={{
        borderRadius: 22,
        borderWidth: 1,
        borderColor: c.border,
        backgroundColor: c.card,
        overflow: 'hidden',
      }}
    >
      <View style={{ height: 124, position: 'relative' }}>
        {heroImage ? (
          <Image
            source={{ uri: heroImage }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <GradientHero isDark={isDark} />
        )}
        {!heroImage && heroDay ? (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 11, letterSpacing: 1.6, color: isDark ? '#FDBA74' : '#9A3412' }}>
              {heroMonth}
            </Text>
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 36, lineHeight: 40, color: isDark ? '#FFF7ED' : '#7C2D12' }}>
              {heroDay}
            </Text>
          </View>
        ) : null}
        <View style={{ position: 'absolute', top: 12, left: 12, flexDirection: 'row', gap: 6 }}>
          {countdown && <InkPill label={countdown} />}
          {goingPill && <GoingPill label="You're going" />}
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14 }}>
        <Text
          style={{
            fontFamily: 'Inclusive Sans',
            fontSize: 18,
            lineHeight: 23,
            letterSpacing: -0.2,
            color: c.text,
          }}
          numberOfLines={2}
        >
          {title}
        </Text>
        <View style={{ flexDirection: 'column', gap: 4, marginTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Clock3 size={13} color={c.textFaint} />
            <Text
              style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: c.textSecondary }}
              numberOfLines={1}
            >
              {dateLabel} · {timeLabel}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MapPin size={13} color={c.textFaint} />
            <Text
              style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: c.textSecondary }}
              numberOfLines={1}
            >
              {locationLabel}
            </Text>
          </View>
        </View>
        {(attendeesGoingLabel || fallbackAttendees.length > 0) && (
          <View
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: c.divider,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <AttendeeStack attendees={attendeesList} fallback={fallbackAttendees} />
            <Text style={{ fontSize: 12, color: c.textMuted }} numberOfLines={1}>
              {attendeesGoingLabel}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  )
}

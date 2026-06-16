// Coordinator-only attendee roster shown on the event page (native + web).
// Renders the full list of who RSVP'd — registered members (with email) and
// account-less guests — plus a CSV export. This is the "replaces the Google
// Form / spreadsheet" surface for event coordinators (creator or admin).
//
// The caller is responsible for only rendering this when the viewer can manage
// the event (creator or admin); the backend /events/:id/roster route enforces
// the same gate, so a non-coordinator who somehow renders it gets a 403.
import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Image,
  Platform,
  Share,
} from 'react-native'
import { Users, Download } from 'lucide-react-native'
import { useDetailColors } from '../../hooks/useDetailColors'
import { getEventRoster, type EventRoster, type EventRosterEntry } from '../../utils/api'

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function csvCell(value: string | null | undefined): string {
  const s = value == null ? '' : String(value)
  // Quote when the value contains a delimiter, quote, or newline; escape quotes.
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function buildCsv(roster: EventRoster): string {
  const rows: string[][] = [['Name', 'Email', 'Type', 'RSVP date']]
  roster.registered.forEach((r) =>
    rows.push([r.name, r.email ?? '', 'Member', r.joinedAt ?? '']),
  )
  roster.guests.forEach((g) => rows.push([g.name, g.email ?? '', 'Guest', g.rsvpedAt ?? '']))
  return rows.map((cols) => cols.map(csvCell).join(',')).join('\n')
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'event'
  )
}

function Row({ entry, isGuest }: { entry: EventRosterEntry; isGuest: boolean }) {
  const c = useDetailColors()
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: c.border,
      }}
    >
      {entry.image ? (
        <Image
          source={{ uri: entry.image }}
          style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.iconBoxBg }}
        />
      ) : (
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: c.iconBoxBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: c.textSecondary }}>
            {initialsOf(entry.name)}
          </Text>
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: c.text }}
          numberOfLines={1}
        >
          {entry.name}
        </Text>
        {entry.email ? (
          <Text
            style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: c.textMuted }}
            numberOfLines={1}
          >
            {entry.email}
          </Text>
        ) : null}
      </View>
      {isGuest ? (
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 999,
            backgroundColor: c.iconBoxBg,
          }}
        >
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 11, color: c.textSecondary }}>
            Guest
          </Text>
        </View>
      ) : null}
    </View>
  )
}

export default function EventAttendeeRoster({
  eventId,
  eventTitle,
}: {
  eventId: string
  eventTitle?: string
}) {
  const c = useDetailColors()
  const [roster, setRoster] = useState<EventRoster | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      setRoster(await getEventRoster(eventId))
    } catch (err: any) {
      setError(err?.status === 403 ? 'You do not have access to this roster.' : 'Failed to load attendees.')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    load()
  }, [load])

  const onExport = useCallback(async () => {
    if (!roster || roster.counts.total === 0) return
    setExporting(true)
    try {
      const csv = buildCsv(roster)
      const filename = `${slugify(eventTitle ?? '')}-attendees.csv`
      if (Platform.OS === 'web') {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        // Native: share the CSV text via the OS share sheet (Mail, Files, etc.).
        await Share.share({ message: csv, title: filename })
      }
    } catch (err: any) {
      if (__DEV__) console.warn('[EventAttendeeRoster] export failed:', err?.message || err)
    } finally {
      setExporting(false)
    }
  }, [roster, eventTitle])

  const total = roster?.counts.total ?? 0

  return (
    <View
      style={{
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: c.border,
        backgroundColor: c.cardBg,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
          <Users size={16} color={c.iconHeader} />
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 15, color: c.text }}>
            Manage attendees
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Export attendees as CSV"
          onPress={onExport}
          disabled={loading || exporting || total === 0}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 999,
            borderWidth: 1.5,
            borderColor: '#E8862A',
            opacity: loading || total === 0 ? 0.4 : 1,
          }}
        >
          <Download size={14} color="#E8862A" strokeWidth={2.5} />
          <Text style={{ fontFamily: 'Inclusive Sans', fontWeight: '600', fontSize: 13, color: '#E8862A' }}>
            {exporting ? 'Exporting…' : 'Export CSV'}
          </Text>
        </Pressable>
      </View>

      {!loading && !error && roster ? (
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: c.textMuted, marginTop: 4 }}>
          {roster.counts.registered} member{roster.counts.registered === 1 ? '' : 's'}
          {roster.counts.guests > 0
            ? ` · ${roster.counts.guests} guest${roster.counts.guests === 1 ? '' : 's'}`
            : ''}
        </Text>
      ) : null}

      {loading ? (
        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
          <ActivityIndicator color="#E8862A" />
        </View>
      ) : error ? (
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: '#DC2626', marginTop: 10 }}>
          {error}
        </Text>
      ) : total === 0 ? (
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: c.textMuted, marginTop: 10 }}>
          No RSVPs yet.
        </Text>
      ) : (
        <View style={{ marginTop: 8 }}>
          {roster!.registered.map((r) => (
            <Row key={`m-${r.id ?? r.email ?? r.name}`} entry={r} isGuest={false} />
          ))}
          {roster!.guests.map((g) => (
            <Row key={`g-${g.email ?? g.name}`} entry={g} isGuest />
          ))}
        </View>
      )}
    </View>
  )
}

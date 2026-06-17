import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { View, Text, Pressable, ActivityIndicator, useWindowDimensions } from 'react-native'
import { MapPin, Clock, Users, FileText, Mail } from 'lucide-react-native'
import AdminTable, { type Column } from './AdminTable'
import AdminDetailPanel from './AdminDetailPanel'
import AdminSearchInput from './AdminSearchInput'
import AdminInfoRow from './AdminInfoRow'
import ConfirmDialog from './ConfirmDialog'
import {
  fetchAdminEvents,
  fetchAdminEventGuestRsvps,
  adminDeleteEvent,
  type EventData,
  type GuestRsvpData,
} from '../../utils/api'
import { useDetailColors } from '../../hooks/useDetailColors'
import { useTheme } from '../contexts'
import { useAnalytics } from '../../utils/analytics'

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function EventsTab() {
  const colors = useDetailColors()
  const { isDark } = useTheme()
  const { width } = useWindowDimensions()
  const { track } = useAnalytics()
  const isCompact = width < 640
  const [search, setSearch] = useState('')
  const [events, setEvents] = useState<EventData[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<EventData | null>(null)
  const [guestRsvps, setGuestRsvps] = useState<GuestRsvpData[]>([])
  const [guestRsvpsLoading, setGuestRsvpsLoading] = useState(false)

  const [error, setError] = useState<string | null>(null)

  const loadEvents = useCallback(async (q?: string) => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetchAdminEvents({ q: q || undefined, limit: 100 })
      setEvents(result.data)
      setTotal(result.total)
    } catch (err: any) {
      if (__DEV__) console.error('Failed to load events:', err)
      setError(err?.message || 'Failed to load events. Are you logged in?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadEvents(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, loadEvents])

  const selected = useMemo(
    () => events.find((e) => e.eventID === selectedId) ?? null,
    [selectedId, events]
  )

  useEffect(() => {
    let mounted = true
    if (!selectedId) {
      setGuestRsvps([])
      return
    }
    setGuestRsvpsLoading(true)
    setGuestRsvps([])
    fetchAdminEventGuestRsvps(selectedId)
      .then((rows) => {
        if (mounted) setGuestRsvps(rows)
      })
      .catch((err) => {
        if (__DEV__) console.error('Failed to load guest RSVPs:', err)
        if (mounted) setGuestRsvps([])
      })
      .finally(() => {
        if (mounted) setGuestRsvpsLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [selectedId])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await adminDeleteEvent(deleteTarget.eventID)
      track('admin_event_deleted', { eventId: deleteTarget.eventID, source: 'admin' })
      setDeleteTarget(null)
      setSelectedId(null)
      loadEvents(search)
    } catch (err) {
      if (__DEV__) console.error('Failed to delete event:', err)
    }
  }

  const columns: Column<EventData>[] = [
    {
      key: 'title',
      header: 'Title',
      flex: 2,
      render: (item) => (
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.text }} numberOfLines={1}>
          {item.title || 'Untitled'}
        </Text>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      flex: 1,
      render: (item) => (
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textSecondary }}>
          {formatDate(item.date)}
        </Text>
      ),
    },
    {
      key: 'attendees',
      header: 'Attendees',
      flex: 1,
      render: (item) => (
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textSecondary }}>
          {item.peopleAttending}
        </Text>
      ),
    },
  ]

  if (loading && events.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#E8862A" />
      </View>
    )
  }

  if (error && events.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: '#DC2626', textAlign: 'center' }}>
          {error}
        </Text>
        <Pressable onPress={() => loadEvents()} style={{ marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#E8862A', borderRadius: 8 }}>
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: '#fff' }}>Retry</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <View style={{ flex: 1, padding: isCompact ? 14 : 20 }}>
        <View
          style={{
            flexDirection: isCompact ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isCompact ? 'stretch' : 'center',
            gap: 10,
            marginBottom: 16,
          }}
        >
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 18, color: colors.text }}>
            Events ({total})
          </Text>
          <View style={{ width: isCompact ? '100%' : 240 }}>
            <AdminSearchInput value={search} onChangeText={setSearch} placeholder="Search events..." />
          </View>
        </View>

        <AdminTable
          columns={columns}
          data={events}
          keyExtractor={(item) => item.eventID}
          selectedId={selectedId}
          onRowPress={(item) => setSelectedId(item.eventID === selectedId ? null : item.eventID)}
        />
      </View>

      {selected && (
        <AdminDetailPanel title={selected.title || 'Untitled'} onClose={() => setSelectedId(null)}>
          <View style={{ gap: 12 }}>
            <AdminInfoRow
              icon={<Clock size={14} color={colors.textMuted} />}
              text={`${formatDate(selected.date)} · ${formatTime(selected.date)}`}
              colors={colors}
            />
            {selected.address && (
              <AdminInfoRow icon={<MapPin size={14} color={colors.textMuted} />} text={selected.address} colors={colors} />
            )}
            <AdminInfoRow
              icon={<Users size={14} color={colors.textMuted} />}
              text={`${selected.peopleAttending} attendees (${selected.accountAttendeeCount ?? selected.peopleAttending} accounts, ${selected.guestRsvpCount ?? 0} guests)`}
              colors={colors}
            />
            {selected.description && (
              <AdminInfoRow icon={<FileText size={14} color={colors.textMuted} />} text={selected.description} colors={colors} />
            )}
          </View>

          <View style={{ marginTop: 18, gap: 10 }}>
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.text }}>
              Guest RSVPs
            </Text>
            {guestRsvpsLoading ? (
              <ActivityIndicator color="#E8862A" style={{ alignSelf: 'flex-start' }} />
            ) : guestRsvps.length > 0 ? (
              <View style={{ gap: 10 }}>
                {guestRsvps.map((guest) => (
                  <View
                    key={`${guest.email}-${guest.createdAt}`}
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: colors.border,
                      paddingTop: 10,
                      gap: 4,
                    }}
                  >
                    <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.text }}>
                      {guest.name}
                    </Text>
                    <AdminInfoRow
                      icon={<Mail size={14} color={colors.textMuted} />}
                      text={guest.email}
                      colors={colors}
                    />
                    <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 11, color: colors.textMuted }}>
                      No account · RSVPed {formatDate(guest.createdAt)} at {formatTime(guest.createdAt)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.textSecondary }}>
                No account-less RSVPs yet.
              </Text>
            )}
          </View>

          <View style={{ marginTop: 16 }}>
            <Pressable
              onPress={() => setDeleteTarget(selected)}
              style={{ backgroundColor: colors.iconBoxBg, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, alignSelf: 'flex-start' }}
            >
              <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: isDark ? '#F87171' : '#DC2626' }}>
                Delete
              </Text>
            </Pressable>
          </View>
        </AdminDetailPanel>
      )}

      <ConfirmDialog
        visible={deleteTarget !== null}
        title="Delete Event"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  )
}

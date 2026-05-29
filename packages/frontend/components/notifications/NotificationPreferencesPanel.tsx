/**
 * NotificationPreferencesPanel.tsx
 *
 * Notification preferences settings component
 */

import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, Switch, ActivityIndicator, Alert } from 'react-native'
import type { NotificationPreferences } from '../../utils/notificationService'
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../../utils/notificationService'
import { useColors } from '../../hooks/useColors'

export const NotificationPreferencesPanel: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const c = useColors()

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      setLoading(true)
      const prefs = await getNotificationPreferences()
      setPreferences(prefs)
    } catch (error) {
      console.error('Failed to load preferences:', error)
      Alert.alert('Error', 'Failed to load notification preferences')
    } finally {
      setLoading(false)
    }
  }

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return

    try {
      setSaving(true)
      const updated = await updateNotificationPreferences({
        [key]: value,
      })
      setPreferences(updated)
    } catch (error) {
      console.error('Failed to update preference:', error)
      Alert.alert('Error', 'Failed to update preference')
      // Revert the change
      loadPreferences()
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: c.card, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={c.accent} />
      </View>
    )
  }

  if (!preferences) {
    return (
      <View style={{ flex: 1, backgroundColor: c.card, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 14, color: c.error, textAlign: 'center' }}>Failed to load preferences</Text>
      </View>
    )
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.card }} contentContainerStyle={{ padding: 16 }}>
      {/* Main Channels */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: c.text, marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: c.border }}>
          Notification Channels
        </Text>

        <PreferenceRow
          label="In-App Notifications"
          value={preferences.inAppEnabled}
          onValueChange={(value) => updatePreference('inAppEnabled', value)}
          disabled={saving}
        />

        <PreferenceRow
          label="Push Notifications (Coming Soon)"
          value={preferences.pushEnabled}
          onValueChange={(value) => updatePreference('pushEnabled', value)}
          disabled={saving || true}
        />

        <PreferenceRow
          label="Email Notifications (Coming Soon)"
          value={preferences.emailEnabled}
          onValueChange={(value) => updatePreference('emailEnabled', value)}
          disabled={saving || true}
        />
      </View>

      {/* Notification Types */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: c.text, marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: c.border }}>
          Notification Types
        </Text>

        <PreferenceRow
          label="Event Reminders"
          description="Get reminded about upcoming events"
          value={preferences.eventReminders}
          onValueChange={(value) => updatePreference('eventReminders', value)}
          disabled={saving}
        />

        <PreferenceRow
          label="Event Created"
          description="New events at your center"
          value={preferences.eventCreated}
          onValueChange={(value) => updatePreference('eventCreated', value)}
          disabled={saving}
        />

        <PreferenceRow
          label="Event Cancelled"
          description="Event cancellations"
          value={preferences.eventCancelled}
          onValueChange={(value) => updatePreference('eventCancelled', value)}
          disabled={saving}
        />

        <PreferenceRow
          label="Event Updated"
          description="Changes to event details"
          value={preferences.eventUpdated}
          onValueChange={(value) => updatePreference('eventUpdated', value)}
          disabled={saving}
        />

        <PreferenceRow
          label="Attendee Joined"
          description="When others join your events"
          value={preferences.attendeeJoined}
          onValueChange={(value) => updatePreference('attendeeJoined', value)}
          disabled={saving}
        />

        <PreferenceRow
          label="Center Announcements"
          description="Important updates from your center"
          value={preferences.centerAnnouncements}
          onValueChange={(value) => updatePreference('centerAnnouncements', value)}
          disabled={saving}
        />
      </View>

      {/* Quiet Hours (Future) */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: c.text, marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: c.border }}>
          Quiet Hours (Coming Soon)
        </Text>
        <Text style={{ fontSize: 14, color: c.textMuted, fontStyle: 'italic' }}>
          Mute notifications during specific hours
        </Text>
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  )
}

interface PreferenceRowProps {
  label: string
  description?: string
  value: boolean
  onValueChange: (value: boolean) => void
  disabled?: boolean
}

const PreferenceRow: React.FC<PreferenceRowProps> = ({
  label,
  description,
  value,
  onValueChange,
  disabled,
}) => {
  const c = useColors()
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.divider }}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={{ fontSize: 15, fontWeight: '500', color: c.text, marginBottom: 4 }}>{label}</Text>
        {description && <Text style={{ fontSize: 13, color: c.textMuted, marginTop: 4 }}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: c.border, true: c.success }}
        thumbColor={value ? c.card : c.surface}
      />
    </View>
  )
}

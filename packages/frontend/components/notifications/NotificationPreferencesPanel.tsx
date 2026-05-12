/**
 * NotificationPreferencesPanel.tsx
 *
 * Notification preferences settings component
 */

import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, Switch, ActivityIndicator, Alert } from 'react-native'
import type { NotificationPreferences } from '../../utils/notificationService'
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../../utils/notificationService'

export const NotificationPreferencesPanel: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    )
  }

  if (!preferences) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to load preferences</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Main Channels */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Channels</Text>

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
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Types</Text>

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
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quiet Hours (Coming Soon)</Text>
        <Text style={styles.infoText}>
          Mute notifications during specific hours
        </Text>
      </View>

      <View style={styles.spacer} />
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
  return (
    <View style={styles.row}>
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        {description && <Text style={styles.rowDescription}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#ccc', true: '#81C784' }}
        thumbColor={value ? '#4CAF50' : '#f4f3f4'}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#f9f9f9',
  },
  rowContent: {
    flex: 1,
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  rowDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
    textAlign: 'center',
  },
  spacer: {
    height: 24,
  },
})

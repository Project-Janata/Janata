// /settings/notifications — manage notification preferences. Surfaces the
// previously-orphaned NotificationPreferencesPanel (in-app + per-type toggles;
// push/email are labelled "Coming Soon"). Reached from the Settings page.
import React from 'react'
import { View } from 'react-native'
import { StackHeader } from '../../components/ui'
import { NotificationPreferencesPanel } from '../../components/notifications/NotificationPreferencesPanel'
import { useColors } from '../../hooks/useColors'

export default function NotificationSettingsScreen() {
  const c = useColors()
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StackHeader title="Notifications" />
      <NotificationPreferencesPanel />
    </View>
  )
}

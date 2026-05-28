import React, { useState, useEffect } from 'react'
import { View, Text } from 'react-native'
import { useUser, useTheme } from '../components/contexts'
import { router } from 'expo-router'
import AdminSidebar, { type AdminTab } from '../components/admin/AdminSidebar'
import CentersTab from '../components/admin/CentersTab'
import EventsTab from '../components/admin/EventsTab'
import UsersTab from '../components/admin/UsersTab'
import InviteCodesTab from '../components/admin/InviteCodesTab'
import NotificationsTab from '../components/admin/NotificationsTab'
import ModerationTab from '../components/admin/ModerationTab'
import { isSuperAdmin as checkSuperAdmin } from '../utils/admin'

export default function AdminPage() {
  const { user, loading } = useUser()
  const { isDark } = useTheme()
  const [activeTab, setActiveTab] = useState<AdminTab>('Centers')

  // TODO: backend must enforce admin auth on all admin-specific endpoints
  const isAdmin = checkSuperAdmin(user)

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace('/(tabs)')
    }
  }, [loading, isAdmin])

  if (!loading && !isAdmin) {
    return null
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#0d0d0d' : '#FAFAF9' }}>
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: isDark ? '#666' : '#999' }}>Loading...</Text>
      </View>
    )
  }

  const pageBg = isDark ? '#0d0d0d' : '#FAFAF9'

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: pageBg }}>
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === 'Centers' && <CentersTab />}
      {activeTab === 'Events' && <EventsTab />}
      {activeTab === 'Users' && <UsersTab />}
      {activeTab === 'Invite Codes' && <InviteCodesTab />}
      {activeTab === 'Moderation' && <ModerationTab />}
      {activeTab === 'Notifications' && <NotificationsTab />}
    </View>
  )
}

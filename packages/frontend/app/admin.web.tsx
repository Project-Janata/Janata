import React, { useState, useEffect } from 'react'
import { View, Text, useWindowDimensions } from 'react-native'
import { useUser, useTheme } from '../components/contexts'
import { router } from 'expo-router'
import AdminSidebar, { type AdminTab } from '../components/admin/AdminSidebar'
import CentersTab from '../components/admin/CentersTab'
import EventsTab from '../components/admin/EventsTab'
import UsersTab from '../components/admin/UsersTab'
import InviteCodesTab from '../components/admin/InviteCodesTab'
import NotificationsTab from '../components/admin/NotificationsTab'
import ModerationTab from '../components/admin/ModerationTab'
import { isSevakOrAdmin, hasAdminCapability } from '../utils/admin'
import { useAnalytics } from '../utils/analytics'

export default function AdminPage() {
  const { user, loading } = useUser()
  const { isDark } = useTheme()
  const { width } = useWindowDimensions()
  const { track } = useAnalytics()
  // canEnter: sevak+ may open the app (Moderation). isAdmin: full admin (all
  // tabs). Admin-only endpoints 403 for a sevak token, so we gate by isAdmin —
  // not the localhost-masked isSuperAdmin.
  const canEnter = isSevakOrAdmin(user)
  const isAdmin = hasAdminCapability(user)
  const [activeTab, setActiveTab] = useState<AdminTab>('Centers')

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab)
    track('admin_tab_changed', { tab, source: 'admin' })
  }

  useEffect(() => {
    if (!loading && !canEnter) {
      router.replace('/(tabs)')
    }
  }, [loading, canEnter])

  // Sevaks only get Moderation — the 'Centers' default hits an admin-only
  // endpoint that 403s for a sevak. Land them on Moderation once auth resolves.
  useEffect(() => {
    if (!loading && canEnter && !isAdmin) {
      setActiveTab('Moderation')
    }
  }, [loading, canEnter, isAdmin])

  if (!loading && !canEnter) {
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
  const isCompact = width < 768

  return (
    <View style={{ flex: 1, flexDirection: isCompact ? 'column' : 'row', backgroundColor: pageBg }}>
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isAdmin={isAdmin}
        compact={isCompact}
      />
      {/* Admin-only tabs are gated by isAdmin so a sevak never mounts a tab
          whose endpoint 403s. Moderation is available to sevak+. */}
      {isAdmin && activeTab === 'Centers' && <CentersTab />}
      {isAdmin && activeTab === 'Events' && <EventsTab />}
      {isAdmin && activeTab === 'Users' && <UsersTab />}
      {isAdmin && activeTab === 'Invite Codes' && <InviteCodesTab />}
      {activeTab === 'Moderation' && <ModerationTab />}
      {isAdmin && activeTab === 'Notifications' && <NotificationsTab />}
    </View>
  )
}

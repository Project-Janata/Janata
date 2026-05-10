import React, { useState } from 'react'
import {
  ScrollView,
  View,
  Pressable,
  Linking,
  Modal,
  Platform,
  Alert,
  useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Eye, Shield, Info, ExternalLink, AlertTriangle } from 'lucide-react-native'
import { useUser, useTheme } from '../../components/contexts'
import { useRouter } from 'expo-router'
import { DestructiveButton, SecondaryButton, Text } from '../../components/ui'
import ThemeSelector from '../../components/ThemeSelector'
import { usePostHog } from 'posthog-react-native'
import Constants from 'expo-constants'

const APP_VERSION = Constants.expoConfig?.version || '0.2.0'

export default function Preferences() {
  const { isDark } = useTheme()
  const { deleteAccount } = useUser()
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const posthog = usePostHog()
  const currentYear = new Date().getFullYear()

  const textColor = isDark ? '#FAFAFA' : '#1C1917'
  const mutedTextColor = isDark ? '#A8A29E' : '#78716C'
  const faintColor = isDark ? '#737373' : '#A8A29E'
  const borderColor = isDark ? '#262626' : '#ECE7DE'
  const cardBg = isDark ? '#262626' : '#FFFFFF'
  const pageBg = isDark ? '#1A1A1A' : '#F5F5F4'
  const iconColor = isDark ? '#A8A29E' : '#78716C'
  const { width: viewportWidth } = useWindowDimensions()
  const isNarrowWeb = Platform.OS === 'web' && viewportWidth < 768
  const webPaddingH = isNarrowWeb ? 16 : viewportWidth < 1024 ? 32 : 60

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteAccount()
      if (result.success) {
        setShowDeleteModal(false)
        router.replace('/auth')
      } else {
        Alert.alert('Error', result.message || 'Failed to delete account')
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete account. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: pageBg }}>
      <View
        style={{
          maxWidth: 900,
          width: '100%',
          alignSelf: 'center',
          padding: isNarrowWeb ? 20 : 40,
          paddingHorizontal: webPaddingH,
          gap: isNarrowWeb ? 24 : 36,
        }}
      >
        {/* Header */}
        <View>
          <Text
            style={{
              fontSize: 30,
              color: textColor,
              letterSpacing: -0.5,
            }}
          >
            Preferences
          </Text>
          <Text style={{ fontSize: 15, color: mutedTextColor, marginTop: 4 }}>
            Manage your app preferences
          </Text>
        </View>

        {/* Appearance Section */}
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Eye size={20} color={iconColor} />
            <Text style={{ fontSize: 17, fontWeight: '600', color: textColor }}>Appearance</Text>
          </View>
          <View
            style={{
              backgroundColor: cardBg,
              borderRadius: 20,
              borderWidth: 1,
              borderColor,
              padding: isNarrowWeb ? 20 : 28,
            }}
          >
            <ThemeSelector />
          </View>
        </View>

        {/* Privacy Section */}
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Shield size={20} color={iconColor} />
            <Text style={{ fontSize: 17, fontWeight: '600', color: textColor }}>Privacy</Text>
          </View>
          <View
            style={{
              backgroundColor: cardBg,
              borderRadius: 20,
              borderWidth: 1,
              borderColor,
              overflow: 'hidden',
            }}
          >
            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: isNarrowWeb ? 20 : 28,
                borderBottomWidth: 1,
                borderBottomColor: borderColor,
              }}
              onPress={() => {
                posthog?.capture('privacy_policy_viewed')
                router.push('/privacy')
              }}
            >
              <Text style={{ fontSize: 15, color: textColor }}>Privacy Policy</Text>
              <ExternalLink size={18} color={iconColor} />
            </Pressable>
            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: isNarrowWeb ? 20 : 28,
                borderBottomWidth: 1,
                borderBottomColor: borderColor,
              }}
              onPress={() => {
                posthog?.capture('terms_viewed')
                router.push('/terms')
              }}
            >
              <Text style={{ fontSize: 15, color: textColor }}>Terms of Service</Text>
              <ExternalLink size={18} color={iconColor} />
            </Pressable>
            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: isNarrowWeb ? 20 : 28,
              }}
              onPress={() => {
                posthog?.capture('cookie_policy_viewed')
                router.push('/cookies')
              }}
            >
              <Text style={{ fontSize: 15, color: textColor }}>Cookie Policy</Text>
              <ExternalLink size={18} color={iconColor} />
            </Pressable>
          </View>
        </View>

        {/* About Section */}
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Info size={20} color={iconColor} />
            <Text style={{ fontSize: 17, fontWeight: '600', color: textColor }}>About</Text>
          </View>
          <View
            style={{
              backgroundColor: cardBg,
              borderRadius: 20,
              borderWidth: 1,
              borderColor,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: isNarrowWeb ? 20 : 28,
                borderBottomWidth: 1,
                borderBottomColor: borderColor,
              }}
            >
              <Text style={{ fontSize: 15, color: textColor }}>Version</Text>
              <Text style={{ fontSize: 14, color: mutedTextColor, textAlign: 'right' }}>
                {APP_VERSION}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: isNarrowWeb ? 20 : 28,
              }}
            >
              <Text style={{ fontSize: 15, color: textColor }}>Chinmaya Janata</Text>
              <Text style={{ fontSize: 14, color: mutedTextColor, textAlign: 'right' }}>
                {currentYear} Chinmaya Mission
              </Text>
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        <View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: isNarrowWeb ? 20 : 28,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: '#FECACA',
              backgroundColor: isDark ? 'rgba(220,38,38,0.1)' : '#FEF2F2',
            }}
          >
            <View style={{ gap: 4, flex: 1, marginRight: 16 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#DC2626' }}>
                Danger Zone
              </Text>
              <Text style={{ fontSize: 13, color: mutedTextColor }}>
                Permanently delete your account and all data
              </Text>
            </View>
            <DestructiveButton
              onPress={() => {
                posthog?.capture('delete_account_started')
                setShowDeleteModal(true)
              }}
            >
              Delete Account
            </DestructiveButton>
          </View>
        </View>
      </View>

      {/* Delete confirmation modal */}
      <Modal
        transparent
        visible={showDeleteModal}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            paddingHorizontal: 24,
          }}
        >
          <View
            style={{
              backgroundColor: cardBg,
              borderRadius: 20,
              padding: 24,
              width: '100%',
              maxWidth: 400,
              borderWidth: 1,
              borderColor: '#FECACA',
            }}
          >
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: isDark ? 'rgba(220,38,38,0.15)' : '#FEE2E2',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <AlertTriangle size={32} color="#DC2626" />
              </View>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: '700',
                  color: textColor,
                  marginBottom: 8,
                }}
              >
                Delete Account?
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  color: mutedTextColor,
                  textAlign: 'center',
                  lineHeight: 22,
                }}
              >
                This action cannot be undone. All your data will be permanently deleted.
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <View style={{ flex: 1 }}>
                <SecondaryButton onPress={() => setShowDeleteModal(false)} disabled={isDeleting}>
                  Cancel
                </SecondaryButton>
              </View>
              <View style={{ flex: 1 }}>
                <DestructiveButton onPress={handleDeleteAccount} disabled={isDeleting} loading={isDeleting}>
                  Delete Forever
                </DestructiveButton>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

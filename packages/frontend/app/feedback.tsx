import React, { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { AlertCircle, Camera, CheckCircle2, MessageSquare, X } from 'lucide-react-native'
import * as ImagePicker from 'expo-image-picker'
import { useUser, useTheme } from '../components/contexts'
import { feedbackClient, validateFeedback } from '../src/feedback/feedbackClient'

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

/**
 * In-app feedback capture (issue #542).
 *
 * The low-friction path for beta testers/admins to report bugs and product
 * feedback. Captures enough context to triage — a description, who to follow
 * up with, the page/flow they came from, the platform, and an optional
 * screenshot — and POSTs it through feedbackClient so the team has one place
 * to review incoming reports.
 */
export default function FeedbackScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ from?: string | string[] }>()
  const { user } = useUser()
  const { isDark } = useTheme()

  const c = useMemo(
    () => ({
      bg: isDark ? '#1A1A1A' : '#F5F5F4',
      card: isDark ? '#262626' : '#FFFFFF',
      surface: isDark ? '#1A1A1A' : '#FAFAF9',
      border: isDark ? '#3A3A3A' : '#E7E5E4',
      text: isDark ? '#FAFAFA' : '#1C1917',
      muted: isDark ? '#A8A29E' : '#78716C',
      accent: '#E8862A',
      success: isDark ? '#34D399' : '#059669',
      successSoft: isDark ? 'rgba(6,95,70,0.2)' : '#ECFDF5',
      error: isDark ? '#F87171' : '#DC2626',
      errorSoft: isDark ? 'rgba(220,38,38,0.15)' : '#FEF2F2',
    }),
    [isDark],
  )

  const fromPage = firstParam(params.from).trim()
  const defaultContact = user?.email || user?.username || ''

  const [description, setDescription] = useState('')
  const [contact, setContact] = useState(defaultContact)
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const isSubmitting = status === 'submitting'

  const handleAttachScreenshot = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permission.granted) return
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.6,
        base64: true,
      })
      if (result.canceled) return
      const asset = result.assets?.[0]
      if (!asset) return
      const uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri
      setScreenshot(uri ?? null)
    } catch {
      // A failed attach shouldn't block the report — the description is enough.
    }
  }

  const handleSubmit = async () => {
    if (isSubmitting) return

    const validation = validateFeedback({ description })
    if (!validation.valid) {
      setStatus('error')
      setErrorMessage(validation.message || 'Please describe what happened before sending.')
      return
    }

    setStatus('submitting')
    setErrorMessage('')

    const result = await feedbackClient.submit({
      description,
      contact: contact.trim() || undefined,
      page: fromPage || undefined,
      screenshot,
      platform: Platform.OS,
    })

    if (result.success) {
      setStatus('success')
    } else {
      setStatus('error')
      setErrorMessage(result.error?.message || 'Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View
          style={{
            width: '100%',
            maxWidth: 420,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 12,
            backgroundColor: c.card,
            padding: 24,
            gap: 16,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: c.successSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={26} color={c.success} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: '700', color: c.text, textAlign: 'center' }}>
            Feedback received — thank you!
          </Text>
          <Text style={{ fontSize: 15, lineHeight: 22, color: c.muted, textAlign: 'center' }}>
            Thanks for helping us make Janata better. The team will take a look at your report.
          </Text>
          <View style={{ width: '100%', gap: 10, marginTop: 4 }}>
            <Pressable
              accessibilityRole="button"
              testID="feedback-send-another"
              onPress={() => {
                setDescription('')
                setScreenshot(null)
                setStatus('idle')
                setErrorMessage('')
              }}
              style={{
                minHeight: 48,
                borderRadius: 8,
                backgroundColor: c.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Send more feedback</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.back()}
              style={{
                minHeight: 44,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: c.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: c.text, fontSize: 15, fontWeight: '600' }}>Done</Text>
            </Pressable>
          </View>
        </View>
      </View>
    )
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ padding: 20, gap: 18, maxWidth: 560, width: '100%', alignSelf: 'center' }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: c.card,
            borderWidth: 1,
            borderColor: c.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MessageSquare size={20} color={c.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: c.text }}>Send feedback</Text>
          <Text style={{ fontSize: 14, lineHeight: 20, color: c.muted }}>
            Hit a bug or have an idea? Tell us what happened.
          </Text>
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: c.muted }}>What happened?</Text>
        <TextInput
          testID="feedback-description"
          value={description}
          onChangeText={(text) => {
            setDescription(text)
            if (status === 'error') {
              setStatus('idle')
              setErrorMessage('')
            }
          }}
          placeholder="Describe the bug or feedback. The more detail, the easier it is to fix."
          placeholderTextColor={c.muted}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          editable={!isSubmitting}
          style={{
            minHeight: 130,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 10,
            backgroundColor: c.card,
            padding: 14,
            fontSize: 15,
            lineHeight: 21,
            color: c.text,
          }}
        />
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: c.muted }}>
          Contact (so we can follow up)
        </Text>
        <TextInput
          testID="feedback-contact"
          value={contact}
          onChangeText={setContact}
          placeholder="you@example.com"
          placeholderTextColor={c.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!isSubmitting}
          style={{
            minHeight: 46,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 10,
            backgroundColor: c.card,
            paddingHorizontal: 14,
            fontSize: 15,
            color: c.text,
          }}
        />
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: c.muted }}>Screenshot (optional)</Text>
        {screenshot ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ flex: 1, fontSize: 14, color: c.text }}>Screenshot attached</Text>
            <Pressable
              accessibilityRole="button"
              testID="feedback-remove-screenshot"
              onPress={() => setScreenshot(null)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <X size={16} color={c.muted} />
              <Text style={{ fontSize: 14, color: c.muted }}>Remove</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            testID="feedback-attach-screenshot"
            onPress={handleAttachScreenshot}
            disabled={isSubmitting}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              minHeight: 46,
              borderRadius: 10,
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: c.border,
              backgroundColor: c.card,
            }}
          >
            <Camera size={18} color={c.muted} />
            <Text style={{ fontSize: 14, color: c.muted }}>Attach a screenshot</Text>
          </Pressable>
        )}
      </View>

      {status === 'error' && errorMessage ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            borderWidth: 1,
            borderColor: c.error,
            backgroundColor: c.errorSoft,
            borderRadius: 10,
            padding: 12,
          }}
        >
          <AlertCircle size={18} color={c.error} />
          <Text style={{ flex: 1, fontSize: 14, color: c.error }}>{errorMessage}</Text>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        testID="feedback-submit"
        onPress={handleSubmit}
        disabled={isSubmitting}
        style={{
          minHeight: 50,
          borderRadius: 10,
          backgroundColor: c.accent,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 10,
          opacity: isSubmitting ? 0.7 : 1,
        }}
      >
        {isSubmitting ? (
          <ActivityIndicator testID="feedback-submitting" color="#FFFFFF" />
        ) : null}
        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
          {isSubmitting ? 'Sending…' : status === 'error' ? 'Try again' : 'Send feedback'}
        </Text>
      </Pressable>
    </ScrollView>
  )
}

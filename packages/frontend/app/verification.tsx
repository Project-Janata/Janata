import React from 'react'
import { ScrollView, View, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { Ticket, Building2, ShieldCheck, MessageCircle } from 'lucide-react-native'
import { Text, StackHeader } from '../components/ui'
import { useColors } from '../hooks/useColors'

// Real "how to get verified" explainer (#341). The verification/invites area
// previously pointed at a placeholder page that 404'd; this is the live target.
export default function VerificationScreen() {
  const router = useRouter()
  const c = useColors()

  const ways = [
    {
      icon: Ticket,
      title: 'Join with an invite link',
      body: 'When a verified member shares their invite link with you and you sign up through it, you are verified automatically — no extra steps.',
    },
    {
      icon: Building2,
      title: 'Ask your center',
      body: 'A coordinator or admin at your Chinmaya center can verify you directly. Reach out to them and let them know your name and email.',
    },
  ]

  const unlocks = [
    'Post and reply on your center and event boards',
    'RSVP to events and see who else is going',
    'Message other members',
  ]

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StackHeader title="How verification works" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ width: '100%', maxWidth: 640, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 48, gap: 24 }}
      >
        <View style={{ gap: 8 }}>
          <View style={{ width: 48, height: 48, borderRadius: 15, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={24} color={c.accent} />
          </View>
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 22, color: c.text }}>
            Janata is a verified community
          </Text>
          <Text style={{ fontSize: 15, lineHeight: 22, color: c.textMuted }}>
            Verification keeps Janata a trusted space for Chinmaya members. There are two ways to get verified.
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          {ways.map((w, i) => {
            const Icon = w.icon
            return (
              <View
                key={i}
                style={{ flexDirection: 'row', gap: 14, borderRadius: 18, borderWidth: 1, borderColor: c.border, backgroundColor: c.card, padding: 16 }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={19} color={c.accent} />
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 16, color: c.text }}>{w.title}</Text>
                  <Text style={{ fontSize: 14, lineHeight: 20, color: c.textMuted }}>{w.body}</Text>
                </View>
              </View>
            )
          })}
        </View>

        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 12, letterSpacing: 0.9, color: c.textFaint }}>WHAT VERIFICATION UNLOCKS</Text>
          <View style={{ borderRadius: 18, borderWidth: 1, borderColor: c.border, backgroundColor: c.card, padding: 16, gap: 12 }}>
            {unlocks.map((u, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <MessageCircle size={16} color={c.accent} />
                <Text style={{ flex: 1, fontSize: 14.5, lineHeight: 20, color: c.text }}>{u}</Text>
              </View>
            ))}
          </View>
        </View>

        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.push('/' as never))}
          accessibilityRole="button"
          style={{ backgroundColor: c.accent, borderRadius: 14, paddingVertical: 15, alignItems: 'center' }}
        >
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>Got it</Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}

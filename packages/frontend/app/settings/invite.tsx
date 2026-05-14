import { View, Text, Share, Pressable, Platform } from 'react-native'
import { useState, useEffect } from 'react'
import {
  UserPlus,
  Link as LinkIcon,
  Check,
  Clock,
  MessageCircle,
  Mail,
  EllipsisIcon,
} from 'lucide-react-native'
import { FontAwesome5 } from '@expo/vector-icons'
import { useUser } from '../../components/contexts'
import { StackHeader, GradientIconBadge, Card, IconBadge } from '../../components/ui'
import { fetchCenters } from '../../utils/api'
import { useColors } from '../../hooks/useColors'

const MONO_FONT = Platform.select({
  ios: 'JetBrains Mono',
  android: 'monospace',
  default: 'monospace',
})

export default function InviteScreen() {
  const { user } = useUser()
  const c = useColors()
  const [centerName, setCenterName] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [pressing, setPressing] = useState(false)

  const inviteCode = (user as any)?.inviteCode as string | undefined
  const inviteUrl = inviteCode ? `https://janata.app/i/${inviteCode}` : null

  useEffect(() => {
    if (!user) return
    fetchCenters()
      .then((centers: any[]) => {
        const center = centers.find((c) => c.centerID === user.centerID)
        setCenterName(center?.name ?? null)
      })
      .catch(() => {})
  }, [user])

  const handleCopy = () => {
    if (!inviteUrl) return
    Share.share({ message: inviteUrl })
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StackHeader title="Invite Friends" />
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingTop: 48,
          paddingHorizontal: 20,
        }}
      >
        <GradientIconBadge size={96}>
          <UserPlus size={40} color="#fff" strokeWidth={2} />
        </GradientIconBadge>
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 32, color: c.text, marginTop: 16 }}>
          Bring a friend
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: c.textMuted,
            marginTop: 8,
            textAlign: 'center',
            lineHeight: 22,
          }}
        >
          They'll see your name and skip verification at{' '}
          <Text style={{ fontWeight: 'bold', color: c.textMuted }}>
            {centerName ?? 'your center'}
          </Text>
          .
        </Text>

        <Card padding="sm" style={{ marginTop: 32, width: '100%', borderColor: c.border }}>
          <Text style={{ fontSize: 11, letterSpacing: 0.9, color: c.textFaint, marginBottom: 10 }}>
            YOUR INVITE LINK
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: c.surface,
              borderRadius: 8,
              paddingVertical: 10,
              paddingHorizontal: 12,
            }}
          >
            <LinkIcon size={16} color={c.accent} />
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{ flex: 1, fontFamily: MONO_FONT, fontSize: 13, color: c.text }}
            >
              janata.app/i/{inviteCode ?? 'your-code-here'}
            </Text>
            <Pressable
              onPress={handleCopy}
              onPressIn={() => setPressing(true)}
              onPressOut={() => setPressing(false)}
              disabled={!inviteUrl}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 6,
                backgroundColor: copied ? c.accentSoft : pressing ? c.accentPress : c.accent,
                opacity: !inviteUrl ? 0.4 : 1,
              }}
            >
              {copied ? (
                <Check size={14} color={c.accent} strokeWidth={2.5} />
              ) : (
                <Text style={{ fontSize: 13, color: '#fff', fontWeight: '600' }}>Share</Text>
              )}
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
            <Clock size={14} color={c.textFaint} />
            <Text style={{ fontSize: 12, color: c.textMuted }}>
              Expires in 7 days • 8 uses left
            </Text>
          </View>
        </Card>
        <View style={{ height: 32 }} />
        <Text
          style={{
            fontSize: 11,
            letterSpacing: 0.9,
            color: c.textFaint,
            marginBottom: 10,
            alignSelf: 'flex-start',
          }}
        >
          SHARE VIA
        </Text>
        <View
          style={{ flexDirection: 'row', gap: 36, alignItems: 'flex-start', alignSelf: 'center' }}
        >
          <View style={{ gap: 8, alignItems: 'center' }}>
            <IconBadge size={56} color="#5ec26a">
              <MessageCircle size={32} color="#fff" strokeWidth={2} />
            </IconBadge>
            <Text style={{ fontSize: 12, color: c.text, fontWeight: '500' }}>Messages</Text>
          </View>
          <View style={{ gap: 8, alignItems: 'center' }}>
            <IconBadge size={56} color="#25D366">
              <FontAwesome5 name="whatsapp" size={32} color="#fff" />
            </IconBadge>
            <Text style={{ fontSize: 12, color: c.text, fontWeight: '500' }}>WhatsApp</Text>
          </View>
          <View style={{ gap: 8, alignItems: 'center' }}>
            <IconBadge size={56} color="#4d81ee">
              <Mail size={32} color="#fff" strokeWidth={2} />
            </IconBadge>
            <Text style={{ fontSize: 12, color: c.text, fontWeight: '500' }}>Email</Text>
          </View>
          <Pressable
            style={{ gap: 8, alignItems: 'center' }}
            onPress={() => Share.share({ message: inviteUrl ?? '' })}
          >
            <IconBadge size={56} color="#6c757d">
              <EllipsisIcon size={32} color="#fff" strokeWidth={2} />
            </IconBadge>
            <Text style={{ fontSize: 12, color: c.text, fontWeight: '500' }}>Other</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

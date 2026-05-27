import { View, Text, ScrollView } from 'react-native'
import { useColors } from '../hooks/useColors'

export default function PrivacyPolicy() {
  const c = useColors()
  const bg = c.surface
  const heading = c.text
  const body = c.textSecondary
  const muted = c.textMuted
  const border = c.border

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ padding: 24, maxWidth: 800, alignSelf: 'center' }}>
        <Text style={{ fontSize: 36, fontWeight: 'bold', marginBottom: 8, color: heading }}>
          Privacy Policy
        </Text>
        <Text style={{ fontSize: 14, color: muted, marginBottom: 32 }}>
          Last updated: March 2026
        </Text>

        <Text style={{ fontSize: 15, color: body, lineHeight: 24, marginBottom: 24 }}>
          Chinmaya Janata ("we," "our," or "us") operates the Chinmaya Janata mobile application and website. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
        </Text>

        <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12, color: heading }}>
          1. Information We Collect
        </Text>
        <Text style={{ fontSize: 15, color: body, lineHeight: 24, marginBottom: 8 }}>
          <Text style={{ fontWeight: '600' }}>Personal Information you provide:</Text>
        </Text>
        <Text style={{ fontSize: 15, color: body, lineHeight: 24, paddingLeft: 12 }}>
          • Account credentials (username, password){'\n'}
          • Name (first name, last name){'\n'}
          • Email address{'\n'}
          • Phone number{'\n'}
          • Date of birth{'\n'}
          • Profile picture (optional){'\n'}
          • Personal interests (optional){'\n'}
          • Center affiliation
        </Text>

        <Text style={{ fontSize: 15, color: body, lineHeight: 24, marginTop: 12, marginBottom: 8 }}>
          <Text style={{ fontWeight: '600' }}>Information collected automatically:</Text>
        </Text>
        <Text style={{ fontSize: 15, color: body, lineHeight: 24, paddingLeft: 12 }}>
          • Device information (device type, operating system, unique device identifiers){'\n'}
          • Location data (approximate location for finding nearby centers){'\n'}
          • Usage data (features used, event registrations){'\n'}
          • Cookies and similar tracking technologies
        </Text>

        <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12, color: heading }}>
          2. How We Use Your Information
        </Text>
        <Text style={{ fontSize: 15, color: body, lineHeight: 24 }}>
          We use the information we collect to provide, maintain, and improve our services, create and manage your account, connect you with nearby Chinmaya Mission centers, facilitate event registration, send updates about events at your center, personalize your experience, authenticate your identity, respond to your questions, and comply with legal obligations.
        </Text>

        <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12, color: heading }}>
          3. Information Sharing
        </Text>
        <Text style={{ fontSize: 15, color: body, lineHeight: 24, marginBottom: 8 }}>
          <Text style={{ fontWeight: '600' }}>We do NOT sell your personal information.</Text> We may share information with center coordinators (for community management), service providers (cloud hosting), and legal authorities when required.
        </Text>

        <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12, color: heading }}>
          4. Data Security
        </Text>
        <Text style={{ fontSize: 15, color: body, lineHeight: 24 }}>
          We implement appropriate technical and organizational security measures. Passwords are hashed using PBKDF2-SHA256. Data is encrypted in transit (TLS 1.3). Access controls are in place on database systems.
        </Text>

        <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12, color: heading }}>
          5. Your Rights
        </Text>
        <Text style={{ fontSize: 15, color: body, lineHeight: 24 }}>
          You have the right to access, rectification, erasure, portability, and objection regarding your personal information. To exercise these rights, use the account settings in the app or contact us at info@chinmayajanata.org.
        </Text>

        <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12, color: heading }}>
          6. Location Services
        </Text>
        <Text style={{ fontSize: 15, color: body, lineHeight: 24 }}>
          We use your location to find nearby Chinmaya Mission centers and events. Location data is collected only when you explicitly use location-based features. You can disable location services in your device settings.
        </Text>

        <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12, color: heading }}>
          7. Children's Privacy
        </Text>
        <Text style={{ fontSize: 15, color: body, lineHeight: 24 }}>
          Our service is intended for users of all ages. For users under 18, we recommend parental guidance. We do not knowingly collect personal information from children under 13 without parental consent.
        </Text>

        <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12, color: heading }}>
          8. Contact Us
        </Text>
        <Text style={{ fontSize: 15, color: body, lineHeight: 24 }}>
          If you have any questions about this Privacy Policy, please contact us:{'\n'}
          Email: info@chinmayajanata.org{'\n'}
          Website: chinmayajanata.org{'\n'}
          Address: Chinmaya Mission West, 83900 Highway 271, Piercy, CA 95587{'\n'}
          Phone: 707-247-3488
        </Text>

        <View style={{ marginTop: 48, paddingTop: 24, borderTopWidth: 1, borderTopColor: border }}>
          <Text style={{ fontSize: 13, color: muted }}>
            © 2026 Chinmaya Janata. Built with love by CHYKs.
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}

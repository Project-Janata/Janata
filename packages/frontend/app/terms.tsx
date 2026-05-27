import { View, Text, ScrollView } from 'react-native'
import { useColors } from '../hooks/useColors'

export default function TermsOfService() {
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
          Terms of Service
        </Text>
        <Text style={{ fontSize: 14, color: muted, marginBottom: 32 }}>
          Last updated: March 2026
        </Text>

        <Text style={{ fontSize: 15, color: body, lineHeight: 24, marginBottom: 24 }}>
          Please read these Terms of Service ("Terms") carefully before using the Chinmaya Janata mobile application and website. By accessing or using the Service, you agree to be bound by these Terms.
        </Text>

        <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12, color: heading }}>
          1. Acceptance of Terms
        </Text>
        <Text style={{ fontSize: 15, color: body, lineHeight: 24 }}>
          By creating an account or using the Service, you affirm that you are at least 13 years of age and agree to be bound by these Terms and our Privacy Policy. If you are under 18, you represent that you have parental or guardian consent.
        </Text>

        <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12, color: heading }}>
          2. Description of Service
        </Text>
        <Text style={{ fontSize: 15, color: body, lineHeight: 24 }}>
          Chinmaya Janata is a mobile and web platform that connects users with Chinmaya Mission centers worldwide, facilitates event discovery and registration, and supports community engagement among devotees and spiritual seekers.
        </Text>

        <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12, color: heading }}>
          3. User Accounts
        </Text>
        <Text style={{ fontSize: 15, color: body, lineHeight: 24 }}>
          To use the Service, you must create an account. You agree to provide accurate information, maintain the security of your credentials, accept responsibility for all activities under your account, and notify us immediately of any unauthorized access.
        </Text>

        <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12, color: heading }}>
          4. User Conduct
        </Text>
        <Text style={{ fontSize: 15, color: body, lineHeight: 24 }}>
          You agree NOT to use the Service to violate any applicable laws, infringe on intellectual property rights, post harmful or inappropriate content, harass others, spam, transmit viruses, attempt unauthorized access, or use the Service for any unlawful purpose.
        </Text>

        <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12, color: heading }}>
          5. Content and Intellectual Property
        </Text>
        <Text style={{ fontSize: 15, color: body, lineHeight: 24 }}>
          You retain ownership of content you submit. By submitting content, you grant us a license to use it as necessary to provide our services. The Service and its original content are owned by Chinmaya Mission West and are protected by copyright and trademark laws. Religious and spiritual content is provided for educational and devotional purposes.
        </Text>

        <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12, color: heading }}>
          6. Event Registration
        </Text>
        <Text style={{ fontSize: 15, color: body, lineHeight: 24 }}>
          When you register for events, you agree to attend or cancel in advance. Your attendance may be visible to event organizers and other attendees. We are not responsible for event cancellations or changes.
        </Text>

        <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12, color: heading }}>
          7. Disclaimer of Warranties
        </Text>
        <Text style={{ fontSize: 15, color: body, lineHeight: 24 }}>
          THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE." WE MAKE NO WARRANTIES, EXPRESS OR IMPLIED. WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
        </Text>

        <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12, color: heading }}>
          8. Limitation of Liability
        </Text>
        <Text style={{ fontSize: 15, color: body, lineHeight: 24 }}>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
        </Text>

        <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12, color: heading }}>
          9. Termination
        </Text>
        <Text style={{ fontSize: 15, color: body, lineHeight: 24 }}>
          We may terminate or suspend your account immediately for any reason, including breach of these Terms, inactivity, or legal requirements.
        </Text>

        <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12, color: heading }}>
          10. Governing Law
        </Text>
        <Text style={{ fontSize: 15, color: body, lineHeight: 24 }}>
          These Terms shall be governed by and construed in accordance with the laws of the State of California, United States.
        </Text>

        <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12, color: heading }}>
          11. Contact Us
        </Text>
        <Text style={{ fontSize: 15, color: body, lineHeight: 24 }}>
          For questions about these Terms, please contact us:{'\n'}
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

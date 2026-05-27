import { View, Text, ScrollView } from 'react-native'

export function CookiePolicy() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      <View style={{ padding: 24, maxWidth: 800, alignSelf: 'center' }}>
        <Text style={{ fontSize: 36, fontWeight: 'bold', marginBottom: 8, color: '#1C1917' }}>
          Cookie Policy
        </Text>
        <Text style={{ fontSize: 14, color: '#78716C', marginBottom: 32 }}>
          Last updated: March 2026
        </Text>

        <Text style={{ fontSize: 15, color: '#44403C', lineHeight: 24, marginBottom: 24 }}>
          This Cookie Policy explains what Cookies are and how Chinmaya Janata ("we," "our," or "us") uses them on our mobile application and website.
        </Text>

        <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12, color: '#1C1917' }}>
          1. What Are Cookies
        </Text>
        <Text style={{ fontSize: 15, color: '#44403C', lineHeight: 24 }}>
          Cookies are small text files stored on your device when you visit websites or use applications. They help remember your preferences, analyze site traffic, and enhance your user experience.
        </Text>

        <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12, color: '#1C1917' }}>
          2. Types of Cookies We Use
        </Text>
        
        <Text style={{ fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 8, color: '#1C1917' }}>
          2.1 Essential Cookies
        </Text>
        <Text style={{ fontSize: 15, color: '#44403C', lineHeight: 24 }}>
          These cookies are necessary for the Service to function. They enable authentication, session management, and security features. Without these cookies, you cannot access the Service.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 8, color: '#1C1917' }}>
          2.2 Functional Cookies
        </Text>
        <Text style={{ fontSize: 15, color: '#44403C', lineHeight: 24 }}>
          These cookies remember your preferences and settings, such as your selected center, theme preferences, and language settings. They help personalize your experience.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 8, color: '#1C1917' }}>
          2.3 Analytics Cookies
        </Text>
        <Text style={{ fontSize: 15, color: '#44403C', lineHeight: 24 }}>
          We use analytics cookies to understand how users interact with our Service. These cookies collect anonymous information about page visits, feature usage, and error reports. This helps us improve the Service.
        </Text>

        <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12, color: '#1C1917' }}>
          3. Cookie List
        </Text>
        <Text style={{ fontSize: 15, color: '#44403C', lineHeight: 24, marginBottom: 8 }}>
          The specific cookies we use include:
        </Text>
        <Text style={{ fontSize: 15, color: '#44403C', lineHeight: 24, paddingLeft: 12 }}>
          <Text style={{ fontWeight: '600' }}>Session Token:</Text> Authenticates your login session{'\n'}
          <Text style={{ fontWeight: '600' }}>Refresh Token:</Text> Extends your session without re-authentication{'\n'}
          <Text style={{ fontWeight: '600' }}>Preferences:</Text> Stores your center selection and theme settings{'\n'}
          <Text style={{ fontWeight: '600' }}>Analytics:</Text> Anonymous usage statistics for service improvement
        </Text>

        <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12, color: '#1C1917' }}>
          4. Managing Cookies
        </Text>
        <Text style={{ fontSize: 15, color: '#44403C', lineHeight: 24, marginBottom: 8 }}>
          You can control or disable cookies through your browser or device settings:
        </Text>
        <Text style={{ fontSize: 15, color: '#44403C', lineHeight: 24, paddingLeft: 12 }}>
          • <Text style={{ fontWeight: '600' }}>Browser Settings:</Text> Most browsers allow you to view, delete, or block cookies{'\n'}
          • <Text style={{ fontWeight: '600' }}>Device Settings:</Text> Mobile devices may have privacy settings that control tracking{'\n'}
          • <Text style={{ fontWeight: '600' }}>Third-Party Tools:</Text> You can opt out of analytics tracking
        </Text>
        <Text style={{ fontSize: 15, color: '#44403C', lineHeight: 24, marginTop: 8 }}>
          Note: Blocking essential cookies may prevent the Service from functioning properly.
        </Text>

        <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12, color: '#1C1917' }}>
          5. Local Storage
        </Text>
        <Text style={{ fontSize: 15, color: '#44403C', lineHeight: 24 }}>
          In addition to cookies, we use local storage to save your authentication tokens and preferences on your device. This works similarly to cookies but is specific to the application.
        </Text>

        <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12, color: '#1C1917' }}>
          6. Third-Party Cookies
        </Text>
        <Text style={{ fontSize: 15, color: '#44403C', lineHeight: 24 }}>
          We do not use third-party advertising cookies. We use analytics cookies to understand how the Service is used: Cloudflare for security and performance, PostHog for product analytics, and Google Analytics for search and referrer tracking. Google Analytics is configured with IP anonymization. None of these analytics partners receive your phone number, address, or other directly identifying personal data.
        </Text>

        <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12, color: '#1C1917' }}>
          7. Updates to This Policy
        </Text>
        <Text style={{ fontSize: 15, color: '#44403C', lineHeight: 24 }}>
          We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated "Last updated" date.
        </Text>

        <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12, color: '#1C1917' }}>
          8. Contact Us
        </Text>
        <Text style={{ fontSize: 15, color: '#44403C', lineHeight: 24 }}>
          If you have questions about our use of cookies, please contact us at:{'\n'}
          Email: info@chinmayajanata.org{'\n'}
          Address: Chinmaya Mission West, P.O. Box 129, Piercy, CA 95587
        </Text>

        <View style={{ marginTop: 48, paddingTop: 24, borderTopWidth: 1, borderTopColor: '#E7E5E4' }}>
          <Text style={{ fontSize: 13, color: '#A8A29E' }}>
            © 2026 Chinmaya Janata. Built with love by CHYKs.
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}

import React from 'react'
import { ScrollView, Platform } from 'react-native'

// Prevent overscroll bounce on web
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.documentElement.style.overscrollBehavior = 'none'
  document.body.style.overscrollBehavior = 'none'
}
import { NavBar } from '../components/landing/NavBar'
import { Hero } from '../components/landing/Hero'
import { AppPreview } from '../components/landing/AppPreview'
import { ProblemSection } from '../components/landing/ProblemSection'
import { CommunitySection } from '../components/landing/CommunitySection'
import { FinalCTA } from '../components/landing/FinalCTA'
import { Footer } from '../components/landing/Footer'
import { SeoHead } from '../components/seo/SeoHead'
import { buildOrganizationJsonLd } from '../components/seo/jsonLd'

export default function LandingPage() {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#FAFAF7' }}
      contentContainerStyle={{ minHeight: '100%' }}
      bounces={false}
      overScrollMode="never"
    >
      <SeoHead
        title="Chinmaya Janata — Connect with your Chinmaya community"
        exactTitle
        description="Chinmaya Janata brings the worldwide Chinmaya Mission community together. Find nearby centers, discover upcoming events, and connect with fellow members."
        path="/"
        jsonLd={buildOrganizationJsonLd()}
      />
      <NavBar />
      <Hero />
      <ProblemSection />
      <AppPreview />
      <CommunitySection />
      <FinalCTA />
      <Footer />
    </ScrollView>
  )
}

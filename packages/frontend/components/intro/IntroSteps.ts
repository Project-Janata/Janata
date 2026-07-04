/**
 * IntroSteps.ts
 *
 * Card definitions for the pre-auth "What is Janata" first-timer explainer.
 * Copy is the short, warm elevator pitch. Visuals are Microsoft Fluent Emoji
 * 3D renders (MIT licensed) under assets/images/onboarding, shown over a warm
 * radial glow.
 */
import type { ImageSourcePropType } from 'react-native'

export type IntroStep = {
  /** 3D object render shown above the title (over a warm glow). */
  image: ImageSourcePropType
  /** Short, punchy headline. */
  title: string
  /** Supporting paragraph. */
  body: string
}

export const INTRO_STEPS: IntroStep[] = [
  {
    image: require('../../assets/images/onboarding/compass.png'),
    title: 'Find your center. Grow together.',
    body: 'Discover centers and events near you, RSVP in a tap, and connect with the community beyond your group chat.',
  },
  {
    image: require('../../assets/images/onboarding/worldmap.png'),
    title: '50+ centers, in one place.',
    body: 'Events used to be scattered across WhatsApp, email, and flyers. Janata puts every center and event on one map.',
  },
  {
    image: require('../../assets/images/onboarding/diya.png'),
    title: 'Made by sevaks. Run by CHYKs.',
    body: 'Janata is volunteer-led, built and run by CHYKs across centers. Join, discover events, and help your community grow.',
  },
]

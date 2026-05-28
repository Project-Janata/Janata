/**
 * IntroSteps.ts
 *
 * Card definitions for the pre-auth "What is Janata" first-timer explainer.
 * Copy is the verbatim elevator pitch — kept short, warm, and on-brand.
 */

export type IntroStep = {
  /** Decorative emoji shown above the title. */
  emoji: string
  /** Short, punchy headline. */
  title: string
  /** Supporting paragraph. */
  body: string
}

export const INTRO_STEPS: IntroStep[] = [
  {
    emoji: '🧭',
    title: 'Find your center. Grow together.',
    body: 'One place where any CHYK can find events and centers nearby, RSVP in a tap, and connect with the community — beyond your group chat.',
  },
  {
    emoji: '🗺️',
    title: '50+ centers, finally in one place.',
    body: 'Events used to be scattered across WhatsApp, email, and flyers. Janata puts every center and event on one map every CHYK is checking.',
  },
  {
    emoji: '🪔',
    title: 'Made by sevaks. Run by CHYKs.',
    body: 'Janata is volunteer-led — built and maintained entirely by CHYKs across centers. Join, discover events, and help your community grow.',
  },
]

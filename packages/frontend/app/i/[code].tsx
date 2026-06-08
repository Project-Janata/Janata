import { Redirect, useLocalSearchParams } from 'expo-router'

// Deep-link alias: janata.app/i/CODE opens the app with this path.
// Hand off to the canonical invite route so all logic stays in one place.
export default function InviteShortLink() {
  const { code } = useLocalSearchParams<{ code: string }>()
  return <Redirect href={`/invite/${typeof code === 'string' ? code : ''}`} />
}

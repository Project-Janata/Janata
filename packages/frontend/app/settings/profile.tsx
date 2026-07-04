import { Redirect } from 'expo-router'

// Profile now lives as the top section of the combined Settings page.
// This route used to 404 (#346); redirect any /settings/profile link there.
export default function SettingsProfileRedirect() {
  return <Redirect href="/settings" />
}

import { Redirect, useLocalSearchParams } from 'expo-router'

/**
 * Legacy invite path. Keep old chinmayajanata.org/invite/CODE links working,
 * but canonical minted/share/deep links use /i/CODE.
 */
export default function LegacyInviteLink() {
  const { code } = useLocalSearchParams<{ code: string }>()
  return <Redirect href={`/i/${typeof code === 'string' ? code : ''}`} />
}

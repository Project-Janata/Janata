import { useMemo } from 'react'
import { useTheme } from '../components/contexts'
import { LIGHT, DARK, type AppColors } from '../tokens'

export function useColors(): AppColors {
  const { isDark } = useTheme()
  return useMemo(() => (isDark ? DARK : LIGHT), [isDark])
}

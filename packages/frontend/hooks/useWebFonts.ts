import { useEffect, useState } from 'react'
import { Platform } from 'react-native'

/**
 * Custom hook for loading fonts on web using CSS font loading
 * This is a web-specific alternative to expo-font
 */
export function useWebFonts() {
  const [loaded, setLoaded] = useState(Platform.OS !== 'web')
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return
    }

    // Check if fonts are already loaded - production safe
    if (document?.fonts && document.fonts.check) {
      const checkFonts = async () => {
        try {
          // Check if our main font is loaded
          const isLoaded = document.fonts.check('16px "Inclusive Sans"')
          if (isLoaded) {
            setLoaded(true)
            return
          }

          // Wait for fonts to load
          await document.fonts.ready
          setLoaded(true)
        } catch (err) {
          setError(err as Error)
          setLoaded(true) // Fallback to loaded state
        }
      }

      checkFonts()
    } else {
      // Fallback for browsers without Font Loading API
      setTimeout(() => setLoaded(true), 100)
    }
  }, [])

  return [loaded, error] as const
}

import { useEffect, useRef, useState } from 'react'
import { Animated, Image, StyleSheet, useColorScheme } from 'react-native'
import { supportsNativeDriver } from '../utils/animation'

export function SplashOverlay({ isReady }: { isReady: boolean }) {
  const isDark = useColorScheme() === 'dark'
  const [hidden, setHidden] = useState(false)
  const opacity = useRef(new Animated.Value(1)).current
  const readyFlags = useRef({ appReady: false, minTime: false })
  const animatingOut = useRef(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      readyFlags.current.minTime = true
      tryFadeOut()
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isReady) {
      readyFlags.current.appReady = true
      tryFadeOut()
    }
  }, [isReady])

  function tryFadeOut() {
    if (animatingOut.current) return
    if (!readyFlags.current.appReady || !readyFlags.current.minTime) return
    animatingOut.current = true
    Animated.timing(opacity, {
      toValue: 0,
      duration: 400,
      useNativeDriver: supportsNativeDriver,
    }).start(() => setHidden(true))
  }

  if (hidden) return null

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, { backgroundColor: isDark ? '#121212' : '#ffffff', opacity }]}
    >
      <Image
        source={require('../assets/images/logo_with_text.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 260,
    height: 100,
  },
})

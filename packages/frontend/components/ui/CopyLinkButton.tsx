/**
 * CopyLinkButton — small inline button that copies a public link to the
 * clipboard and briefly flips its label to "Copied!".
 *
 * Login isn't required to view event/center detail pages, so the URL
 * shared from this button works for any recipient.
 */
import React, { useState, useCallback } from 'react'
import { Pressable, Text, View } from 'react-native'
import { Link2, Check } from 'lucide-react-native'

const FALLBACK_ORIGIN = 'https://chinmayajanata.org'

function buildShareUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${cleanPath}`
  }
  return `${FALLBACK_ORIGIN}${cleanPath}`
}

type CopyLinkButtonProps = {
  /** URL path, e.g. `/events/abc` or `/center/xyz`. */
  path: string
  /** Optional override for label color when not in copied state. */
  color?: string
  /** "icon" = round icon-only button, "inline" = icon + label. Default "inline". */
  variant?: 'icon' | 'inline'
}

export default function CopyLinkButton({ path, color = '#78716C', variant = 'inline' }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false)

  const handlePress = useCallback(async () => {
    const url = buildShareUrl(path)
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
      } else {
        // No clipboard API (likely older mobile webviews). Fall back to a
        // textarea selection trick so the action still works.
        if (typeof document !== 'undefined') {
          const ta = document.createElement('textarea')
          ta.value = url
          ta.style.position = 'fixed'
          ta.style.opacity = '0'
          document.body.appendChild(ta)
          ta.select()
          document.execCommand('copy')
          document.body.removeChild(ta)
        }
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Silently swallow — the user can still copy from the URL bar.
    }
  }, [path])

  if (variant === 'icon') {
    return (
      <Pressable
        onPress={handlePress}
        style={{
          padding: 8,
          minHeight: 44,
          minWidth: 44,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        accessibilityLabel={copied ? 'Link copied' : 'Copy link'}
      >
        {copied ? <Check size={18} color="#16A34A" /> : <Link2 size={18} color={color} />}
      </Pressable>
    )
  }

  return (
    <Pressable
      onPress={handlePress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        minHeight: 32,
      }}
      accessibilityLabel={copied ? 'Link copied' : 'Copy link'}
    >
      {copied ? (
        <>
          <Check size={14} color="#16A34A" />
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: '#16A34A' }}>Copied</Text>
        </>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Link2 size={14} color={color} />
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color }}>Copy link</Text>
        </View>
      )}
    </Pressable>
  )
}

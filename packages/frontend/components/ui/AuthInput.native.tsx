import React, { useState } from 'react'
import { TextInput, type TextInputProps } from 'react-native'
import { useColors } from '../../hooks/useColors'

export default function AuthInput({ secureTextEntry, onChangeText, style, ...props }: TextInputProps) {
  const c = useColors()
  const [focused, setFocused] = useState(false)

  return (
    <TextInput
      secureTextEntry={secureTextEntry}
      onChangeText={onChangeText}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholderTextColor={c.textFaint}
      style={[
        {
          width: '100%',
          fontSize: 16,
          letterSpacing: secureTextEntry ? 0.125 : 0,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          minHeight: 48,
          backgroundColor: c.surface,
          color: c.text,
          borderWidth: 1.5,
          borderColor: focused ? c.accent : 'transparent',
        },
        style,
      ]}
      {...props}
    />
  )
}

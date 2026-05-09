import { TextInput } from 'react-native'
import { useState } from 'react'

export default function AuthInput({ secureTextEntry, onChangeText, ...props }) {
  const [hasText, setHasText] = useState(false)

  const handleChangeText = (text) => {
    setHasText(text.length > 0)
    onChangeText?.(text)
  }

  return (
    <TextInput
      className={`w-full font-sans rounded-lg px-4 py-3 min-h-[48px] bg-stone-100 dark:bg-stone-800 focus:border-primary focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-400 ${
        hasText ? 'text-content dark:text-content-dark' : ''
      }`}
      placeholderTextColor="#9ca3af"
      secureTextEntry={secureTextEntry}
      onChangeText={handleChangeText}
      style={{
        fontSize: 16,
        fontFamily: 'Inclusive Sans',
        letterSpacing: secureTextEntry ? 0.125 : 0,
      }}
      {...props}
    />
  )
}

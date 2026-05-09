import React from 'react'

interface PrimaryButtonProps {
  children: React.ReactNode
  onPress?: () => void
  disabled?: boolean
  loading?: boolean
  style?: any
  className?: string
}

export default function PrimaryButton({
  children,
  onPress,
  disabled,
  loading,
  style,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading

  const handleClick = (e: any) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (!isDisabled && onPress) {
      onPress()
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className="bg-primary px-4 py-3 rounded-full active:bg-primary-press disabled:opacity-50 cursor-pointer w-full"
      style={{ border: 'none', outline: 'none', ...style }}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </span>
      ) : (
        <span className="text-white font-sans text-base leading-4 text-center block">
          {children}
        </span>
      )}
    </button>
  )
}

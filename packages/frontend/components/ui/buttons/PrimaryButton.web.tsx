import React from 'react'

interface PrimaryButtonProps {
  children: React.ReactNode
  onPress?: () => void
  disabled?: boolean
  loading?: boolean
  style?: object
}

export default function PrimaryButton({ children, onPress, disabled, loading, style }: PrimaryButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      type="button"
      onClick={!isDisabled ? onPress : undefined}
      disabled={isDisabled}
      style={{
        backgroundColor: '#E8862A',
        paddingInline: 16,
        paddingBlock: 14,
        borderRadius: 999,
        border: 'none',
        outline: 'none',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
        width: '100%',
        transition: 'background-color 0.15s',
        ...style,
      }}
      onMouseEnter={(e) => { if (!isDisabled) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#D97520' }}
      onMouseLeave={(e) => { if (!isDisabled) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#E8862A' }}
    >
      {loading ? (
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg style={{ animation: 'spin 1s linear infinite', height: 20, width: 20, color: 'white' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </span>
      ) : (
        <span style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 500, fontSize: 15, lineHeight: '20px', color: '#FFFFFF', display: 'block', textAlign: 'center' }}>
          {children}
        </span>
      )}
    </button>
  )
}

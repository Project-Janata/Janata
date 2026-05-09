import React, { useState, useCallback, useEffect } from 'react'
import Cropper from 'react-easy-crop'
import { Modal } from 'react-native'

export interface WebAvatarCropperProps {
  visible: boolean
  imageUri: string
  originalImageUri?: string
  onCropComplete: (blob: Blob) => void
  onCancel: () => void
  onReplacePhoto?: () => void
}

function getCroppedImg(imageSrc: string, crop: { x: number; y: number; width: number; height: number }): Promise<Blob> {
  return new Promise((resolve) => {
    const image = new window.Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      const size = 400
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')!

      ctx.save()
      ctx.beginPath()
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
      ctx.clip()

      ctx.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        size,
        size
      )
      ctx.restore()

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
        },
        'image/jpeg',
        0.9
      )
    }
    image.src = imageSrc
  })
}

export default function WebAvatarCropper({
  visible,
  imageUri,
  originalImageUri,
  onCropComplete,
  onCancel,
  onReplacePhoto,
}: WebAvatarCropperProps) {
  const displayImageUri = originalImageUri || imageUri
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!visible) {
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCroppedAreaPixels(null)
    }
  }, [visible])

  const onCropChange = useCallback((newCrop: { x: number; y: number }) => {
    setCrop(newCrop)
  }, [])

  const onZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom)
  }, [])

  const onCropAreaComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleSave = async () => {
    if (!croppedAreaPixels) return
    setIsSaving(true)
    try {
      const blob = await getCroppedImg(displayImageUri, croppedAreaPixels)
      onCropComplete(blob)
    } finally {
      setIsSaving(false)
    }
  }

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          backgroundColor: '#1a1a1a',
          borderRadius: 16,
          padding: '24px 28px 28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 460,
          width: 'auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: 15,
              cursor: 'pointer',
              padding: 0,
              fontFamily: 'Inclusive Sans, sans-serif',
            }}
          >
            Cancel
          </button>
          <span style={{ color: '#fff', fontSize: 16, fontWeight: 600, fontFamily: 'Inclusive Sans, sans-serif' }}>
            Adjust profile photo
          </span>
          <div style={{ display: 'flex', gap: 16 }}>
            {onReplacePhoto && (
              <button
                onClick={onReplacePhoto}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#60A5FA',
                  fontSize: 14,
                  cursor: 'pointer',
                  padding: 0,
                  fontFamily: 'Inclusive Sans, sans-serif',
                }}
              >
                Change
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                background: 'none',
                border: 'none',
                color: isSaving ? '#666' : '#F97316',
                fontSize: 15,
                fontWeight: 600,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                padding: 0,
                fontFamily: 'Inclusive Sans, sans-serif',
              }}
            >
              {isSaving ? 'Saving...' : 'Done'}
            </button>
          </div>
        </div>

        {/* Cropper */}
        <div style={{ position: 'relative', width: 360, height: 360, borderRadius: 8, overflow: 'hidden' }}>
          <Cropper
            image={displayImageUri}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropAreaComplete}
          />
        </div>

        {/* Zoom slider */}
        <div style={{ width: '100%', marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#9ca3af', fontSize: 12, fontFamily: 'Inclusive Sans, sans-serif' }}>Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: '#F97316' }}
          />
        </div>

        {/* Hint */}
        <div
          style={{
            marginTop: 12,
            color: '#9ca3af',
            fontSize: 13,
            textAlign: 'center',
            fontFamily: 'Inclusive Sans, sans-serif',
          }}
        >
          Drag to reposition · Scroll to zoom
        </div>
      </div>
    </div>
  )
}

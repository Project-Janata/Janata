/**
 * MapPopover — web-only popover for map pins.
 *
 * Two modes:
 *  - hover: compact pill with icon + name
 *  - click: detail card with info + CTA button
 */
import React from 'react'
import type { MapPoint, EventDisplay, DiscoverCenter } from '../../utils/api'

type MapPopoverProps = {
  point: MapPoint
  mode: 'hover' | 'click'
  eventDetail?: EventDisplay
  centerDetail?: DiscoverCenter
  onViewPress?: () => void
  onClose?: () => void
  /** Screen-relative x/y for positioning */
  x: number
  y: number
}

export default function MapPopover({
  point,
  mode,
  eventDetail,
  centerDetail,
  onViewPress,
  onClose,
  x,
  y,
}: MapPopoverProps) {
  const isCenter = point.type === 'center'
  const accent = isCenter ? '#9A3412' : '#2563EB'
  const accentBg = isCenter ? '#FFF7ED' : '#EFF6FF'

  if (mode === 'hover') {
    return (
      <div
        className="absolute z-50 pointer-events-none"
        style={{ left: x, top: y - 16, transform: 'translate(-50%, -100%)' }}
      >
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 whitespace-nowrap"
          style={{ maxWidth: 280 }}
        >
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: accent }}
          />
          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
            {point.name}
          </span>
        </div>
        {/* Arrow */}
        <div className="flex justify-center">
          <div
            className="w-2 h-2 rotate-45 -mt-1 bg-white dark:bg-neutral-800 border-b border-r border-gray-200 dark:border-neutral-700"
          />
        </div>
      </div>
    )
  }

  // click mode — detail card
  return (
    <div
      className="absolute z-50"
      style={{ left: x, top: y - 20, transform: 'translate(-50%, -100%)' }}
    >
      <div
        className="rounded-xl shadow-xl bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 p-4 min-w-[240px] max-w-[300px]"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer border-none bg-transparent"
        >
          ×
        </button>

        {/* Type badge */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: accent }}>
            {isCenter ? 'Center' : 'Event'}
          </span>
        </div>

        {/* Name */}
        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1 leading-tight pr-4">
          {point.name}
        </p>

        {/* Details */}
        {eventDetail && (
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5 mb-3">
            <p>{eventDetail.time}</p>
            <p>{eventDetail.location}</p>
          </div>
        )}
        {centerDetail && (
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5 mb-3">
            {centerDetail.address && <p>{centerDetail.address}</p>}
            {centerDetail.eventCount != null && centerDetail.eventCount > 0 && (
              <p className="font-medium" style={{ color: accent }}>{centerDetail.eventCount} events this week</p>
            )}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={onViewPress}
          className="w-full py-2 rounded-full text-xs font-semibold text-white border-none cursor-pointer transition-opacity hover:opacity-90"
          style={{ backgroundColor: accent }}
        >
          View {isCenter ? 'Center' : 'Event'}
        </button>
      </div>
      {/* Arrow */}
      <div className="flex justify-center">
        <div className="w-3 h-3 rotate-45 -mt-1.5 bg-white dark:bg-neutral-800 border-b border-r border-gray-200 dark:border-neutral-700" />
      </div>
    </div>
  )
}

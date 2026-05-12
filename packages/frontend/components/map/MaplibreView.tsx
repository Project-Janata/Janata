import React from 'react'
import Map, { AttributionControl, MapRef, Marker } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'

type MaplibreViewProps = {
  mapRef: React.RefObject<MapRef>
  viewState: {
    longitude: number
    latitude: number
    zoom: number
  }
  onMove: (evt: any) => void
  mapStyle: string
  markers: { point: { id: string; latitude: number; longitude: number; type: string; name: string }; onClick: any }[]
}

export default function MaplibreView({
  mapRef,
  viewState,
  onMove,
  mapStyle,
  markers,
}: MaplibreViewProps) {
  return (
    <Map
      ref={mapRef}
      {...viewState}
      onMove={onMove}
      mapStyle={mapStyle}
      style={{ width: '100%', height: '100%' }}
      reuseMaps
      attributionControl={false}
      cooperativeGestures={true}
    >
      {markers.map(({ point, onClick }) => (
        <Marker
          key={point.id}
          longitude={point.longitude}
          latitude={point.latitude}
          anchor="bottom"
          onClick={onClick}
        >
          <div
            className={`w-[30px] h-[30px] rounded-[50%_50%_50%_0] -rotate-45 border-2 border-white shadow-[0_2px_4px_rgba(0,0,0,0.3)] cursor-pointer
              ${point.type === 'center' ? 'bg-red-500' : 'bg-blue-500'}`}
            title={point.name}
          />
        </Marker>
      ))}
      <AttributionControl
        compact={true}
        position="bottom-left"
        style={{
          marginBottom: '10px',
          marginLeft: '10px',
        }}
      />
    </Map>
  )
}

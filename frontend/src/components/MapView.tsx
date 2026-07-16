import { useEffect, useRef } from 'react'
import type React from 'react'
import maplibregl from 'maplibre-gl'
import type { GeoJSONFeature } from '../types/geojson'

/** escape HTML entities ก่อนนำไปใส่ใน setHTML */
function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

interface MapViewProps {
  features: GeoJSONFeature[]
  onMapClick: (coords: [number, number]) => void
  flyToRef?: React.MutableRefObject<((coords: [number, number]) => void) | null>
}

const SOURCE_ID = 'features'
const LAYER_ID        = 'features-circles'
const LAYER_LINES     = 'features-lines'
const LAYER_FILL      = 'features-fill'
const LAYER_OUTLINE   = 'features-outline'
const ALL_LAYERS      = [LAYER_ID, LAYER_LINES, LAYER_FILL, LAYER_OUTLINE]

/**
 * @description MapLibre GL JS map — GeoJSON markers, popup on click, empty-click handler
 */
export default function MapView({ features, onMapClick, flyToRef }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const popupRef = useRef<maplibregl.Popup | null>(null)
  // ref เพื่อเข้าถึง onMapClick เวอร์ชันล่าสุดเสมอ (หลีกเลี่ยง stale closure)
  const onMapClickRef = useRef(onMapClick)
  useEffect(() => { onMapClickRef.current = onMapClick })

  // init map เพียงครั้งเดียว
  // ใช้ mapRef.current เป็น guard — cleanup nulls มัน ทำให้ StrictMode remount ทำงานถูกต้อง
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [100.5, 13.75],
      zoom: 5,
    })

    map.addControl(new maplibregl.NavigationControl(), 'top-right')

    map.on('load', () => {
      try {
      // เพิ่ม GeoJSON source เปล่าก่อน — จะ update จาก effect อื่น
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })

      // circle layer
      map.addLayer({
        id: LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 3, 5, 10, 8],
          'circle-color': ['match', ['get', 'category'],
            'มหาวิทยาลัย', '#4A90D9',
            'วัด',          '#F5A623',
            'สนามบิน',     '#7ED321',
            'อุทยาน',      '#9B59B6',
            'หาด',         '#E91E8C',
            'ตลาด',        '#FF6B35',
            '#00D4C8',
          ],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      })

      // LineString layer
      map.addLayer({
        id: LAYER_LINES,
        type: 'line',
        source: SOURCE_ID,
        filter: ['==', ['geometry-type'], 'LineString'],
        paint: { 'line-color': '#00D4C8', 'line-width': 2.5, 'line-opacity': 0.9 },
      })

      // Polygon fill + outline layers
      map.addLayer({
        id: LAYER_FILL,
        type: 'fill',
        source: SOURCE_ID,
        filter: ['==', ['geometry-type'], 'Polygon'],
        paint: { 'fill-color': '#00D4C8', 'fill-opacity': 0.25 },
      })
      map.addLayer({
        id: LAYER_OUTLINE,
        type: 'line',
        source: SOURCE_ID,
        filter: ['==', ['geometry-type'], 'Polygon'],
        paint: { 'line-color': '#00D4C8', 'line-width': 1.5 },
      })

      // helper สร้าง popup HTML จากชื่อและ coordinates
      const makePopupHtml = (name: string, lngLat: maplibregl.LngLat) =>
        `<div style="font-family:'Instrument Sans',sans-serif;font-size:13px;color:#E6EDF3;background:#161B22;padding:6px 10px;border-radius:6px;border:1px solid rgba(0,212,200,0.3)">
          <strong>${name}</strong><br/>
          <span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#8B949E">
            ${lngLat.lng.toFixed(5)}, ${lngLat.lat.toFixed(5)}
          </span>
        </div>`

      // hover cursor — Point
      map.on('mouseenter', LAYER_ID, () => {
        map.getCanvas().style.cursor = 'pointer'
        map.setPaintProperty(LAYER_ID, 'circle-radius', ['interpolate', ['linear'], ['zoom'], 3, 6.5, 10, 10.4])
      })
      map.on('mouseleave', LAYER_ID, () => {
        map.getCanvas().style.cursor = ''
        map.setPaintProperty(LAYER_ID, 'circle-radius', ['interpolate', ['linear'], ['zoom'], 3, 5, 10, 8])
      })

      // hover cursor — LineString + Polygon
      for (const layer of [LAYER_LINES, LAYER_FILL]) {
        map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer' })
        map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = '' })
      }

      // click บน marker (Point) → popup
      map.on('click', LAYER_ID, e => {
        if (!e.features?.length) return
        const name = escapeHtml((e.features[0].properties as { name?: string }).name ?? 'ไม่มีชื่อ')
        popupRef.current?.remove()
        popupRef.current = new maplibregl.Popup({ offset: 12 })
          .setLngLat(e.lngLat)
          .setHTML(makePopupHtml(name, e.lngLat))
          .addTo(map)
      })

      // click บน LineString → popup ณ จุดที่คลิก
      map.on('click', LAYER_LINES, e => {
        if (!e.features?.length) return
        const name = escapeHtml((e.features[0].properties as { name?: string }).name ?? 'ไม่มีชื่อ')
        popupRef.current?.remove()
        popupRef.current = new maplibregl.Popup({ offset: 6 })
          .setLngLat(e.lngLat)
          .setHTML(makePopupHtml(name, e.lngLat))
          .addTo(map)
      })

      // click บน Polygon fill → popup ณ จุดที่คลิก
      map.on('click', LAYER_FILL, e => {
        if (!e.features?.length) return
        const name = escapeHtml((e.features[0].properties as { name?: string }).name ?? 'ไม่มีชื่อ')
        popupRef.current?.remove()
        popupRef.current = new maplibregl.Popup({ offset: 6 })
          .setLngLat(e.lngLat)
          .setHTML(makePopupHtml(name, e.lngLat))
          .addTo(map)
      })

      // click บน map ว่าง → เปิด AddDialog (ใช้ ref เพื่อ callback ล่าสุดเสมอ)
      map.on('click', e => {
        const hits = map.queryRenderedFeatures(e.point, { layers: ALL_LAYERS })
        if (hits.length === 0) {
          onMapClickRef.current([e.lngLat.lng, e.lngLat.lat])
        }
      })
      // เปิดให้ parent สั่ง flyTo ได้ผ่าน ref
      if (flyToRef) {
        flyToRef.current = (coords) => map.flyTo({ center: coords, zoom: 14 })
      }
      } catch (err) {
        console.error('[MapView] map load setup failed:', err)
      }
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      if (flyToRef) flyToRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // อัปเดต GeoJSON source เมื่อ features เปลี่ยน
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const update = () => {
      const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined
      if (!source) return
      source.setData({
        type: 'FeatureCollection',
        features: features.map(f => ({
          type: 'Feature' as const,
          id: f.id,
          geometry: f.geometry,
          properties: f.properties,
        })),
      })
    }

    if (map.isStyleLoaded()) {
      update()
    } else {
      map.once('load', update)
    }
  }, [features])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%' }}
    />
  )
}

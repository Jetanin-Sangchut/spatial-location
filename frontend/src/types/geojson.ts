/** GeoJSON Feature ที่ใช้ใน Spatial Data Platform */
export interface GeoJSONFeature {
  id: string
  type: 'Feature'
  geometry:
    | { type: 'Point';      coordinates: [number, number] }
    | { type: 'LineString'; coordinates: [number, number][] }
    | { type: 'Polygon';    coordinates: [number, number][][] }
  properties: {
    name: string
    category?: string
    [key: string]: unknown
  }
}

/** GeoJSON FeatureCollection ที่ใช้ใน Spatial Data Platform */
export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

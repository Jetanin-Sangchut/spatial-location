export interface GeoJSONFeature {
  id: string
  type: 'Feature'
  geometry:
    | { type: 'Point';      coordinates: [number, number] }
    | { type: 'LineString'; coordinates: [number, number][] }
    | { type: 'Polygon';    coordinates: [number, number][][] }
  properties: {
    name: string
    [key: string]: unknown
  }
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

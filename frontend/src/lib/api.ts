import type { GeoJSONFeature, GeoJSONFeatureCollection } from '../types/geojson'

/** Base URL ของ API — อ่านจาก env หรือใช้ relative path (Vite proxy) */
const BASE_URL = import.meta.env.VITE_API_URL ?? ''

/** ตรวจสอบ HTTP status แล้ว parse JSON — reject ถ้า !ok */
function parseResponse<T>(r: Response): Promise<T> {
  if (!r.ok) return r.json().then(e => Promise.reject(e))
  return r.json()
}

/** API client สำหรับ features endpoint */
export const api = {
  /** ดึง features ทั้งหมด */
  getFeatures: (): Promise<GeoJSONFeatureCollection> =>
    fetch(`${BASE_URL}/api/features`).then(r => parseResponse<GeoJSONFeatureCollection>(r)),

  /** ดึง feature เดี่ยวด้วย id */
  getFeature: (id: string): Promise<GeoJSONFeature> =>
    fetch(`${BASE_URL}/api/features/${id}`).then(r => parseResponse<GeoJSONFeature>(r)),

  /** สร้าง feature ใหม่ */
  createFeature: (body: unknown): Promise<GeoJSONFeature> =>
    fetch(`${BASE_URL}/api/features`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(r => parseResponse<GeoJSONFeature>(r)),

  /** แก้ไข feature ด้วย id */
  updateFeature: (id: string, body: unknown): Promise<GeoJSONFeature> =>
    fetch(`${BASE_URL}/api/features/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(r => parseResponse<GeoJSONFeature>(r)),

  /** ลบ feature ด้วย id */
  deleteFeature: (id: string): Promise<void> =>
    fetch(`${BASE_URL}/api/features/${id}`, { method: 'DELETE' }).then(r => {
      if (!r.ok) return r.json().then(e => Promise.reject(e))
    }),
}

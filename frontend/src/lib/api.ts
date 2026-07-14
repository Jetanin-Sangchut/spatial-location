import type { GeoJSONFeature, GeoJSONFeatureCollection } from '../types/geojson'

/** Base URL ของ API — อ่านจาก env หรือใช้ relative path (Vite proxy) */
const BASE_URL = import.meta.env.VITE_API_URL ?? ''

/** ตรวจสอบ HTTP status แล้ว parse JSON — throw Error ถ้า !ok (รองรับ non-JSON error body)
 *  หมายเหตุ: success path ต้องการ JSON body — ใช้กับ endpoint ที่ไม่คืน body (204) ไม่ได้ */
async function parseResponse<T>(r: Response): Promise<T> {
  if (!r.ok) {
    const text = await r.text()
    let body: unknown
    try { body = JSON.parse(text) } catch { body = null }
    const message =
      body != null && typeof body === 'object' && 'message' in body
        ? String((body as { message: unknown }).message)
        : text || r.statusText
    throw new Error(message)
  }
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
  deleteFeature: async (id: string): Promise<void> => {
    const r = await fetch(`${BASE_URL}/api/features/${id}`, { method: 'DELETE' })
    if (!r.ok) await parseResponse(r)
  },
}

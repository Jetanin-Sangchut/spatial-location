import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { GeoJSONFeatureCollection } from '../types/geojson'

/**
 * @description ดึง features ทั้งหมดจาก API
 */
export const useFeatures = () =>
  useQuery<GeoJSONFeatureCollection>({
    queryKey: ['features'],
    queryFn: api.getFeatures,
  })

/**
 * @description สร้าง feature ใหม่ แล้ว invalidate cache
 */
export const useCreateFeature = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createFeature,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['features'] }),
    onError: (err) => console.error('[useCreateFeature] failed:', err),
  })
}

/**
 * @description แก้ไข feature แล้ว invalidate cache
 */
export const useUpdateFeature = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: unknown }) =>
      api.updateFeature(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['features'] }),
    onError: (err) => console.error('[useUpdateFeature] failed:', err),
  })
}

/**
 * @description ลบ feature แล้ว invalidate cache
 */
export const useDeleteFeature = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.deleteFeature,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['features'] }),
    onError: (err) => console.error('[useDeleteFeature] failed:', err),
  })
}

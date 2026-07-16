import { useState, useEffect } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material'
import { useUpdateFeature } from '../hooks/useFeatures'
import type { GeoJSONFeature } from '../types/geojson'
import { fieldSx } from '../styles/fieldSx'

interface EditFeatureDialogProps {
  feature: GeoJSONFeature | null
  onClose: () => void
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

/**
 * @description Dialog แก้ไข feature — pre-fill จาก feature ที่เลือก
 */
export default function EditFeatureDialog({
  feature,
  onClose,
  onSuccess,
  onError,
}: EditFeatureDialogProps) {
  const CATEGORIES = ['มหาวิทยาลัย', 'วัด', 'สนามบิน', 'อุทยาน', 'หาด', 'ตลาด', 'ทั่วไป']

  const [name, setName] = useState('')
  const [category, setCategory] = useState('ทั่วไป')
  const [lon, setLon] = useState('')
  const [lat, setLat] = useState('')

  const { mutate: updateFeature, isPending } = useUpdateFeature()

  // sync fields เมื่อ id เปลี่ยน (feature ใหม่) หรือเมื่อ feature เป็น null (ปิด dialog)
  // หมายเหตุ: เปิด feature เดิม (id เดิม) ซ้ำ → fields ไม่ถูก reset — intentional
  useEffect(() => {
    if (feature) {
      setName(feature.properties.name)
      setCategory(feature.properties.category ?? 'ทั่วไป')
      setLon(feature.geometry.coordinates[0].toFixed(6))
      setLat(feature.geometry.coordinates[1].toFixed(6))
    } else {
      setName('')
      setCategory('ทั่วไป')
      setLon('')
      setLat('')
    }
  }, [feature?.id])

  const handleSubmit = () => {
    if (!feature || !name.trim()) return
    const lonNum = parseFloat(lon)
    const latNum = parseFloat(lat)
    if (isNaN(lonNum) || isNaN(latNum)) return
    if (lonNum < -180 || lonNum > 180 || latNum < -90 || latNum > 90) return

    updateFeature(
      {
        id: feature.id,
        body: {
          geometry: { type: 'Point', coordinates: [lonNum, latNum] },
          properties: { name: name.trim(), category },
        },
      },
      {
        onSuccess: () => {
          onSuccess('แก้ไขสถานที่สำเร็จ')
          onClose()
        },
        onError: () => onError('แก้ไขสถานที่ไม่สำเร็จ'),
      },
    )
  }

  return (
    <Dialog
      open={!!feature}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: { bgcolor: '#161B22', backgroundImage: 'none' } } }}
    >
      <DialogTitle sx={{ fontFamily: 'Instrument Sans, sans-serif' }}>
        แก้ไขสถานที่
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="ชื่อสถานที่"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            fullWidth
            size="medium"
            autoFocus
            sx={fieldSx}
          />
          <Select
            value={category}
            onChange={e => setCategory(e.target.value)}
            size="medium"
            fullWidth
            sx={{
              fontSize: 13,
              fontFamily: 'Instrument Sans, sans-serif',
              color: 'text.primary',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00D4C8' },
            }}
          >
            {CATEGORIES.map(c => <MenuItem key={c} value={c} sx={{ fontSize: 13 }}>{c}</MenuItem>)}
          </Select>
          <Stack direction="row" spacing={1}>
            <TextField
              label="Longitude"
              value={lon}
              onChange={e => setLon(e.target.value)}
              fullWidth
              size="small"
              inputProps={{ style: { fontFamily: 'JetBrains Mono, monospace' } }}
              sx={fieldSx}
            />
            <TextField
              label="Latitude"
              value={lat}
              onChange={e => setLat(e.target.value)}
              fullWidth
              size="small"
              inputProps={{ style: { fontFamily: 'JetBrains Mono, monospace' } }}
              sx={fieldSx}
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>
          ยกเลิก
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!name.trim() || !lon || !lat || isPending}
          variant="contained"
          sx={{ bgcolor: '#00D4C8', color: '#0D1117', '&:hover': { bgcolor: '#00bfb4' } }}
        >
          {isPending ? 'กำลังบันทึก...' : 'บันทึก'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}


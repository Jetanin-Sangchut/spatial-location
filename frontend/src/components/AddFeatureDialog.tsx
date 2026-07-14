import { useState, useEffect } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Place as PlaceIcon } from '@mui/icons-material'
import { useCreateFeature } from '../hooks/useFeatures'
import { fieldSx } from '../styles/fieldSx'

interface AddFeatureDialogProps {
  open: boolean
  clickCoords: [number, number] | null
  onClose: () => void
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

/**
 * @description Dialog เพิ่ม feature ใหม่ — รับ coords จาก map click หรือกรอกเอง
 */
export default function AddFeatureDialog({
  open,
  clickCoords,
  onClose,
  onSuccess,
  onError,
}: AddFeatureDialogProps) {
  const [name, setName] = useState('')
  const [lon, setLon] = useState('')
  const [lat, setLat] = useState('')

  const { mutate: createFeature, isPending } = useCreateFeature()

  // pre-fill จาก map click
  useEffect(() => {
    if (clickCoords) {
      setLon(clickCoords[0].toFixed(6))
      setLat(clickCoords[1].toFixed(6))
    } else {
      setLon('')
      setLat('')
    }
  }, [clickCoords])

  const handleClose = () => {
    setName('')
    setLon('')
    setLat('')
    onClose()
  }

  const handleSubmit = () => {
    if (!name.trim()) return
    const lonNum = parseFloat(lon)
    const latNum = parseFloat(lat)
    if (isNaN(lonNum) || isNaN(latNum)) return
    if (lonNum < -180 || lonNum > 180 || latNum < -90 || latNum > 90) return

    createFeature(
      {
        geometry: { type: 'Point', coordinates: [lonNum, latNum] },
        properties: { name: name.trim() },
      },
      {
        onSuccess: () => {
          onSuccess('เพิ่มสถานที่สำเร็จ')
          handleClose()
        },
        onError: () => onError('เพิ่มสถานที่ไม่สำเร็จ'),
      },
    )
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { bgcolor: '#161B22', backgroundImage: 'none' } }}
    >
      <DialogTitle sx={{ fontFamily: 'Instrument Sans, sans-serif' }}>
        เพิ่มสถานที่ใหม่
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {clickCoords && (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <PlaceIcon fontSize="small" sx={{ color: '#00D4C8' }} />
              <Typography variant="caption" color="#00D4C8">
                พิกัดจากแผนที่
              </Typography>
            </Stack>
          )}
          <TextField
            label="ชื่อสถานที่"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            fullWidth
            size="small"
            autoFocus
            sx={fieldSx}
          />
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
        <Button onClick={handleClose} sx={{ color: 'text.secondary' }}>
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


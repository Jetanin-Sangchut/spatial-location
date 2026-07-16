import { useState, useMemo, useRef } from 'react'
import { Box, Button, Grid2, Alert, MenuItem, Select, Typography } from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import Swal from 'sweetalert2'
import SearchBar from './SearchBar'
import FeaturesTable from './FeaturesTable'
import MapView from './MapView'
import AddFeatureDialog from './AddFeatureDialog'
import EditFeatureDialog from './EditFeatureDialog'
import { useFeatures, useDeleteFeature } from '../hooks/useFeatures'
import type { GeoJSONFeature } from '../types/geojson'

const CATEGORIES = ['มหาวิทยาลัย', 'วัด', 'สนามบิน', 'อุทยาน', 'หาด', 'ตลาด', 'ทั่วไป']

/** SweetAlert2 instance ที่ตั้งค่าสี button */
const MySwal = Swal.mixin({
  confirmButtonColor: '#00D4C8',
  cancelButtonColor: '#F85149',
})

/** แสดง toast notification (success / error) */
const showToast = (title: string, icon: 'success' | 'error') =>
  MySwal.fire({ title, icon, timer: 3000, timerProgressBar: true, showConfirmButton: false, toast: true, position: 'bottom-end' })

/**
 * @description Layout หลักของ dashboard — Sidebar + Map (desktop), stacked (mobile)
 */
export default function DashboardLayout() {
  const { data, isLoading, isError } = useFeatures()
  const { mutate: deleteFeature } = useDeleteFeature()

  const flyToRef = useRef<((coords: [number, number]) => void) | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedGeometry, setSelectedGeometry] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [clickCoords, setClickCoords] = useState<[number, number] | null>(null)
  const [editFeature, setEditFeature] = useState<GeoJSONFeature | null>(null)

  // filter features ด้วย searchQuery (client-side)
  const filteredFeatures = useMemo(() => {
    const all = data?.features ?? []
    if (!searchQuery.trim() && !selectedCategory && !selectedGeometry) return all
    const q = searchQuery.toLowerCase()
    return all.filter(f => {
      const name = (f.properties.name ?? '').toLowerCase()
      const lon = f.geometry.type === 'Point' ? f.geometry.coordinates[0].toFixed(6) : ''
      const lat = f.geometry.type === 'Point' ? f.geometry.coordinates[1].toFixed(6) : ''
      const matchesSearch = !q || name.includes(q) || lon.includes(q) || lat.includes(q)
      const matchesCategory = !selectedCategory || (f.properties.category ?? 'ทั่วไป') === selectedCategory
      const matchesGeometry = !selectedGeometry || f.geometry.type === selectedGeometry
      return matchesSearch && matchesCategory && matchesGeometry
    })
  }, [data, searchQuery, selectedCategory, selectedGeometry])

  const handleMapClick = (coords: [number, number]) => {
    // blur canvas ก่อนเปิด dialog เพื่อหลีกเลี่ยง aria-hidden warning จาก MUI Dialog
    ;(document.activeElement as HTMLElement | null)?.blur()
    setClickCoords(coords)
    setAddOpen(true)
  }

  const handleAddClose = () => {
    setAddOpen(false)
    setClickCoords(null)
  }

  const handleDelete = async (id: string) => {
    const result = await MySwal.fire({
      title: 'ต้องการลบสถานที่นี้?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
    })
    if (!result.isConfirmed) return
    deleteFeature(id, {
      onSuccess: () => showToast('ลบสถานที่สำเร็จ', 'success'),
      onError: (err) => showToast(err instanceof Error ? err.message : 'ลบสถานที่ไม่สำเร็จ', 'error'),
    })
  }

  return (
    <Box sx={{ width: '100vw', height: '100vh', bgcolor: '#0D1117', overflow: 'hidden' }}>
      <Grid2 container sx={{ height: '100%' }}>

        {/* Sidebar — col-4 desktop, col-12 mobile (50vh) */}
        <Grid2
          size={{ xs: 12, md: 5 }}
          sx={{
            height: { xs: '50vh', md: '100%' },
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#161B22',
            overflow: 'hidden',
            borderRight: { md: '1px solid rgba(255,255,255,0.08)' },
            borderBottom: { xs: '1px solid rgba(255,255,255,0.08)', md: 'none' },
          }}
        >
          {/* Header */}
          <Box sx={{ px: 2, pt: 2, pb: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{ fontFamily: 'Instrument Sans, sans-serif', color: '#00D4C8', letterSpacing: 0.5 }}
            >
              Spatial Data Platform
            </Typography>
          </Box>

          {/* Search */}
          <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </Box>

          {/* Category filter */}
          <Box sx={{ px: 2, pb: 1 }}>
            <Select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              size="small"
              fullWidth
              displayEmpty
              sx={{
                color: 'text.primary',
                fontSize: 13,
                fontFamily: 'Instrument Sans, sans-serif',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00D4C8' },
              }}
            >
              <MenuItem value="">ทุกประเภท</MenuItem>
              {CATEGORIES.map(c => <MenuItem key={c} value={c} sx={{ fontSize: 13 }}>{c}</MenuItem>)}
            </Select>
          </Box>

          {/* Geometry type filter */}
          <Box sx={{ px: 2, pb: 1 }}>
            <Select
              value={selectedGeometry}
              onChange={e => setSelectedGeometry(e.target.value)}
              size="small"
              fullWidth
              displayEmpty
              sx={{
                color: 'text.primary',
                fontSize: 13,
                fontFamily: 'Instrument Sans, sans-serif',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00D4C8' },
              }}
            >
              <MenuItem value="">ทุก Geometry</MenuItem>
              {['Point', 'LineString', 'Polygon'].map(g => (
                <MenuItem key={g} value={g} sx={{ fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }}>{g}</MenuItem>
              ))}
            </Select>
          </Box>

          {/* DataGrid — flex:1 + minHeight:0 keeps scroll inside the 50vh/100% container */}
          <Box sx={{ flex: 1, minHeight: 0, px: 1, overflow: 'hidden' }}>
            {isLoading && (
              <Typography variant="body2" sx={{ p: 2, color: 'text.secondary' }}>
                กำลังโหลด...
              </Typography>
            )}
            {isError && (
              <Alert severity="error" sx={{ m: 1 }}>
                โหลดข้อมูลไม่สำเร็จ
              </Alert>
            )}
            {data && (
              <FeaturesTable
                features={filteredFeatures}
                onEdit={setEditFeature}
                onDelete={handleDelete}
                onFlyTo={coords => flyToRef.current?.(coords)}
              />
            )}
          </Box>

          {/* Add button */}
          <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => { setClickCoords(null); setAddOpen(true) }}
              sx={{
                bgcolor: '#00D4C8',
                color: '#0D1117',
                fontFamily: 'Instrument Sans, sans-serif',
                fontWeight: 700,
                '&:hover': { bgcolor: '#00bfb4' },
              }}
            >
              เพิ่มสถานที่
            </Button>
          </Box>
        </Grid2>

        {/* Map — col-8 desktop, col-12 mobile (50vh) */}
        <Grid2
          size={{ xs: 12, md: 7 }}
          sx={{ height: { xs: '50vh', md: '100%' }, position: 'relative' }}
        >
          <MapView features={filteredFeatures} onMapClick={handleMapClick} flyToRef={flyToRef} />
        </Grid2>

      </Grid2>

      <AddFeatureDialog
        open={addOpen}
        clickCoords={clickCoords}
        onClose={handleAddClose}
        onSuccess={msg => showToast(msg, 'success')}
        onError={msg => showToast(msg, 'error')}
      />

      <EditFeatureDialog
        feature={editFeature}
        onClose={() => setEditFeature(null)}
        onSuccess={msg => showToast(msg, 'success')}
        onError={msg => showToast(msg, 'error')}
      />
    </Box>
  )
}

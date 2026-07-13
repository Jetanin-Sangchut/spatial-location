import { Box, Typography, CircularProgress, Alert } from '@mui/material'
import { useFeatures } from './hooks/useFeatures'

/**
 * @description Root component — แสดง loading/error state และจำนวน features ที่โหลดได้
 */
export default function App() {
  const { data, isLoading, isError } = useFeatures()

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Spatial Data Platform
      </Typography>
      {isLoading && <CircularProgress />}
      {isError && <Alert severity="error">Failed to load locations</Alert>}
      {data && (
        <Typography color="text.secondary">
          {data.features.length} locations loaded from API
        </Typography>
      )}
    </Box>
  )
}

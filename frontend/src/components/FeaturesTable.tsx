import { useMemo } from 'react'
import { DataGrid, GridToolbarContainer } from '@mui/x-data-grid'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { Button, IconButton, Stack, Tooltip } from '@mui/material'
import { Download as DownloadIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import type { GeoJSONFeature, GeoJSONFeatureCollection } from '../types/geojson'

interface FeaturesTableProps {
  features: GeoJSONFeature[]
  onEdit: (feature: GeoJSONFeature) => void
  onDelete: (id: string) => void
  onFlyTo: (coords: [number, number]) => void
}

function ExportToolbar({ features }: { features: GeoJSONFeature[] }) {
  const handleExport = () => {
    const collection: GeoJSONFeatureCollection = { type: 'FeatureCollection', features }
    const blob = new Blob([JSON.stringify(collection, null, 2)], { type: 'application/geo+json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'features.geojson'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <GridToolbarContainer>
      <Button size="small" startIcon={<DownloadIcon />} onClick={handleExport}
        sx={{ color: '#00D4C8', fontSize: 12, ml: 1 }}>
        Export GeoJSON
      </Button>
    </GridToolbarContainer>
  )
}

/**
 * @description MUI DataGrid แสดง features — pagination, Edit/Delete per row, Export GeoJSON
 */
export default function FeaturesTable({ features, onEdit, onDelete, onFlyTo }: FeaturesTableProps) {
  const rows = useMemo(
    () =>
      features.map(f => ({
        id: f.id,
        name: f.properties.name ?? 'ไม่มีชื่อ',
        lon: f.geometry.coordinates[0].toFixed(6),
        lat: f.geometry.coordinates[1].toFixed(6),
        _feature: f,
      })),
    [features],
  )

  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'name',
      headerName: 'ชื่อ',
      flex: 1,
      minWidth: 100,
    },
    {
      field: 'lon',
      headerName: 'Lon',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
          {params.value as string}
        </span>
      ),
    },
    {
      field: 'lat',
      headerName: 'Lat',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
          {params.value as string}
        </span>
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 80,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={0}>
          <Tooltip title="แก้ไข">
            <IconButton
              size="small"
              onClick={e => { e.stopPropagation(); onEdit(params.row._feature as GeoJSONFeature) }}
              sx={{ color: '#00D4C8' }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="ลบ">
            <IconButton
              size="small"
              onClick={e => { e.stopPropagation(); onDelete(params.row.id as string) }}
              sx={{ color: '#F85149' }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ], [onEdit, onDelete])

  return (
    <DataGrid
      rows={rows}
      columns={columns}
      pageSizeOptions={[10, 25]}
      initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
      disableRowSelectionOnClick
      onRowClick={params => onFlyTo([
        (params.row._feature as GeoJSONFeature).geometry.coordinates[0],
        (params.row._feature as GeoJSONFeature).geometry.coordinates[1],
      ])}
      slots={{ toolbar: () => <ExportToolbar features={features} /> }}
      sx={{
        border: 'none',
        flex: 1,
        minHeight: 0,
        color: 'text.primary',
        fontFamily: 'Instrument Sans, sans-serif',
        '& .MuiDataGrid-columnHeaders': {
          bgcolor: 'rgba(255,255,255,0.04)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        },
        '& .MuiDataGrid-row:hover': {
          bgcolor: 'rgba(0,212,200,0.06)',
        },
        '& .MuiDataGrid-cell': {
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        },
        '& .MuiDataGrid-footerContainer': {
          borderTop: '1px solid rgba(255,255,255,0.08)',
        },
        '& .MuiTablePagination-root': {
          color: 'text.secondary',
        },
      }}
    />
  )
}

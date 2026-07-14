import { useMemo } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { IconButton, Stack, Tooltip } from '@mui/material'
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import type { GeoJSONFeature } from '../types/geojson'

interface FeaturesTableProps {
  features: GeoJSONFeature[]
  onEdit: (feature: GeoJSONFeature) => void
  onDelete: (id: string) => void
}

/**
 * @description MUI DataGrid แสดง features — pagination, Edit/Delete per row
 */
export default function FeaturesTable({ features, onEdit, onDelete }: FeaturesTableProps) {
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
              onClick={() => onEdit(params.row._feature as GeoJSONFeature)}
              sx={{ color: '#00D4C8' }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="ลบ">
            <IconButton
              size="small"
              onClick={() => onDelete(params.row.id as string)}
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

import { InputAdornment, TextField } from '@mui/material'
import { Search as SearchIcon } from '@mui/icons-material'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

/**
 * @description ช่องค้นหา — filter features ด้วยชื่อ (client-side)
 */
export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <TextField
      fullWidth
      size="small"
      placeholder="ค้นหาสถานที่..."
      value={value}
      onChange={e => onChange(e.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
          </InputAdornment>
        ),
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          bgcolor: 'rgba(255,255,255,0.04)',
          '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
          '&:hover fieldset': { borderColor: 'rgba(0,212,200,0.5)' },
          '&.Mui-focused fieldset': { borderColor: '#00D4C8' },
        },
        input: { fontFamily: 'Instrument Sans, sans-serif' },
      }}
    />
  )
}

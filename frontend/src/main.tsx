import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import App from './App'
import 'maplibre-gl/dist/maplibre-gl.css'

/** React Query client — ใช้ค่า default สำหรับ Phase 1 */
const queryClient = new QueryClient()

/** MUI theme หลักของ app */
const theme = createTheme({
  palette: { primary: { main: '#1976d2' } },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)

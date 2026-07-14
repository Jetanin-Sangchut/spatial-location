import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import App from './App'
import 'maplibre-gl/dist/maplibre-gl.css'

/** React Query client */
const queryClient = new QueryClient()

/** Dark GIS theme */
const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0D1117',
      paper: '#161B22',
    },
    primary: {
      main: '#00D4C8',
      contrastText: '#0D1117',
    },
    error: {
      main: '#F85149',
    },
    text: {
      primary: '#E6EDF3',
      secondary: '#8B949E',
    },
  },
  typography: {
    fontFamily: 'Instrument Sans, sans-serif',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        html, body, #root {
          height: 100%;
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
        /* custom MapLibre popup */
        .maplibregl-popup-content {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .maplibregl-popup-tip {
          display: none !important;
        }
      `,
    },
  },
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

import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'

// StrictMode intentionally omitted — MapLibre GL allocates WebGL contexts
// that cannot survive React's double-invoke in development.
createRoot(document.getElementById('root')!).render(<App />)

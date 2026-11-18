import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.tsx'
import { initPwa } from './pwa'
import { RotateHint } from './ui/RotateHint'

initPwa()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <RotateHint />
  </StrictMode>,
)

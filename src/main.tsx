import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.tsx'
import { initPwa } from './pwa'
import { RotateHint } from './ui/RotateHint'
import { AudioDirector } from './audio/AudioDirector'

initPwa()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <AudioDirector />
    <RotateHint />
  </StrictMode>,
)

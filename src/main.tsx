import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.tsx'
import { initPwa } from './pwa'
import { RotateHint } from './ui/RotateHint'
import { AudioDirector } from './audio/AudioDirector'
import { IntroDeck } from './ui/intro/IntroDeck'

initPwa()

// /intro is the game-introduction deck for facilitators (no game, no music)
const isIntro = window.location.pathname.replace(import.meta.env.BASE_URL, '/').replace(/\/+$/, '') === '/intro'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isIntro ? (
      <IntroDeck />
    ) : (
      <>
        <App />
        <AudioDirector />
        <RotateHint />
      </>
    )}
  </StrictMode>,
)

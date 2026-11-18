import { useSyncExternalStore } from 'react'

/**
 * Installable app (PWA). Chrome/Edge/Samsung Internet fire `beforeinstallprompt`, which we
 * keep so our own button can open the install dialog. iOS Safari has no such event: the
 * player adds the game from the Share menu, so we show those steps instead.
 */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: InstallPromptEvent | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.matchMedia?.('(display-mode: fullscreen)').matches || (navigator as { standalone?: boolean }).standalone === true

/** iPhone/iPad, including iPadOS that reports itself as a Mac with touch. */
export const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

export function initPwa() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as InstallPromptEvent
    emit()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    emit()
  })
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {}))
  }
}

export type InstallMode = 'prompt' | 'ios' | null

function snapshot(): InstallMode {
  if (isStandalone()) return null
  if (deferred) return 'prompt'
  return isIOS() ? 'ios' : null
}

export function useInstall() {
  const mode = useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    snapshot,
  )
  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice.catch(() => null)
    deferred = null
    emit()
  }
  return { mode, install }
}

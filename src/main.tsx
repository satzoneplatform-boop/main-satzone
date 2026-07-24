import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { launchConfetti, launchConfettiAt } from '@/lib/confetti'

// Dev-only: preview the celebration confetti from the browser console —
// `launchConfetti()` for the full volley, `launchConfettiAt(x, y)` for the
// localized mini pop.
if (import.meta.env.DEV) {
  const w = window as unknown as Record<string, unknown>
  w.launchConfetti = launchConfetti
  w.launchConfettiAt = launchConfettiAt
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initializeSentry } from './lib/sentry'

// Initialize Sentry BEFORE React renders
// This ensures all errors during initialization are captured
initializeSentry()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initializeSentry, captureException } from './lib/sentry'

// Initialize Sentry BEFORE React renders
// This ensures all errors during initialization are captured
initializeSentry()

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  captureException(event.reason instanceof Error ? event.reason : new Error(String(event.reason)))
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

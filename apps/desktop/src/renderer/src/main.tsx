import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const container = document.getElementById('root')
if (container === null) {
  throw new TypeError('index.html has no #root element, so the renderer cannot mount the app.')
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

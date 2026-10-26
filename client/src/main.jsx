import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { applyTheme, getCurrentTheme } from './utils/themeManager'

// Initialize active UI theme immediately on page load to prevent theme flicker
applyTheme(getCurrentTheme().id);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

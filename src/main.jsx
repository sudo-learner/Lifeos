import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { useThemeStore } from './store/useThemeStore'

// Apply the saved theme before first paint to avoid a flash of the wrong theme
useThemeStore.getState().init()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* HashRouter is used so deep links work correctly when hosted on
        GitHub Pages, which does not support client-side route rewrites. */}
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)

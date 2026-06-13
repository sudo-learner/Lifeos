import { create } from 'zustand'
import { persist } from 'zustand/middleware'

function applyThemeClass(theme) {
  const root = document.documentElement
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = theme === 'dark' || (theme === 'system' && systemDark)
  root.classList.toggle('dark', isDark)
}

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'system', // 'light' | 'dark' | 'system'
      setTheme: (theme) => {
        set({ theme })
        applyThemeClass(theme)
      },
      init: () => {
        applyThemeClass(get().theme)
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
          if (get().theme === 'system') applyThemeClass('system')
        })
      },
    }),
    { name: 'lifeos-theme' }
  )
)

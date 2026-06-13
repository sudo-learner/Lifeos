import { LuMenu, LuSearch, LuSun, LuMoon, LuMonitor } from 'react-icons/lu'
import { useUIStore } from '../../store/useUIStore'
import { useThemeStore } from '../../store/useThemeStore'

const THEME_CYCLE = ['light', 'dark', 'system']
const THEME_ICON = { light: LuSun, dark: LuMoon, system: LuMonitor }

export default function TopBar({ title }) {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const openSearch = useUIStore((s) => s.openSearch)
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)

  function cycleTheme() {
    const idx = THEME_CYCLE.indexOf(theme)
    setTheme(THEME_CYCLE[(idx + 1) % THEME_CYCLE.length])
  }

  const ThemeIcon = THEME_ICON[theme]

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border dark:border-border-dark bg-base/80 dark:bg-base-dark/80 backdrop-blur px-4 py-3 md:px-6">
      <button className="md:hidden btn-ghost p-2" onClick={toggleSidebar} aria-label="Open menu">
        <LuMenu size={20} />
      </button>

      <h1 className="font-display font-semibold text-lg truncate">{title}</h1>

      <div className="flex-1" />

      <button
        onClick={openSearch}
        className="hidden sm:flex items-center gap-2 rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-3 py-1.5 text-sm text-muted dark:text-muted-dark hover:border-violet/50 transition-colors"
      >
        <LuSearch size={15} />
        <span>Search everything</span>
        <kbd className="text-[10px] font-mono border border-border dark:border-border-dark rounded px-1 ml-2">Ctrl K</kbd>
      </button>
      <button onClick={openSearch} className="sm:hidden btn-ghost p-2" aria-label="Search">
        <LuSearch size={18} />
      </button>

      <button onClick={cycleTheme} className="btn-ghost p-2" aria-label={`Theme: ${theme}`} title={`Theme: ${theme}`}>
        <ThemeIcon size={18} />
      </button>
    </header>
  )
}

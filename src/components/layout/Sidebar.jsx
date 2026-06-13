import { NavLink } from 'react-router-dom'
import {
  LuLayoutDashboard,
  LuListChecks,
  LuMap,
  LuTarget,
  LuFlame,
  LuChartBar,
  LuNotebookPen,
  LuCalendarDays,
  LuTimer,
  LuAward,
  LuSettings,
  LuX,
} from 'react-icons/lu'
import { useUIStore } from '../../store/useUIStore'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LuLayoutDashboard },
  { to: '/routines', label: 'Routines', icon: LuListChecks },
  { to: '/roadmap', label: 'Roadmap', icon: LuMap },
  { to: '/goals', label: 'Goals', icon: LuTarget },
  { to: '/habits', label: 'Habits', icon: LuFlame },
  { to: '/analytics', label: 'Analytics', icon: LuChartBar },
  { to: '/notes', label: 'Notes', icon: LuNotebookPen },
  { to: '/calendar', label: 'Calendar', icon: LuCalendarDays },
  { to: '/pomodoro', label: 'Pomodoro', icon: LuTimer },
  { to: '/achievements', label: 'Achievements', icon: LuAward },
  { to: '/settings', label: 'Settings', icon: LuSettings },
]

function SidebarContent() {
  const closeSidebar = useUIStore((s) => s.closeSidebar)
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-aurora flex items-center justify-center text-white font-display font-bold text-sm">
            L
          </div>
          <span className="font-display font-semibold text-lg">LifeOS</span>
        </div>
        <button className="md:hidden btn-ghost p-1.5" onClick={closeSidebar} aria-label="Close menu">
          <LuX size={18} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-1 pb-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={closeSidebar}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-aurora-soft text-violet dark:text-teal-soft'
                  : 'text-muted dark:text-muted-dark hover:bg-surface2 dark:hover:bg-surface2-dark hover:text-ink dark:hover:text-ink-dark'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-border dark:border-border-dark">
        <p className="text-xs text-muted dark:text-muted-dark font-mono">
          All data stays on this device.
        </p>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const closeSidebar = useUIStore((s) => s.closeSidebar)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r border-border dark:border-border-dark bg-surface dark:bg-surface-dark shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={closeSidebar} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-surface dark:bg-surface-dark shadow-xl">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}

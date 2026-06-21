import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import CommandPalette from '../CommandPalette'
import PomodoroWidget from '../PomodoroWidget'

const TITLES = {
  '/': 'Dashboard',
  '/routines': 'Daily Routines',
  '/roadmap': 'Roadmap Tracker',
  '/goals': 'Goals',
  '/habits': 'Habit Tracker',
  '/analytics': 'Analytics',
  '/notes': 'Notes & Journal',
  '/calendar': 'Calendar',
  '/pomodoro': 'Pomodoro Timer',
  '/achievements': 'Achievements',
  '/settings': 'Settings',
}

export default function Layout() {
  const location = useLocation()
  const title = TITLES[location.pathname] || 'LifeOS'

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title={title} />
        <main className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      <CommandPalette />
      <PomodoroWidget />
    </div>
  )
}

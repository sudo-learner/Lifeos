import { useEffect, Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import { initSettingsIfNeeded } from './db/db'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Routines = lazy(() => import('./pages/Routines'))
const Roadmap = lazy(() => import('./pages/Roadmap'))
const Goals = lazy(() => import('./pages/Goals'))
const Habits = lazy(() => import('./pages/Habits'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Notes = lazy(() => import('./pages/Notes'))
const CalendarView = lazy(() => import('./pages/CalendarView'))
const Pomodoro = lazy(() => import('./pages/Pomodoro'))
const Achievements = lazy(() => import('./pages/Achievements'))
const Settings = lazy(() => import('./pages/Settings'))

function PageLoader() {
  return <div className="text-sm text-muted dark:text-muted-dark py-12 text-center">Loading...</div>
}

export default function App() {
  useEffect(() => {
<<<<<<< HEAD
  initSettingsIfNeeded()
}, [])
=======
    initSettingsIfNeeded()
  }, [])

>>>>>>> a8b123a50482b2314ceebd2db4c8702d766be6eb
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/routines" element={<Routines />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/pomodoro" element={<Pomodoro />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

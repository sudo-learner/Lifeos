import { useRef, useState } from 'react'
import { LuSun, LuMoon, LuMonitor, LuDownload, LuUpload, LuTrash2, LuBell, LuTarget, LuInfo } from 'react-icons/lu'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import { useSettings } from '../hooks/useLiveData'
import { updateSettings, exportAllData, importAllData, resetAllData } from '../db/db'
import { useThemeStore } from '../store/useThemeStore'

const THEME_OPTIONS = [
  { id: 'light', label: 'Light', icon: LuSun },
  { id: 'dark', label: 'Dark', icon: LuMoon },
  { id: 'system', label: 'System', icon: LuMonitor },
]

export default function Settings() {
  const settings = useSettings()
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const fileInputRef = useRef(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [importMessage, setImportMessage] = useState('')
  const [notifPermission, setNotifPermission] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported')

  if (!settings) return null

  async function handleExport() {
    const data = await exportAllData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lifeos-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await importAllData(data)
      setImportMessage('Backup restored successfully.')
    } catch (err) {
      setImportMessage('Could not import this file. Make sure it is a valid LifeOS backup.')
    } finally {
      e.target.value = ''
      setTimeout(() => setImportMessage(''), 4000)
    }
  }

  async function handleReset() {
    await resetAllData()
    setConfirmReset(false)
    window.location.reload()
  }

  async function toggleNotifications() {
    if (!settings.notificationsEnabled) {
      if (typeof Notification !== 'undefined') {
        const perm = await Notification.requestPermission()
        setNotifPermission(perm)
        if (perm !== 'granted') return
      }
      await updateSettings({ notificationsEnabled: true })
    } else {
      await updateSettings({ notificationsEnabled: false })
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-semibold">Settings</h1>
        <p className="text-sm text-muted dark:text-muted-dark mt-1">Customize LifeOS and manage your data.</p>
      </div>

      {/* Appearance */}
      <Card>
        <h2 className="font-display font-semibold mb-3">Appearance</h2>
        <div className="flex gap-2">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setTheme(opt.id)}
              className={`flex-1 flex flex-col items-center gap-1.5 rounded-lg border py-3 text-sm font-medium transition-colors ${
                theme === opt.id ? 'border-violet bg-aurora-soft text-violet dark:text-teal-soft' : 'border-border dark:border-border-dark text-muted dark:text-muted-dark hover:text-ink dark:hover:text-ink-dark'
              }`}
            >
              <opt.icon size={18} />
              {opt.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Productivity */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <LuTarget className="text-violet dark:text-teal-soft" size={18} />
          <h2 className="font-display font-semibold">Streaks</h2>
        </div>
        <label className="label">Completion threshold for a "successful day" ({settings.streakThreshold}%)</label>
        <input
          type="range"
          min={10}
          max={100}
          step={10}
          value={settings.streakThreshold}
          onChange={(e) => updateSettings({ streakThreshold: Number(e.target.value) })}
          className="w-full accent-violet"
        />
        <p className="text-xs text-muted dark:text-muted-dark mt-1">
          A day counts toward your streak when at least this percentage of your routines are completed.
        </p>
      </Card>

      {/* Notifications */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <LuBell className="text-violet dark:text-teal-soft" size={18} />
          <h2 className="font-display font-semibold">Notifications</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Browser notifications</p>
            <p className="text-xs text-muted dark:text-muted-dark">Get notified when a Pomodoro session or break finishes.</p>
          </div>
          <button
            onClick={toggleNotifications}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${settings.notificationsEnabled ? 'bg-aurora' : 'bg-surface2 dark:bg-surface2-dark'}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${settings.notificationsEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
        {notifPermission === 'denied' && (
          <p className="text-xs text-red-500 mt-2">Notifications are blocked in your browser settings. Enable them for this site to use this feature.</p>
        )}
        <div className="mt-3">
          <label className="label">Daily reminder time (while LifeOS is open)</label>
          <input
            type="time"
            className="input w-40"
            value={settings.reminderTime}
            onChange={(e) => updateSettings({ reminderTime: e.target.value })}
          />
        </div>
      </Card>

      {/* Backup & Restore */}
      <Card>
        <h2 className="font-display font-semibold mb-3">Backup & Restore</h2>
        <p className="text-sm text-muted dark:text-muted-dark mb-3">
          All your data lives only in this browser. Export a backup regularly, especially before clearing browser data or switching devices.
        </p>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={handleExport}><LuDownload size={16} /> Export Backup (JSON)</button>
          <button className="btn-secondary" onClick={handleImportClick}><LuUpload size={16} /> Import Backup</button>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
        </div>
        {importMessage && <p className="text-sm mt-2 text-violet dark:text-teal-soft">{importMessage}</p>}
      </Card>

      {/* Danger zone */}
      <Card className="border-red-500/30">
        <h2 className="font-display font-semibold mb-3 text-red-600 dark:text-red-400">Danger Zone</h2>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Reset all data</p>
            <p className="text-xs text-muted dark:text-muted-dark">Permanently deletes everything: routines, roadmap, goals, habits, notes, and settings.</p>
          </div>
          <button className="btn-danger shrink-0" onClick={() => setConfirmReset(true)}><LuTrash2 size={16} /> Reset</button>
        </div>
      </Card>

      {/* About */}
      <Card className="flex items-start gap-3">
        <LuInfo className="text-muted dark:text-muted-dark shrink-0 mt-0.5" size={18} />
        <div className="text-sm text-muted dark:text-muted-dark">
          <p className="font-medium text-ink dark:text-ink-dark font-display mb-1">LifeOS</p>
          <p>A personal productivity dashboard. 100% free, runs entirely in your browser, and works offline once installed. No account, no servers, no ads.</p>
        </div>
      </Card>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset all data?" maxWidth="max-w-sm">
        <p className="text-sm text-muted dark:text-muted-dark">
          This will permanently delete everything in LifeOS and cannot be undone. Consider exporting a backup first.
        </p>
        <div className="flex justify-end gap-2 pt-4">
          <button className="btn-secondary" onClick={() => setConfirmReset(false)}>Cancel</button>
          <button className="btn-danger" onClick={handleReset}>Reset Everything</button>
        </div>
      </Modal>
    </div>
  )
}

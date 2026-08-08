import { exportAllData, updateSettings } from '../db/db'

// Triggers a browser download of a full data backup as JSON, and records
// when it happened (settings.lastBackupAt) so we know whether the next
// automatic backup is due yet.
//
// Downloaded files land in the device's normal Downloads folder, which is
// separate from the app's own storage — so unlike IndexedDB, a backup file
// here survives even if the app itself is later uninstalled or its site
// data is cleared.
export async function triggerBackupDownload({ silent = false } = {}) {
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
  await updateSettings({ lastBackupAt: new Date().toISOString() })
  return { silent }
}

export function daysSince(isoDate) {
  if (!isoDate) return Infinity
  const diffMs = Date.now() - new Date(isoDate).getTime()
  return diffMs / (1000 * 60 * 60 * 24)
}

// Called once at app startup. If auto-backup is enabled and the last backup
// is older than the configured frequency (or there has never been one),
// silently downloads a fresh backup file — no button press needed.
export async function runAutoBackupIfDue(settings) {
  if (!settings?.autoBackupEnabled) return
  const dueDays = settings.autoBackupFrequencyDays || 7
  if (daysSince(settings.lastBackupAt) < dueDays) return
  try {
    await triggerBackupDownload({ silent: true })
  } catch {
    // A failed automatic backup shouldn't break app startup — the user can
    // still back up manually from Settings, and we'll retry next launch.
  }
}

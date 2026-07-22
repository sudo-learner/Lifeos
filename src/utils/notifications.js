// Central helper for showing/closing notifications reliably across browsers.
//
// Important: Android Chrome (and most mobile browsers) do NOT support the
// page-level `new Notification()` constructor at all — calling it directly
// throws "TypeError: Illegal constructor". The only reliable way to show a
// notification on mobile, especially for an installed PWA, is through the
// active service worker: `registration.showNotification()`. Every notification
// in this app — the test button, the Pomodoro live/alert notifications —
// goes through this single module so that fix only has to live in one place.

export function notificationsSupported() {
  return typeof Notification !== 'undefined'
}

export function notificationPermission() {
  return notificationsSupported() ? Notification.permission : 'unsupported'
}

export async function requestNotificationPermission() {
  if (!notificationsSupported()) return 'unsupported'
  return Notification.requestPermission()
}

// Returns { ok: true } on success, or { ok: false, reason } so callers can
// show the user *why* it didn't work instead of failing silently.
export async function showAppNotification(title, options = {}) {
  if (!notificationsSupported()) {
    return { ok: false, reason: 'unsupported' }
  }
  if (Notification.permission !== 'granted') {
    return { ok: false, reason: 'no-permission' }
  }

  // Preferred path: through the service worker. Works on desktop AND mobile
  // (including installed/standalone PWAs), and lets a tap on the
  // notification re-open the app (handled in src/sw.js).
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready
      await reg.showNotification(title, options)
      return { ok: true }
    } catch (err) {
      // fall through to the page-level constructor below
    }
  }

  // Fallback for browsers with no service worker support at all (rare, and
  // will itself throw on many mobile browsers — hence why it's a fallback,
  // not the primary path).
  try {
    new Notification(title, options)
    return { ok: true }
  } catch (err) {
    return { ok: false, reason: 'failed', error: err }
  }
}

export async function closeAppNotifications(tag) {
  if (!('serviceWorker' in navigator)) return
  try {
    const reg = await navigator.serviceWorker.ready
    const list = await reg.getNotifications({ tag })
    list.forEach((n) => n.close())
  } catch {
    // ignore — nothing to close
  }
}

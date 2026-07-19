import { precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

self.skipWaiting()
clientsClaim()

// Required by vite-plugin-pwa's injectManifest strategy — this placeholder
// is replaced at build time with the actual list of files to precache.
precacheAndRoute(self.__WB_MANIFEST)

// Tapping a LifeOS notification (e.g. the Pomodoro timer notification)
// focuses an already-open tab/window if there is one, otherwise opens a
// new one — so the user lands back in the app instead of just dismissing
// the notification.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow('./')
    })
  )
})

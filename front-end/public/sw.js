// public/sw.js
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  clients.claim()
})

self.addEventListener('fetch', (event) => {
  // This can be expanded later for caching etc.
})

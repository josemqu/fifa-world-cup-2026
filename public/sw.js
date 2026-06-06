// Empty service worker to resolve leftover registration 404s from other localhost projects
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.clients.claim();
});

// Service Worker for Web Push Notifications
// FIFA World Cup 2026 — Prode

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", function (event) {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: "Mundial 2026",
      body: event.data.text(),
    };
  }

  const options = {
    body: data.body || "",
    icon: data.icon || "/icon.svg",
    badge: "/icon.svg",
    data: {
      url: data.url || "/prode",
    },
    vibrate: [100, 50, 100],
    actions: [
      {
        action: "open",
        title: "Ver",
      },
    ],
    tag: data.tag || "prode-notification",
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Mundial 2026", options)
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const url = event.notification.data?.url || "/prode";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        // If a window is already open, focus it and navigate
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            client.navigate(url);
            return;
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

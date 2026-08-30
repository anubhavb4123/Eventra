// ============================================================
// Eventra — Firebase Cloud Messaging Service Worker
// ============================================================
// Handles background push notifications when website is closed or backgrounded.

importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

// Initialize Firebase inside the Service Worker
firebase.initializeApp({
  apiKey: 'AIzaSyAV4BO8diVfhiCFBJC084r7qQfHmzfCxhc',
  authDomain: 'eventra4123.firebaseapp.com',
  projectId: 'eventra4123',
  storageBucket: 'eventra4123.firebasestorage.app',
  messagingSenderId: '537991147743',
  appId: '1:537991147743:web:8ab939e826854008bbb96a',
  databaseURL: 'https://eventra4123-default-rtdb.asia-southeast1.firebasedatabase.app/',
});

const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received:', payload);

  const title = payload.notification?.title || payload.data?.title || 'Eventra Notification';
  const body = payload.notification?.body || payload.data?.body || 'You have a new update from Eventra.';
  const icon = payload.notification?.icon || payload.data?.icon || '/favicon.svg';
  const tag = payload.data?.tag || 'eventra-push';
  const clickAction = payload.data?.url || payload.fcmOptions?.link || '/';

  const notificationOptions = {
    body,
    icon,
    badge: '/favicon.svg',
    tag,
    data: {
      url: clickAction,
      ...payload.data,
    },
    requireInteraction: false,
  };

  return self.registration.showNotification(title, notificationOptions);
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event.notification);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing tab if open to same origin
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client && urlToOpen !== '/') {
            client.navigate(urlToOpen);
          }
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

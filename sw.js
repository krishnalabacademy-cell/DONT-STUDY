
const CACHE_NAME = 'nahi-padhiyega-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/logo192.png',
  '/logo512.png'
  // Other static assets will be cached on the fly
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Don't cache Gemini API requests
  if (event.request.url.includes('generativelanguage.googleapis.com')) {
    return;
  }
  
  // Serve from network first for CDN scripts to get latest versions, then cache.
  if (event.request.url.includes('cdn.tailwindcss.com') || event.request.url.includes('esm.sh')) {
     event.respondWith(
        fetch(event.request).then(response => {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        }).catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }


  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          response => {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
    );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Handle notification click to focus or open the app
self.addEventListener('notificationclick', event => {
  event.notification.close();

  // This logic tries to find an existing window and focus it.
  // If no window is open, it opens a new one.
  event.waitUntil(clients.matchAll({
    type: "window",
    includeUncontrolled: true
  }).then(clientList => {
    for (const client of clientList) {
      if (client.url === self.registration.scope && 'focus' in client) {
        return client.focus();
      }
    }
    if (clients.openWindow) {
      return clients.openWindow(self.registration.scope);
    }
  }));
});

// Import Workbox from CDN
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

// Initialize Workbox
if (workbox) {
  console.log('Workbox is loaded');
  
  // Enable debug mode in development
  if (process.env.NODE_ENV === 'development') {
    workbox.setConfig({ debug: true });
  }
} else {
  console.log('Workbox failed to load');
}

// Precache all static assets
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);

// Clean up outdated caches
workbox.precaching.cleanupOutdatedCaches();

// Cache API responses with network-first strategy
workbox.routing.registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new workbox.strategies.NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 3,
    plugins: [
      {
        cacheKeyWillBeUsed: async ({ request }) => {
          return `${request.url}?${Date.now()}`;
        },
      },
    ],
  })
);

// Cache images with cache-first strategy
workbox.routing.registerRoute(
  ({ request }) => request.destination === 'image',
  new workbox.strategies.CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
      {
        cacheWillUpdate: async ({ response }) => {
          return response.status === 200 ? response : null;
        },
      },
    ],
  })
);

// Cache CSS and JS files with stale-while-revalidate
workbox.routing.registerRoute(
  ({ request }) =>
    request.destination === 'style' || request.destination === 'script',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'static-resources',
  })
);

// Background sync for offline operations
const bgSyncQueue = new workbox.backgroundSync.Queue('reminder-sync', {
  onSync: async ({ queue }) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request);
      } catch (error) {
        console.error('Background sync failed:', error);
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  },
});

// Handle offline API requests with background sync
workbox.routing.registerRoute(
  ({ url }) => url.pathname.startsWith('/api/') && url.pathname !== '/api/auth/login',
  async ({ event }) => {
    try {
      const response = await fetch(event.request.clone());
      return response;
    } catch (error) {
      // Add to background sync queue if offline (except for login requests)
      if (event.request.method === 'POST' || event.request.method === 'PUT' || event.request.method === 'DELETE') {
        await bgSyncQueue.pushRequest({ request: event.request });
      }
      
      // Return cached response if available
      const cache = await caches.open('api-cache');
      const cachedResponse = await cache.match(event.request);
      
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Return offline fallback
      return new Response(
        JSON.stringify({ 
          error: 'Offline', 
          message: 'Request queued for sync when online' 
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }
);

// Handle install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  self.skipWaiting();
});

// Handle activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(self.clients.claim());
});

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/logo192.png',
      badge: '/logo192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey,
      },
      actions: [
        {
          action: 'explore',
          title: 'View Reminder',
          icon: '/logo192.png',
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/logo192.png',
        },
      ],
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});
// Service Worker personalizado para PWA con Push Notifications
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

// Configurar Workbox
workbox.setConfig({
  debug: false
});

// Precaching de recursos estáticos usando el manifest generado por Workbox
import { precacheAndRoute } from 'workbox-precaching';

// ⬅️ Esto es obligatorio cuando usás injectManifest
precacheAndRoute(self.__WB_MANIFEST || []);

// Estrategias de cache para diferentes tipos de recursos
workbox.routing.registerRoute(
  /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
  new workbox.strategies.CacheFirst({
    cacheName: 'google-fonts',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 4,
        maxAgeSeconds: 365 * 24 * 60 * 60 // 365 days
      })
    ]
  })
);

workbox.routing.registerRoute(
  /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'static-font-assets',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 4,
        maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
      })
    ]
  })
);

workbox.routing.registerRoute(
  /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'static-image-assets',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 64,
        maxAgeSeconds: 24 * 60 * 60 // 24 hours
      })
    ]
  })
);

workbox.routing.registerRoute(
  /\/_next\/image\?url=.+$/i,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'next-image',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 64,
        maxAgeSeconds: 24 * 60 * 60 // 24 hours
      })
    ]
  })
);

workbox.routing.registerRoute(
  /\.(?:js)$/i,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'static-js-assets',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 32,
        maxAgeSeconds: 24 * 60 * 60 // 24 hours
      })
    ]
  })
);

workbox.routing.registerRoute(
  /\.(?:css|less)$/i,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'static-style-assets',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 32,
        maxAgeSeconds: 24 * 60 * 60 // 24 hours
      })
    ]
  })
);

workbox.routing.registerRoute(
  /\/_next\/data\/.+\/.+\.json$/i,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'next-data',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 32,
        maxAgeSeconds: 24 * 60 * 60 // 24 hours
      })
    ]
  })
);

workbox.routing.registerRoute(
  /\.(?:json|xml|csv)$/i,
  new workbox.strategies.NetworkFirst({
    cacheName: 'static-data-assets',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 32,
        maxAgeSeconds: 24 * 60 * 60 // 24 hours
      })
    ]
  })
);

// Cache para APIs
workbox.routing.registerRoute(
  ({ url }) => {
    const sameOrigin = self.origin === url.origin;
    const isApi = url.pathname.startsWith('/api/');
    return sameOrigin && isApi;
  },
  new workbox.strategies.NetworkFirst({
    cacheName: 'apis',
    networkTimeoutSeconds: 10,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 16,
        maxAgeSeconds: 24 * 60 * 60 // 24 hours
      })
    ]
  })
);

// Cache para otras rutas del mismo origen
workbox.routing.registerRoute(
  ({ url }) => {
    const sameOrigin = self.origin === url.origin;
    const isApi = url.pathname.startsWith('/api/');
    return sameOrigin && !isApi;
  },
  new workbox.strategies.NetworkFirst({
    cacheName: 'others',
    networkTimeoutSeconds: 10,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 32,
        maxAgeSeconds: 24 * 60 * 60 // 24 hours
      })
    ]
  })
);

// Cache para recursos cross-origin
workbox.routing.registerRoute(
  ({ url }) => {
    const sameOrigin = self.origin === url.origin;
    return !sameOrigin;
  },
  new workbox.strategies.NetworkFirst({
    cacheName: 'cross-origin',
    networkTimeoutSeconds: 10,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 32,
        maxAgeSeconds: 60 * 60 // 1 hour
      })
    ]
  })
);

// Manejo de Push Notifications
self.addEventListener('push', function(event) {
  console.log('Push event received:', event);
  
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'Nueva notificación',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1,
        url: data.url || '/'
      },
      actions: [
        {
          action: 'explore',
          title: 'Ver más',
          icon: '/icon-192.png'
        },
        {
          action: 'close',
          title: 'Cerrar',
          icon: '/icon-192.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Tienda de Libros', options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  console.log('Notification click received:', event);
  
  event.notification.close();

  if (event.action === 'explore') {
    // Abrir la aplicación
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/')
    );
  } else if (event.action === 'close') {
    // Solo cerrar la notificación
    event.notification.close();
  } else {
    // Click en la notificación principal
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/')
    );
  }
});

self.addEventListener('notificationclose', function(event) {
  console.log('Notification closed:', event);
});

// Limpiar caches antiguos
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== 'google-fonts' && cacheName !== 'static-font-assets') {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
}); 
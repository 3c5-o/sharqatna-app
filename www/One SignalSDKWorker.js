// استيراد OneSignal SDK
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

// إعدادات التخزين المؤقت
const CACHE_VERSION = 'sharqatna-v6';
const CACHE_NAME = `sharqatna-cache-${CACHE_VERSION}`;

// الملفات الأساسية للتخزين المؤقت
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// ============================================
// مرحلة التثبيت (Install)
// ============================================
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching core assets');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Skip waiting');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Install failed:', error);
      })
  );
});

// ============================================
// مرحلة التفعيل (Activate)
// ============================================
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName.startsWith('sharqatna-cache-') && cacheName !== CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[Service Worker] Claiming clients');
        return self.clients.claim();
      })
  );
});

// ============================================
// معالجة الطلبات (Fetch)
// ============================================
self.addEventListener('fetch', (event) => {
  // تجاهل الطلبات غير GET
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // ============================================
  // استراتيجية الملفات المحلية (Cache First)
  // ============================================
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[Service Worker] Serving from cache:', event.request.url);
            
            // تحديث الكاش في الخلفية
            fetch(event.request)
              .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                  caches.open(CACHE_NAME)
                    .then((cache) => {
                      cache.put(event.request, networkResponse);
                    });
                }
              })
              .catch(() => {
                // تجاهل أخطاء الشبكة
              });
            
            return cachedResponse;
          }

          // إذا لم يكن في الكاش، جلب من الشبكة
          return fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseToCache);
                  });
              }
              return networkResponse;
            })
            .catch(() => {
              // في حالة الفشل، إرجاع صفحة خطأ بسيطة
              if (event.request.destination === 'document') {
                return caches.match('./index.html');
              }
              return new Response('Offline', { status: 503 });
            });
        })
    );
    return;
  }

  // ============================================
  // استراتيجية الموارد الخارجية (Network First)
  // ============================================
  if (url.hostname.includes('gstatic.com') || 
      url.hostname.includes('cloudflare') ||
      url.hostname.includes('top4top.io')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // ============================================
  // باقي الطلبات (Network Only)
  // ============================================
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return new Response('Offline', { status: 503 });
      })
  );
});

// ============================================
// معالجة الإشعارات (Notifications)
// ============================================

// عند استلام إشعار
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.notification.tag);
  
  event.notification.close();

  // فتح التطبيق عند الضغط على الإشعار
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // إذا كان التطبيق مفتوحاً، تفعيله
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // إذا لم يكن مفتوحاً، فتحه
        if (clients.openWindow) {
          return clients.openWindow('./index.html');
        }
      })
  );
});

// عند إغلاق الإشعار
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed:', event.notification.tag);
});

// ============================================
// معالجة الرسائل (Messages)
// ============================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Received SKIP_WAITING message');
    self.skipWaiting();
  }
});

// ============================================
// معالجة المزامنة في الخلفية (Background Sync)
// ============================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notifications') {
    console.log('[Service Worker] Background sync for notifications');
    event.waitUntil(
      // يمكن إضافة منطق مزامنة هنا
      Promise.resolve()
    );
  }
});

// ============================================
// معالجة الدفع (Push) - لـ OneSignal
// ============================================
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');
  // OneSignal يدير الإشعارات تلقائياً، لكن يمكن تخصيصها هنا إذا لزم الأمر
});

console.log('[Service Worker] OneSignalSDKWorker.js loaded successfully');

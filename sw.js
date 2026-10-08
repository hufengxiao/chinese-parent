/* ============================================================
 * 中国式家长 H5 — Service Worker (PWA Offline Cache)
 * ============================================================ */
const CACHE_NAME = 'chinese-parent-v2.7.0';
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/data.js',
  './js/core.js',
  './js/ui.js',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        PRECACHE_ASSETS.map(url =>
          fetch(url).then(res => {
            if (res.ok) return cache.put(url, res);
            return Promise.reject(new Error(`Failed to load ${url}: ${res.status}`));
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // 仅缓存同源 GET 请求
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(cachedResponse => {
      // 找到缓存则直接使用，同时在后台静默发起网络拉取更新（Stale-While-Revalidate）
      const fetchPromise = fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, resClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // 离线无网时静默忽略网络异常
      });

      return cachedResponse || fetchPromise;
    })
  );
});

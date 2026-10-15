/* ============================================================
 * 中国式家长 H5 — Service Worker (PWA Offline Cache)
 * ============================================================ */
const CACHE_NAME = 'chinese-parent-v3.0.0';
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
      // 1) 缓存命中：立即返回缓存，并在后台静默发起网络拉取更新（Stale-While-Revalidate）
      if (cachedResponse) {
        fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const resClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, resClone);
            });
          }
        }).catch(() => {
          // 后台静默刷新失败时忽略异常
        });
        return cachedResponse;
      }

      // 2) 缓存未命中：发起网络请求
      return fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, resClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // 3) 离线网络故障兜底：绝对不得返回 undefined，防止 respondWith 抛错崩溃 (P0-4)
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html').then(fallback => {
            if (fallback) return fallback;
            return new Response(
              '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>中国式家长 - 离线提示</title></head><body><h2>游戏处于离线状态</h2><p>请检查网络连接后重试。</p></body></html>',
              { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
            );
          });
        }
        return new Response('', { status: 504, statusText: 'Gateway Timeout (Offline)' });
      });
    })
  );
});

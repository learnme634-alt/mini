// غيّر رقم النسخة (v1 -> v2 -> v3...) مع كل نشر جديد على GitHub
// هذا هو السطر الوحيد اللي لازم تعدله بكل تحديث
const CACHE_VERSION = 'v4';
const CACHE_NAME = `play-platform-${CACHE_VERSION}`;

const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
];

// عند التثبيت: خزّن الملفات، وفعّل النسخة الجديدة فوراً بدون انتظار إغلاق كل التابات
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// عند التفعيل: امسح أي كاش قديم من نسخة سابقة، وخذ السيطرة على الصفحات المفتوحة فوراً
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// عند الطلب:
// - لصفحة index.html (أو أي تنقل بين الصفحات): جيب من النت أولاً (Network First)
//   عشان يكون عندك آخر تحديث دايماً، وارجع للكاش بس لو ما فيه نت (Offline)
// - لباقي الملفات (صور، manifest...): جيب من الكاش أولاً وإذا مو موجود جيب من النت
self.addEventListener('fetch', event => {
  const isNavigation = event.request.mode === 'navigate' ||
    (event.request.method === 'GET' && event.request.headers.get('accept')?.includes('text/html'));

  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});

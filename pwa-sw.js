
let CACHE_NAME = 'im-cache-v1';

self.addEventListener('install', e => {
    console.log('install...', e);
    // cache files
    e.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            console.log('...cache open', CACHE_NAME);
            cache.addAll([
                './',
                './index.html',
                './favicon.png',
                './pwa/icon-192.png',
                './pwa/icon-512.png',
                './pwa/manifest.json'
            ]);
        })
        .then(() => console.log('-> installed!'))
    );
});

self.addEventListener('activate', e => {
    console.log('activate...', e);
    // remove old caches
    e.waitUntil(
        caches.keys().then(cacheNames => Promise.all(
            cacheNames.map(cacheName => {
                if (cacheName !== CACHE_NAME) {
                    console.log('...delete old cache', cacheName);
                    return caches.delete(cacheName);
                }
            })
        ))
        .then(() => console.log('-> activated!'))
    );
});

self.addEventListener('fetch', e => {
    console.log('fetch...', e.request.url, e);
    // try to find in cache
    e.respondWith(
        caches.match(e.request).then(response => {
            if (response) {
                // cache hit - return response
                console.log('-> match!');
                return response;
            }
            // cache miss - try to fetch online
            console.log('-> download!');
            return fetch(e.request).catch(reason => console.log());
        })
    );
});

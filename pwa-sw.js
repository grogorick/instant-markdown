
let CACHE_NAME = 'instant-markdown-offline-cache-v-1';

self.addEventListener('install', e => {
    console.log('install...', e);
    // cache files
    e.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            console.log('...cache open');
            cache.addAll([
                './',
                './favicon.png',
                './pwa/icon-192.png',
                './pwa/icon-512.png',
                './pwa/manifest.json'
            ]);
        })
        .then(() => console.log('-> installed!', CACHE_NAME))
    );
});

self.addEventListener('activate', e => {
    console.log('activate...');
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
        .then(() => console.log('-> activated!', CACHE_NAME))
    );
});

self.addEventListener('fetch', e => {
    console.log('fetch...', e.request.url);
    // try to find in cache
    e.respondWith(
        caches.match(e.request).then(response => {
            if (response) {
                // cache hit - return response
                console.log('-> match!');
                return response;
            }
            // cache miss - try to fetch online
            return fetch(e.request)
                .then(() => console.log('-> download!'))
                .catch(reason => console.log('-> failed!', reason));
        })
    );
});

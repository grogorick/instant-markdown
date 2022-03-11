
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
        .then(() => console.log('-> installed', CACHE_NAME))
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
        .then(() => console.log('-> activated', CACHE_NAME))
    );
});

self.addEventListener('fetch', e => {
    let counter = new URL(e.request.url).pathname;
    console.log(counter + ': fetch...');
    // try to find in cache
    e.respondWith(
        caches.match(e.request).then(cacheResponse => {
            if (cacheResponse) {
                console.log(counter + ': -> match');
                return cacheResponse;
            }
            console.log(counter + ': ...not in cache');
            return fetch(e.request).then(onlineResponse => {
                if (onlineResponse && onlineResponse.status === 200)
                    console.log(counter + ': -> downloaded');
                else
                    console.log(counter + ': -> failed');
                return onlineResponse;
            });
        })
    );
});

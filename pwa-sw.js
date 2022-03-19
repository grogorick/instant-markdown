let CACHE_VERSION = '7';
let CACHE_NAME = 'instant-markdown-offline-cache-v' + CACHE_VERSION;

self.addEventListener('message', async e => {
    if (e.data && e.data.type === 'LOG-VERSION')
        console.log('-> cache version: ', CACHE_VERSION);
});

self.addEventListener('install', e => {
    console.log('install...');
    // cache files
    e.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            console.log('...cache open');
            let cacheURLs = [
                './',
                './favicon.png',

                './css/general.css',

                './font/OpenSans-Bold.ttf',
                './font/OpenSans-Bold.woff',
                './font/OpenSans-Light.ttf',
                './font/OpenSans-Light.woff',

                './js/file-handling.js',
                './js/general.js',
                './js/markdown.js',
                './js/pwa.js',
                './js/settings.js',
                './js/utils.js',

                './pwa/icon-192.png',
                './pwa/icon-512.png',
                './pwa/manifest.json'
            ].map(url => url + '?v' + CACHE_VERSION);
            console.log('...cache:', cacheURLs);
            cache.addAll(cacheURLs);
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
    if (e.request.url.endsWith('GET-VERSION')) {
        e.respondWith(new Response(CACHE_VERSION));
        return;
    }

    let query = 'get: ' + new URL(e.request.url).pathname;
    // console.log(query + ': fetch...');
    let request = e.request.url + '?v' + CACHE_VERSION;
    e.respondWith(
        caches.match(request).then(cacheResponse => {
            if (cacheResponse) {
                console.log(query + ' -> in cache');
                return cacheResponse;
            }
            // console.log(query + ': ...not in cache');
            return fetch(request).then(onlineResponse => {
                if (onlineResponse && onlineResponse.status === 200)
                    console.log(query + ' -> downloaded');
                else
                    console.log(query + ' -> failed');
                return onlineResponse;
            });
        })
    );
});

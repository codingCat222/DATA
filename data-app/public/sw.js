const CACHE_NAME = 'jaysub-v1';
const urlsToCache = [
    '/',
    '/static/js/bundle.js',
    '/static/css/main.css',
    '/manifest.json',
    '/icon-192x192.png',
    '/icon-512x512.png'
];

// Install Prompt notification event
self.addEventListener('install', function(event) {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(function(cache) {
            console.log('Service Worker: Caching app shell');
            return cache.addAll(urlsToCache)
                .then(() => {
                    console.log('All resources cached successfully');
                })
                .catch(error => {
                    console.log('Cache addAll failed:', error);
                
                });
        })
        .then(() => {
            console.log('Service Worker: Skip waiting');
            return self.skipWaiting();
        })
    );
});


self.addEventListener('activate', function(event) {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        .then(function() {
            console.log('Service Worker: Claiming clients');
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', function(event) {
    
    if (event.request.method !== 'GET') return;
    
    
    if (event.request.url.indexOf('chrome-extension') !== -1) return;
    
    event.respondWith(
        caches.match(event.request)
        .then(function(response) {
        
            if (response) {
                console.log('Service Worker: Serving from cache', event.request.url);
                return response;
            }
            
            console.log('Service Worker: Fetching from network', event.request.url);
            return fetch(event.request)
                .then(function(fetchResponse) {
                
                    if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
                        return fetchResponse;
                    }
                    
                    
                    var responseToCache = fetchResponse.clone();
                    
            
                    caches.open(CACHE_NAME)
                        .then(function(cache) {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return fetchResponse;
                })
                .catch(function(error) {
                    console.log('Service Worker: Fetch failed, returning offline page', error);
                    
                    return new Response('Offline', {
                        status: 503,
                        statusText: 'Service Unavailable',
                        headers: new Headers({
                            'Content-Type': 'text/plain'
                        })
                    });
                });
        })
    );
});


self.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

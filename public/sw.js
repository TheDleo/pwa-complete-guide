importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

const CACHE_STATIC_NAME = 'static-v8';
const CACHE_DYNAMIC_NAME = 'dynamic-v2';
const STATIC_FILES = [
  '/',
  '/manifest.json',
  '/index.html',
  '/offline.html',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/idb.js',
  '/src/js/fetch.js',
  '/src/js/promise.js',
  '/src/js/material.min.js',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/images/main-image.jpg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
];

self.addEventListener('install', function (event) {
  console.log('[Service Worker] Installing Service Worker ...', event);
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME).then((cache) => {
      console.log('[Service Worker] pre-caching');
      cache.addAll(STATIC_FILES);
    })
  );
});

// a strategy for trimming old files from the cache.
// const trimCache = (cacheName, maxItems) => {
// 	caches.open(cacheName)
// 		.then((cache) => {
// 			return cache.keys().then((keys) => {
// 				console.log('cache keys ', keys);
// 				if (keys.length > maxItems) {
// 					cache.delete(keys[0])
// 						.then(trimCache(cacheName, maxItems));
// 				}
// 			});
// 		})
// }

self.addEventListener('activate', function (event) {
  console.log('[Service Worker] Activating Service Worker ....', event);
  event.waitUntil(
    caches.keys().then(function (keyList) {
      return Promise.all(
        keyList.map(function (key) {
          if (
            key !== CACHE_STATIC_NAME &&
            key !== CACHE_DYNAMIC_NAME
          ) {
            console.log('[ServiceWorkder] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

function isInArray(string, array) {
  var cachePath;
  if (string.indexOf(self.origin) === 0) { // request targets domain where we serve the page from (i.e. NOT a CDN)
    console.log('matched ', string);
    cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
  } else {
    cachePath = string; // store the full request (for CDNs)
  }
  return array.indexOf(cachePath) > -1;
}

self.addEventListener('fetch', function (event) {

  var url = 'https://pwagram-24227.firebaseio.com/posts.json';
  //cache with network
  if (event.request.url.indexOf(url) > -1) {
    event.respondWith(fetch(event.request)
      .then(function (res) {
        var clonedRes = res.clone();
        clearAllData('posts')
          .then(function () {
            console.log('clearing indexeddb data');
            return clonedRes.json();
          })
          .then(function (data) {
            for (var key in data) {
              writeData('posts', data[key]);
            }
          });
        return res;
      })
    );
  } else {
    //cache with network fallback
    event.respondWith(
      caches.match(event.request).then((response) => {

        if (response) {
          return response;
        } else {
          return fetch(event.request)
            .then((res) => {
              return caches
                .open(CACHE_DYNAMIC_NAME)
                .then((cache) => {
                  // console.log('call trimCache2');
                  // trimCache(CACHE_DYNAMIC_NAME, 10);
                  cache.put(event.request.url, res.clone());
                  return res;
                });
            })
            .catch(function (err) {
              return caches
                .open(CACHE_STATIC_NAME)
                .then(function (cache) {
                  if (event.request.headers.get('accept').includes('text/html')) {
                    return cache.match('/offline.html');
                  }
                });
            });
        }
      })
    );
  }
});

// self.addEventListener('fetch', function(event) {
// 	event.respondWith(
// 		caches.match(event.request).then((response) => {
// 			if (response) {
// 				return response;
// 			} else {
// 				return fetch(event.request)
// 					.then((res) => {
// 						return caches.open(CACHE_DYNAMIC_NAME).then((cache) => {
// 							cache.put(event.request.url, res.clone());
// 							return res;
// 						});
// 					})
// 					.catch(function(err) {
// 						return caches
// 							.open(CACHE_STATIC_NAME)
// 							.then(function(cache) {
// 								return cache.match('/offline.html');
// 							});
// 					});
// 			}
// 		})
// 	);
// });

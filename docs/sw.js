/* Bible Reader service worker — app shell + runtime JSON cache */
var CACHE_VERSION = "bible-reader-v2";
var SHELL_CACHE = CACHE_VERSION + "-shell";
var DATA_CACHE = CACHE_VERSION + "-data";

var SHELL_URLS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./js/reader.js",
  "./js/plan.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./json/books.json",
  "./json/reading-plan.json"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(function (cache) {
      return Promise.all(
        SHELL_URLS.map(function (url) {
          return cache.add(url).catch(function () {
            return null;
          });
        })
      ).then(function () {
        return self.skipWaiting();
      });
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (key) {
              return key.indexOf("bible-reader-") === 0 && key.indexOf(CACHE_VERSION) !== 0;
            })
            .map(function (key) {
              return caches.delete(key);
            })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

function isVerseJson(url) {
  return /\/json\/.+\.json(\?|$)/.test(url.pathname) && !/\/books\.json(\?|$)/.test(url.pathname);
}

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET") return;

  var url;
  try {
    url = new URL(request.url);
  } catch (e) {
    return;
  }

  // Same-origin only
  if (url.origin !== self.location.origin) return;

  // Verse JSON: cache-first after first successful fetch (offline chapters you've opened)
  if (isVerseJson(url)) {
    event.respondWith(
      caches.open(DATA_CACHE).then(function (cache) {
        return cache.match(request).then(function (cached) {
          if (cached) return cached;
          return fetch(request).then(function (response) {
            if (response && response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          });
        });
      })
    );
    return;
  }

  // App shell & books list: stale-while-revalidate
  event.respondWith(
    caches.match(request).then(function (cached) {
      var network = fetch(request)
        .then(function (response) {
          if (response && response.ok) {
            var copy = response.clone();
            caches.open(SHELL_CACHE).then(function (cache) {
              cache.put(request, copy);
            });
          }
          return response;
        })
        .catch(function () {
          return cached;
        });
      return cached || network;
    })
  );
});

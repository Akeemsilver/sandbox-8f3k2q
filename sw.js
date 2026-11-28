/* HHSL Command service worker: keeps the app opening when there is no signal.
   Data is handled by Firestore's own offline storage, so only the app files are cached here. */
const CACHE = 'ert-roster-v577';
/* 3.16: pictures and the font live in /assets/ with the content in the name; they are kept across versions and only downloaded when they change */
const ASSET_CACHE = 'hhsl-assets';
const ASSETS = [ "./assets/lato-400.cbff48bc.woff2", "./assets/lato-700.a53ca001.woff2", "./assets/photo-staff.79ae64fa.webp", "./assets/photo-hero.c4bbb412.webp", "./assets/photo-atl.52e4aa95.webp", "./assets/logo-round.3f5b0675.webp"];
/* 3.85: the app's style and code files, fingerprinted; required at install and kept across versions until they change */
const APP_FILES = ["./assets/app.b43b8550.css", "./assets/app-boot.96bf27e0.js", "./assets/app-main.6ac8200f.js"];
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'];

/* 4.6: the new version is saved in the background and waits; the app shows "New version ready - Update".
   Tapping Update tells this worker to take over, and the page reloads once. */
self.addEventListener('install', function (e) {
  e.waitUntil(Promise.all([
    caches.open(CACHE).then(function (c) {
      return c.addAll(SHELL.map(function (u) { return new Request(u, { cache: 'reload' }); }));
    }),
    caches.open(ASSET_CACHE).then(function (c) {
      return c.addAll(APP_FILES.filter(function (u) { return true; }).map(function (u) { return new Request(u, { cache: 'reload' }); }));
    }),
    caches.open(ASSET_CACHE).then(function (c) {
      return Promise.all(ASSETS.map(function (u) {
        return c.match(u).then(function (hit) { return hit || c.add(u).catch(function () {}); });
      }));
    })
  ]));
});
self.addEventListener('message', function (e) {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE && k !== ASSET_CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () {                       // drop pictures that this version no longer uses
      return caches.open(ASSET_CACHE).then(function (c) {
        return c.keys().then(function (reqs) {
          var keep = ASSETS.concat(APP_FILES).map(function (u) { return new URL(u, self.location).href; });
          return Promise.all(reqs.filter(function (r) { return keep.indexOf(r.url) < 0 && r.url.indexOf('/assets/changelog.') < 0 && r.url.indexOf('/assets/lib-') < 0 && r.url.indexOf('/assets/sign-core.') < 0; }).map(function (r) { return c.delete(r); }));
        });
      });
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  var sameOrigin = url.origin === self.location.origin;
  var sdk = url.hostname === 'www.gstatic.com' && url.pathname.indexOf('/firebasejs/') === 0;
  if (url.pathname.indexOf('/.netlify/') === 0) return;   // the scan service is never cached
  if (!sameOrigin && !sdk) return;            // never touch Firebase / Google API calls

  if (sameOrigin && url.pathname.indexOf('/assets/') > -1) {   // 3.16: pictures, font, change log: saved copy first
    e.respondWith(caches.open(ASSET_CACHE).then(function (c) {
      return c.match(req).then(function (hit) {
        return hit || fetch(req).then(function (res) { if (res && res.ok) c.put(req, res.clone()); return res; });
      });
    }));
    return;
  }
  if (req.mode === 'navigate' && /\/(sign|verify|update|lvapp)\.html$/.test(url.pathname)) {   // 3.23: the client signing page is never the app
    e.respondWith(fetch(req).catch(function () { return new Response('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><p style="font-family:sans-serif;padding:20px">You are offline. Connect to the internet and open the signing link again.</p>', { headers: { 'Content-Type': 'text/html' } }); }));
    return;
  }
  if (req.mode === 'navigate') {              // 4.6: open instantly from this version's saved copy
    e.respondWith(
      caches.open(CACHE).then(function (c) {
        return c.match('./index.html').then(function (hit) {
          if (hit) return hit;
          return fetch(req).then(function (res) {
            if (res && res.ok) { var copy = res.clone(); c.put('./index.html', copy); }
            return res;
          });
        });
      }).catch(function () { return fetch(req); })
    );
    return;
  }
  e.respondWith(                              // files and SDK: cached copy, refreshed in the background
    caches.match(req).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && (res.ok || res.type === 'opaque')) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    })
  );
});

/* 1.8: phone notifications (Firebase Cloud Messaging data messages) */
self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { data: { body: e.data ? e.data.text() : '' } }; }
  var m = d.data || d.notification || d;
  var title = m.title || 'HHSL Command';
  var ios = /iPhone|iPad|iPod/.test((self.navigator && self.navigator.userAgent) || '');
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    var vis = list.filter(function (c) { return c.visibilityState === 'visible'; });
    vis.forEach(function (c) { try { c.postMessage({ type: 'hhsl-push', title: title, body: m.body || '', url: m.url || './', kind: m.kind || '', id: m.id || '' }); } catch (x) {} });
    if (vis.length && !ios) return;
    try { if (self.navigator && self.navigator.setAppBadge) self.navigator.setAppBadge().catch(function () {}); } catch (x) {}
    return self.registration.showNotification(title, {
      body: m.body || 'Your roster has changed.',
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png',
      tag: m.kind ? 'hhsl-' + m.kind : 'hhsl-roster-' + Date.now(),
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: m.url || './', kind: m.kind || '', id: m.id || '' }
    });
  }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    var kind = (e.notification.data && e.notification.data.kind) || '', nid = (e.notification.data && e.notification.data.id) || '';
    for (var i = 0; i < list.length; i++) { if ('focus' in list[i]) { try { list[i].postMessage({ type: 'hhsl-open', kind: kind, id: nid }); } catch (x) {} return list[i].focus(); } }
    return self.clients.openWindow(url);
  }));
});

"use strict";

const version = 3;
var isOnline = true;
var isLoggedIn = false;
var cacheName = `ramblings-${version}`

var urlsToCache = {
    loggedOut: [
        "/",
        "/about",
        "/contact",
        "/login",
        "/404",
        "/offline",
        "/css/style.css",
        "/js/blog.js",
        "/js/home.js",
        "/js/login.js",
        "/js/add-post.js",
        "/images/logo.gif",
        "/images/offline.png"
    ]
}

self.addEventListener("install", onInstall);
self.addEventListener("activate", onActivate);
self.addEventListener("message", onMessage);

main().catch(console.error);

// **********************************************

async function main() {
    await sendMessage({ requestStatusUpdate: true });
    await cacheLoggedOutFiles();
}

async function onInstall() {
    console.log(`Service Worker (${version}) is installing....`);
    self.skipWaiting();
}

async function sendMessage(msg) {
    var allClients = await clients.matchAll({ includeUncontrolled: true });
    return Promise.all(
        allClients.map(function clientMsg(client) {
            var chan = new MessageChannel();
            chan.port1.onmessage = onMessage;
            return client.postMessage(msg, [chan.port2]);
        })
    )
}

function onMessage({ data }) {
    console.log("RECC")
    if (data.statusUpdate) {
        ({ isOnline, isLoggedIn } = data.statusUpdate)
        console.log(`Service Worker (${version}) status update, isOnline:${isOnline}, isLoggedIn: ${isLoggedIn}`)
    }
}

async function onActivate(event) {
    console.log(`Service Worker (${version}) is started....`);
    // Need this to pass a promise
    event.waitUntil(handleActivation());
}

async function handleActivation() {
    await clients.claim();
    await cacheLoggedOutFiles(/*forceReload=*/ true);
    console.log(`Service Worker (${version}) is started....`);
}

async function cacheLoggedOutFiles(forceReload = false) {
    //open that cache entry
    var cache = await caches.open(cacheName);
    
    return Promise.all(
        urlsToCache.loggedOut.map(async function requestFile(url) {
            try {
                let res;

                if (!forceReload) {
                    res = await cache.match(url);
                    if (res) {
                        return res;
                    }
                }

                let fetchOptions = {
                    method: "GET",
                    cache: "no-cache",
                    credentials: "omit"
                }

                res = await fetch(url, fetchOptions);
                if (res.ok) {
                    await cache.put(url, res);
                }

            } catch (error) {
                
            }
        })
    )
}

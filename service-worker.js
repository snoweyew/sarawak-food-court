// Service Worker for Background Notifications
// This allows notifications to work even when browser tab is closed

const CACHE_NAME = 'sarawak-food-court-v1';
const urlsToCache = [
    '/',
    '/customer/home.html',
    '/customer/menu.html',
    '/customer/order-tracking.html',
    '/css/main.css',
    '/css/customer.css',
    '/css/notifications.css',
    '/js/app.js',
    '/js/notifications.js'
];

// Install Service Worker
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Caching app files');
                return cache.addAll(urlsToCache);
            })
    );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker activated');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Handle Push Notifications
self.addEventListener('push', (event) => {
    console.log('📬 Push notification received:', event);
    
    let notificationData = {
        title: 'Sarawak Food Court',
        body: 'Your order status has been updated',
        icon: '/assets/logo.png',
        badge: '/assets/logo.png',
        vibrate: [200, 100, 200],
        tag: 'order-update',
        requireInteraction: false
    };

    // Parse push data if available
    if (event.data) {
        try {
            const data = event.data.json();
            notificationData = { ...notificationData, ...data };
        } catch (e) {
            notificationData.body = event.data.text();
        }
    }

    event.waitUntil(
        self.registration.showNotification(notificationData.title, {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            vibrate: notificationData.vibrate,
            tag: notificationData.tag,
            requireInteraction: notificationData.requireInteraction,
            data: notificationData.data,
            actions: [
                {
                    action: 'view',
                    title: 'View Order',
                    icon: '/assets/icons/view.png'
                },
                {
                    action: 'close',
                    title: 'Dismiss',
                    icon: '/assets/icons/close.png'
                }
            ]
        })
    );
});

// Handle Notification Click
self.addEventListener('notificationclick', (event) => {
    console.log('🖱️ Notification clicked:', event.action);
    
    event.notification.close();

    if (event.action === 'view' || !event.action) {
        // Open order tracking page
        const orderId = event.notification.data?.orderId;
        const url = orderId 
            ? `/customer/order-tracking.html?order=${orderId}`
            : '/customer/order-tracking.html';

        event.waitUntil(
            clients.matchAll({ type: 'window', includeUnattached: true })
                .then((clientList) => {
                    // Check if app is already open
                    for (const client of clientList) {
                        if (client.url.includes('/customer/') && 'focus' in client) {
                            return client.focus().then(() => {
                                return client.navigate(url);
                            });
                        }
                    }
                    // Open new window if not open
                    if (clients.openWindow) {
                        return clients.openWindow(url);
                    }
                })
        );
    }
});

// Handle Background Sync (for offline support)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-orders') {
        console.log('🔄 Syncing orders in background...');
        event.waitUntil(syncOrders());
    }
});

async function syncOrders() {
    // Sync any pending orders when connection is restored
    try {
        const cache = await caches.open('orders-cache');
        const requests = await cache.keys();
        
        for (const request of requests) {
            const response = await fetch(request);
            await cache.put(request, response);
        }
        
        console.log('✅ Orders synced successfully');
    } catch (error) {
        console.error('❌ Error syncing orders:', error);
    }
}

// Fetch event for offline support
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                return response || fetch(event.request).then((fetchResponse) => {
                    // Cache new resources
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, fetchResponse.clone());
                        return fetchResponse;
                    });
                });
            })
            .catch(() => {
                // Return offline page if available
                return caches.match('/offline.html');
            })
    );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
    console.log('📨 Message received in Service Worker:', event.data);
    
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data.type === 'ORDER_UPDATE') {
        // Show notification for order update
        const { orderId, status, message } = event.data;
        self.registration.showNotification('Order Update', {
            body: message,
            icon: '/assets/logo.png',
            tag: `order-${orderId}`,
            data: { orderId, status }
        });
    }
});

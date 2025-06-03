// public/sw.js
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  clients.claim()
})

self.addEventListener('fetch', (event) => {
  // This can be expanded later for caching etc.
})

self.addEventListener('push', function (event) {
  console.log('🔥 Push received:', event);
  const data = event.data?.json() || {};
  
  const title = data.title || 'Hey, it’s DewList 👋';
  const options = {
    body: data.body || getRandomNudge(),
    icon: data.icon || null,
    badge: data.badge || null,
    data: {
      url: data.url || '/',
      userId: data.userId || null,
    },
    actions: data.actions || []  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const { action } = event;
  const { userId, url = '/', token } = event.notification.data || {};

  if (action === 'snooze') {
    console.log('🔕 Snoozing push notification for user:', userId);
    event.waitUntil(
      fetch('https://task-drip.onrender.com/snoozePush', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      }).catch(err => {
        console.error('❌ Failed to snooze push:', err);
      })
    );
    return;
  }

  // Default action: open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});


function getRandomNudge() {
  const messages = [
    "You’ve got this — even one small win today counts 🌟",
    "Just one task can make a difference. Ready to tackle it? 💪",
    "Little steps lead to big things. Let’s take one together! 🐾",
    "Hey superstar! 🌟 Ready to check off a task? Let’s go! 🚀",
    "No need to do it all — just show up for one thing 💼✨",
    "Hey, you! Yes, you! Ready to crush a task? Let’s do it! 💥",
    "Progress > perfection. Let’s nudge something forward 🚀",
    "You don’t need motivation — just momentum. Tap to start 🔄",
    "Remember, every task completed is a step closer to your goals 🏆",
    "Gentle reminder: You’re allowed to make progress at your own pace 💚",
    "Got some time to check off just one task? Let’s do it! ⏰",
    "You’re not behind — you’re exactly where you need to be. Let’s take a step forward together 🌱",
  ];

  return messages[Math.floor(Math.random() * messages.length)];
}

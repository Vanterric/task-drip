import { urlBase64ToUint8Array } from './vapidUtils';

export const subscribeToPush = async (deviceLabel = 'unknown', type = 'inactivity', label='', listId = null) => {
  if (!('serviceWorker' in navigator)) return false;
  if (!('PushManager' in window)) return false;
  if (!('Notification' in window)) return false;
  console.log('Subscribing to push notifications:', deviceLabel, type, label, listId);
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied:', permission);
      return false;
    }
    const registration = await navigator.serviceWorker.register('/sw.js');

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
    });

    // Add device label into the subscription object
    const payload = {
      ...subscription.toJSON(),
      device: deviceLabel,
      type,
      label, // Optional label for the subscription
      listId, // ID of the task list this subscription is for
    };

    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error('Failed to save subscription');
    return true;
  } catch (err) {
    console.error('Push subscription error:', err);
    return false;
  }
};

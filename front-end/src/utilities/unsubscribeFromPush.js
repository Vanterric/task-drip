export const unsubscribeFromPush = async (type = 'reset', listId = null) => {
    console.log('Unsubscribing from push notifications:', type, listId);
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();

    const payload = {
      type,
      endpoint: subscription?.endpoint,
      listId, // Send listId to bulk-remove matching subs
    };

    console.log('Unsubscribe payload:', payload);

    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error('Failed to unsubscribe');
    if (subscription) await subscription.unsubscribe();
    return true;
  } catch (err) {
    console.error('Unsubscribe error:', err);
    return false;
  }
};

export const unsubscribeFromPush = async (type = 'reset', listId = null, taskId = null) => {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();

    const payload = {
      type,
      endpoint: subscription?.endpoint,
      listId, // Send listId to bulk-remove matching subs
      taskId, // Send taskId to bulk-remove matching subs
    };


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

import { getDeviceLabel } from "./getDeviceLabel";

export const unsubscribeFromPush = async (type = 'reset', listId = null, taskId = null, user) => {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    const payload = {
      type,
      listId, // Send listId to bulk-remove matching subs
      taskId, // Send taskId to bulk-remove matching subs
      device: getDeviceLabel(), // Use the same device label logic as in subscribeToPush
    };


    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.status!==200) return false;
    if (subscription) await subscription.unsubscribe();
    return true;
  } catch (err) {
    /* console.error('Unsubscribe error:', err); */
    return false;
  }
};

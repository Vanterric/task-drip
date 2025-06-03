import { urlBase64ToUint8Array } from './vapidUtils';

export const checkIfCurrentDeviceSubscribed = async (pushSubscriptions, setIsSubscribed) => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    setIsSubscribed(false);
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      setIsSubscribed(false);
      return;
    }

    const currentSub = await registration.pushManager.getSubscription();
    if (!currentSub) {
      setIsSubscribed(false);
      return;
    }

    const currentEndpoint = currentSub.endpoint;
    const match = pushSubscriptions?.some(sub => sub.endpoint === currentEndpoint);

    setIsSubscribed(!!match);
  } catch (err) {
    console.error('Error checking push subscription:', err);
    setIsSubscribed(false);
  }
};

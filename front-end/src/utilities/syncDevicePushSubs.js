
import { useAuth } from '../context/AuthContext';
import { getDeviceLabel } from './getDeviceLabel';
import { subscribeToPush } from './subscribeToPush';
import { unsubscribeFromPush } from './unsubscribeFromPush';

export const syncDevicePushSubs = async (user) => {
  if (!user?.pushSubscriptions?.length) return;

  const registration = await navigator.serviceWorker.getRegistration();
  const currentSub = await registration?.pushManager.getSubscription();
  

  const localEndpoint = currentSub?.endpoint;
  const deviceLabel = getDeviceLabel();
  // Grab all subs for this device
  const matchingDeviceSubs = user.pushSubscriptions.filter(
    (sub) => sub.device === deviceLabel
  );

  const datedSubs = matchingDeviceSubs.filter(
    (sub) => sub.endpoint !== localEndpoint
  );

  if (datedSubs.length === 0) {
    
    return;
  }

  // Unsubscribe from each stale sub using your own utility
  for (const sub of datedSubs) {
    try{
    const res = await unsubscribeFromPush(sub.type, sub.listId ?? null, sub.taskId ?? null, user);
    setTimeout(async () => {
      if (res === true) await subscribeToPush(deviceLabel, sub.type, sub.label, sub.listId, sub.taskId);
    }, 1000);
    } catch (error) {
      console.error('Error syncing push subscriptions:', error);
    }
    
  }

};
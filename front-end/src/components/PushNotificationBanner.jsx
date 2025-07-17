import { useEffect, useState } from 'react';
import { subscribeToPush } from '../utilities/subscribeToPush';
import { isEdgeDesktop } from '../utilities/isEdgeDesktop';
import { useAuth } from '../context/AuthContext';

export default function PushNotificationBanner({ isSubscribedToPushNotifications, setIsSubscribedToPushNotifications }) {
  const [showBanner, setShowBanner] = useState(false);
  const {isFirstTimeUser} = useAuth();
  const isInStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  

  const getDeviceLabel = () => {
    const platform = navigator.platform || '';
    const userAgent = navigator.userAgent || '';

    if (/Android/i.test(userAgent)) return 'android';
    if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
    if (/Win/i.test(platform)) return 'windows';
    if (/Mac/i.test(platform)) return 'mac';
    if (/Linux/i.test(platform)) return 'linux';

    return 'unknown';
  };

  useEffect(() => {
    
    if (isEdgeDesktop()) return; // ❌ Skip Edge Desktop

    if (isSubscribedToPushNotifications) {
      setShowBanner(false);
      return;
    }

    const dismissedAt = localStorage.getItem('pushBannerDismissedAt');
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    if (!dismissedAt || Date.now() - new Date(dismissedAt).getTime() > sevenDays) {
      setShowBanner(true);
    }
  }, [isSubscribedToPushNotifications]);

  const handleDismiss = () => {
    localStorage.setItem('pushBannerDismissedAt', new Date().toISOString());
    setShowBanner(false);
  };
  const device = getDeviceLabel();

  const handleSubscribe = async () => {
    const subscribed = await subscribeToPush(device);
    if (subscribed) {
      setIsSubscribedToPushNotifications(true);
      handleDismiss();
    }
  };

  if (!showBanner || device === 'mac' || isFirstTimeUser) return null;
  if(!isInStandalone()) return null; 

  return (
    <div className="fixed bottom-4 right-4 max-w-sm w-[90vw] sm:w-auto bg-[#4C6CA8] text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-start gap-3">
      <div className="flex-1">
        <p className="font-semibold text-base cursor-default">Need a little nudge now and then?</p>
        <p className="text-sm opacity-90 cursor-default">
          We’ll ping you when it’s a good moment to Dew something 💬✨ <br/><br/>
        </p>
        <button
          onClick={handleSubscribe}
          className="mt-2 text-sm bg-white text-[#4C6CA8] hover:bg-[#E0ECFC] transition px-3 py-1 rounded cursor-pointer"
        >
          Turn On Reminders
        </button>
      </div>
      <button
        onClick={handleDismiss}
        className="text-white hover:text-gray-200 text-xl leading-none cursor-pointer"
        aria-label="Dismiss push reminder banner"
      >
        &times;
      </button>
    </div>
  );
}

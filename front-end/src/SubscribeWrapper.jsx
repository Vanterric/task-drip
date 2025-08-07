import { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import SubscribePage from './pages/subscribe/SubscribePage';
import { preloadStripe } from './utilities/preloadStripe';

export default function SubscribeWrapper() {
  const [stripe, setStripe] = useState(null);

  useEffect(() => {
    preloadStripe().then(setStripe);
  }, []);

  if (!stripe) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 w-[300px] h-[300px] max-w-[50vw] max-h-[50vw]">
  <div className="absolute inset-0 bg-[#D4E3FF] dark:bg-[#4C6CA8] opacity-30 blur-[100px] rounded-full z-[1]" />

  <div className="absolute inset-0 border border-[#D4E3FF] dark:border-[#4C6CA8] rounded-full opacity-0 animate-[rippleWave_4s_linear_infinite]" />
  <div className="absolute inset-0 border border-[#D4E3FF] dark:border-[#4C6CA8] rounded-full opacity-0 animate-[rippleWave_4s_linear_infinite] [animation-delay:1.33s]" />
  <div className="absolute inset-0 border border-[#D4E3FF] dark:border-[#4C6CA8] rounded-full opacity-0 animate-[rippleWave_4s_linear_infinite] [animation-delay:2.66s]" />
</div>
        <p className="text-sm text-[#4F5962]">Loading payment tools...</p>
      </div>
    );
  }

  return (
    <Elements stripe={stripe}>
      <SubscribePage />
    </Elements>
  );
}

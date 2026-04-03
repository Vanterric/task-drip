import { useEffect, useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { vibration } from '../../utilities/vibration';
import { audio } from '../../utilities/audio';
import { AnimatePresence, motion } from 'framer-motion';
import { DotLoader } from '../../components/DotLoader';

const dewlistLogo = '/DewListGold.png';

const tiers = {
  free: {
    name: 'Free',
    features: ['1 task list', '5 tasks per list', 'List view only', 'Push notifications'],
  },
  focus: {
    name: 'Focus',
    monthly: '$4/mo',
    yearly: '$36/yr',
    features: ['3 task lists', '5 tasks per list', 'One-task-at-a-time view', 'Push notifications'],
    plans: {
      monthly: { label: 'Monthly', price: '$4/mo', stripePlan: 'focus-monthly' },
      yearly: { label: 'Yearly', price: '$36/yr', stripePlan: 'focus-yearly' },
    },
  },
  pro: {
    name: 'Pro',
    badge: 'BEST VALUE',
    monthly: '$8/mo',
    yearly: '$72/yr',
    lifetime: '$150 once',
    features: ['Unlimited lists & tasks', 'One-task-at-a-time view', 'AI task breakdown & polish', 'AI voice input', 'Scheduled resets'],
    plans: {
      monthly: { label: 'Monthly', price: '$8/mo', stripePlan: 'pro-monthly' },
      yearly: { label: 'Yearly', price: '$72/yr', stripePlan: 'pro-yearly' },
      lifetime: { label: 'Lifetime', price: '$150', stripePlan: 'pro-lifetime' },
    },
  },
};

export default function SubscribePage() {
  const { user, setUser, isMuted } = useAuth();
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [billingCycle, setBillingCycle] = useState('monthly');
  const [selectedTier, setSelectedTier] = useState(null);
  const [showCardElement, setShowCardElement] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subscribed, setSubscribed] = useState(false);

  const queryParams = new URLSearchParams(window.location.search);
  const checkoutSuccess = queryParams.get('status') === 'success';

  useEffect(() => {
    if (checkoutSuccess) handleUpgradeComplete();
  }, [checkoutSuccess]);

  const handleUpgradeComplete = async () => {
    const pollUntilUpgraded = async (retries = 10) => {
      for (let i = 0; i < retries; i++) {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/validate?token=${localStorage.getItem('authToken')}`);
        const data = await res.json();
        if (data?.user?.tier === 'pro' || data?.user?.tier === 'focus') {
          localStorage.setItem('token', data.token);
          setUser(data.user);
          return true;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      throw new Error("Timed out waiting for upgrade");
    };
    await pollUntilUpgraded();
    setLoading(false);
    vibration('button-press');
    setSubscribed(true);
  };

  const handleSubscribe = async (tierKey, plan) => {
    vibration('button-press');
    setLoading(true);
    setError(null);
    setSelectedTier(tierKey);

    if (plan === 'pro-lifetime') {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, plan: 'pro-lifetime' }),
      });
      const { clientSecret } = await res.json();
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: { email: user.email },
        },
      });
      if (result.error) {
        setError(result.error.message);
        setLoading(false);
      } else if (result.paymentIntent.status === 'succeeded') {
        handleUpgradeComplete();
      }
    } else {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, plan }),
      });
      const { url } = await res.json();
      setLoading(false);
      audio('open-modal', isMuted);
      setTimeout(() => { window.location.href = url; }, 200);
    }
  };

  if (subscribed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAECE5] dark:bg-[#212732] px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-white dark:bg-[#4F5962] shadow-xl rounded-xl p-6 space-y-6 text-center">
          <CheckCircle className="w-12 h-12 mx-auto text-[#6DBF67]" />
          <h2 className="text-xl font-semibold text-[#4F5962] dark:text-white cursor-default">Success!</h2>
          <p className="text-sm text-text-info dark:text-text-darkinfo cursor-default">Your upgrade was successful.</p>
          <button onClick={() => { audio('button-press', isMuted); vibration('button-press'); navigate('/app'); }} className="bg-[#4C6CA8] text-white px-6 py-3 rounded-full font-medium hover:bg-[#3A5D91] transition cursor-pointer">
            Go back to DewList
          </button>
        </motion.div>
      </div>
    );
  }

  const currentTier = user?.tier || 'free';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAECE5] dark:bg-[#212732] px-4 py-8">
      <div className="w-full max-w-3xl space-y-6">
        <div className="text-center">
          <img src={dewlistLogo} alt="DewList Logo" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#4F5962] dark:text-white">Choose Your Plan</h1>
          <div className="flex justify-center gap-2 mt-4">
            {['monthly', 'yearly'].map((cycle) => (
              <button
                key={cycle}
                onClick={() => { audio('button-press', isMuted); vibration('button-press'); setBillingCycle(cycle); setShowCardElement(false); }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition cursor-pointer ${billingCycle === cycle ? 'bg-[#4C6CA8] text-white' : 'bg-white dark:bg-[#4F5962] text-[#4F5962] dark:text-white border border-[#4C6CA8] dark:border-[#7A8A9E]'}`}
              >
                {cycle === 'monthly' ? 'Monthly' : 'Yearly'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Object.entries(tiers).map(([key, tier]) => {
            const isCurrent = currentTier === key;
            const isPro = key === 'pro';
            const price = key === 'free' ? 'Free' : tier[billingCycle];

            return (
              <motion.div
                key={key}
                layout
                className={`relative bg-white dark:bg-[#4F5962] rounded-xl p-5 shadow-lg space-y-4 ${isPro ? 'border-2 border-yellow-500 dark:border-yellow-300' : 'border border-gray-200 dark:border-[#7A8A9E]'}`}
              >
                {tier.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-white text-[10px] font-bold px-3 py-1 rounded-full">
                    {tier.badge}
                  </span>
                )}
                <h3 className="text-lg font-bold text-[#4F5962] dark:text-white">{tier.name}</h3>
                <p className="text-2xl font-bold text-[#4C6CA8] dark:text-[#7AB5E8]">{price}</p>
                <ul className="space-y-2">
                  {tier.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#4F5962] dark:text-white">
                      <Check className="w-4 h-4 mt-0.5 text-[#6DBF67] shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="text-center text-sm font-medium text-[#91989E] py-2">Current Plan</div>
                ) : key === 'free' ? (
                  <div className="text-center text-sm text-[#91989E] py-2">—</div>
                ) : (
                  <button
                    onClick={() => { setShowCardElement(false); handleSubscribe(key, tier.plans[billingCycle]?.stripePlan); }}
                    disabled={loading}
                    className="w-full bg-[#4C6CA8] text-white py-2 rounded-lg font-medium hover:bg-[#3A5D91] transition cursor-pointer disabled:opacity-60"
                  >
                    {loading && selectedTier === key ? <span className="flex justify-center items-center gap-1">Processing<span className="mt-2"><DotLoader /></span></span> : 'Subscribe'}
                  </button>
                )}

                {isPro && (
                  <button
                    onClick={() => { setShowCardElement(true); handleSubscribe('pro', 'pro-lifetime'); }}
                    disabled={loading || isCurrent}
                    className="w-full text-sm text-[#4C6CA8] dark:text-[#7AB5E8] underline cursor-pointer disabled:opacity-40"
                  >
                    Or pay $150 once, forever
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

        <AnimatePresence>
          {showCardElement && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="max-w-md mx-auto overflow-hidden"
            >
              <CardElement className="p-3 border rounded-md bg-white" />
            </motion.div>
          )}
        </AnimatePresence>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <p className="text-xs text-center text-text-info dark:text-text-darkinfo cursor-default">
          Secure checkout powered by Stripe. Cancel anytime.
        </p>
      </div>
    </div>
  );
}

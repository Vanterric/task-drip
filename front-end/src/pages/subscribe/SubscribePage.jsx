import { useEffect, useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { vibration } from '../../utilities/vibration';
import dewlistLogo from '../../assets/DewList_Logo.png';

const plans = {
  monthly: { label: 'Monthly', price: '$5/mo', stripePriceId: 'monthly' },
  yearly: { label: 'Yearly', price: '$30/yr', stripePriceId: 'yearly' },
  lifetime: { label: 'Lifetime', price: '$100 once', stripePriceId: 'lifetime' },
};

export default function SubscribePage() {
  const { user, setUser } = useAuth();
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subscribed, setSubscribed] = useState(false);

  const queryParams = new URLSearchParams(window.location.search);
  const checkoutSuccess = queryParams.get('status') === 'success';

  useEffect(() => {
    if (checkoutSuccess) {
      handleUpgradeComplete();
    }
  }, [checkoutSuccess]);

  useEffect(() => {
    user.isPro && setSubscribed(true);
  }, [user]);


  const handleUpgradeComplete = async () => {
    const pollUntilPro = async (retries = 10) => {
        for (let i = 0; i < retries; i++) {
          const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/validate?token=${localStorage.getItem('authToken')}`);
          const data = await res.json();
      
          if (data?.user?.isPro) {
            localStorage.setItem('token', data.token);
            setUser(data.user);
            return true;
          }
      
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      
        throw new Error("Timed out waiting for pro upgrade to complete");
      };
    await pollUntilPro();
    setLoading(false);
    vibration('button-press')
    setSubscribed(true);
  };
  

  const handleSubmit = async (e) => {
  e.preventDefault();
  vibration('button-press');
  setLoading(true);
  setError(null);

  if (selectedPlan === 'lifetime') {
    // Keep your existing paymentIntent flow here
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, plan: 'lifetime' }),
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
    } else if (result.paymentIntent.status === 'succeeded') {
      handleUpgradeComplete();
    }
  } else {
    // Redirect to Stripe Checkout for subscription
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, plan: selectedPlan }),
    });

    const { url } = await res.json();
    window.location.href = url;
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAECE5] dark:bg-[#212732] px-4">
      <div className="w-full max-w-md bg-white dark:bg-[#4F5962] shadow-xl rounded-xl p-6 space-y-6">
        {!subscribed ? (
          <>
          <img src={dewlistLogo} alt="DewList Logo" className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-center border rounded-full border-yellow-500 dark:border-yellow-300 mx-auto w-fit px-4 py-1 text-yellow-500 dark:text-yellow-300 cursor-default mb-2">DewList Pro</h1>
            <p className="text-sm text-center text-text-info dark:text-text-darkinfo cursor-default">
              Go pro to get unlimited tasks, <br/> unlimited lists, AI features, and more.
            </p>

            <div className="flex justify-center gap-2">
              {Object.entries(plans).map(([key, plan]) => (
                <button
                  key={key}
                  onClick={() => {vibration('button-press'); setSelectedPlan(key)}}
                  className={`text-xs sm:text-sm px-2 sm:px-4 py-2 rounded-full border flex flex-col w-md  transition cursor-pointer
                    ${selectedPlan === key
                      ? 'bg-accent-primary text-text-darkprimary font-semibold dark:border-text-darkprimary border-text-primary'
                      : 'bg-white text-accent-primary border-accent-primary dark:bg-background-darkcard dark:border-accent-focusring dark:text-accent-focusring'}`}

                >
                  {plan.label}
                  <span className={`ml-1 text-xs font-normal dark:text-text-darkinfo ${selectedPlan === key ? 'text-text-darkinfo' : 'text-text-info'}`}>{plan.price}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              

            {selectedPlan === 'lifetime' && (
              <CardElement className="p-3 border rounded-md bg-white" />
            )}
            {error && <div className="text-sm text-red-500">{error}</div>}

            <button
              type="submit"
              disabled={!stripe || loading}
              className="w-full bg-[#4C6CA8] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#3A5D91] transition cursor-pointer"
            >
              {loading
                ? 'Processing...'
                : selectedPlan === 'lifetime'
                ? `Pay ${plans[selectedPlan].price}`
                : `Subscribe (${plans[selectedPlan].price})`}
            </button>
          </form>


            <p className="text-xs text-center dark:text-text-darkinfo text-text-info cursor-default">
              {selectedPlan === 'lifetime'
                ? 'Secure one-time payment powered by Stripe.'
                : 'You’ll be redirected to Stripe for secure subscription checkout.'}
            </p>
          </>
        ) : (
          <div className="text-center space-y-6">
            <CheckCircle className="w-12 h-12 mx-auto text-[#6DBF67]" />
            <h2 className="text-xl font-semibold text-[#4F5962] dark:text-white mb-2 cursor-default">Success!</h2>
            <p className="text-sm text-text-info dark:text-text-darkinfo cursor-default">
              Your upgrade was successful. <br/> You can now enjoy all DewList Pro features.
            </p>
            <button
              onClick={() => {vibration('button-press'); navigate('/app')}}
              className="bg-[#4C6CA8] text-white px-6 py-3 rounded-full font-medium hover:bg-[#3A5D91] transition cursor-pointer transition"
            >
              Go back to DewList
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

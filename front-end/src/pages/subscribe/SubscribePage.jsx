import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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
    setSubscribed(true);
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, plan: selectedPlan }),
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

    
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAECE5] px-4">
      <div className="w-full max-w-md bg-white shadow-xl rounded-xl p-6 space-y-6">
        {!subscribed ? (
          <>
            <h1 className="text-2xl font-bold text-center text-[#4F5962]">Upgrade to DewList Pro</h1>
            <p className="text-sm text-center text-[#91989E]">
              Get unlimited tasks, lists, and AI-powered breakdowns.
            </p>

            <div className="flex justify-center gap-2">
              {Object.entries(plans).map(([key, plan]) => (
                <button
                  key={key}
                  onClick={() => setSelectedPlan(key)}
                  className={`text-xs sm:text-sm px-2 sm:px-4 py-2 rounded-full border transition 
                    ${selectedPlan === key
                      ? 'bg-[#4C6CA8] text-white'
                      : 'bg-white border-[#4C6CA8] text-[#4C6CA8] hover:bg-[#F6F8FA]'}`}

                >
                  {plan.label}
                  <span className="ml-1 text-xs text-[#91989E]">{plan.price}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <CardElement className="p-3 border rounded-md bg-white" />
              {error && <div className="text-sm text-red-500">{error}</div>}

              <button
                type="submit"
                disabled={!stripe || loading}
                className="w-full bg-[#4C6CA8] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#3A5D91] transition"
              >
                {loading ? 'Processing...' : `Subscribe (${plans[selectedPlan].price})`}
              </button>
            </form>

            <p className="text-center text-xs text-[#91989E]">
              Secure checkout powered by Stripe.
            </p>
          </>
        ) : (
          <div className="text-center space-y-6">
            <CheckCircle className="w-12 h-12 mx-auto text-[#6DBF67]" />
            <h2 className="text-xl font-semibold text-[#4F5962]">You’re now a Pro!</h2>
            <p className="text-sm text-[#91989E]">
              Your upgrade was successful. You can now enjoy all premium features.
            </p>
            <button
              onClick={() => navigate('/app')}
              className="bg-[#4C6CA8] text-white px-6 py-3 rounded-full font-medium hover:bg-[#3A5D91] transition"
            >
              Go back to DewList
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

let stripePromise;

export function preloadStripe() {
  if (!stripePromise) {
    stripePromise = import('@stripe/stripe-js').then(({ loadStripe }) =>
      loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
    );
  }
  return stripePromise;
}

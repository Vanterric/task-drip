import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { ThemeProvider } from './context/ThemeContext.jsx'
import { ColorProvider } from './context/ColorContext.jsx'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <ColorProvider>
      <Elements stripe={stripePromise}>
    <App />
    </Elements>
    </ColorProvider>
    </ThemeProvider>
    </AuthProvider>
  </StrictMode>,
)

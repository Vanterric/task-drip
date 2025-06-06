import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/login/LoginPage";
import UnlockPage from "./pages/unlock/Unlock";
import PrivateRoute from "./components/PrivateRoute";
import HomePage from "./pages/home/HomePage";
import SubscribePage from "./pages/subscribe/SubscribePage";
import { useEffect, useState } from "react";
import InAppBrowserBanner from "./components/InAppBrowserBanner";

function App() {

  useEffect(() => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('✅ Service worker registered')
        })
        .catch((err) => {
          console.error('❌ Service worker registration failed')
        })
    })
  }
}, [])




const location = window.location;

useEffect(() => {
  console.log('Checking for referral code in URL');
  const params = new URLSearchParams(location.search);
  const refCode = params.get('referral');
  console.log('Referral code found:', refCode);
  if (refCode) {
    localStorage.setItem('dewlist_ref', refCode);
  }
}, []);
  
  return (
    <>
    <Router>
      <Routes>
        <Route path={`/login`} element={<LoginPage />} />
        <Route path="/unlock" element={<UnlockPage />} />
        <Route path="/app" element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="/subscribe" element={<PrivateRoute><SubscribePage /></PrivateRoute>} />
        <Route path="/" element={<Navigate to={`/app${location.search}`} />} />
      </Routes>
    </Router>
    <InAppBrowserBanner />
    </>
  );
}

export default App;

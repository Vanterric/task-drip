import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/login/LoginPage";
import UnlockPage from "./pages/unlock/Unlock";
import PrivateRoute from "./components/PrivateRoute";
import HomePage from "./pages/home/HomePage";
import SubscribePage from "./pages/subscribe/SubscribePage";
import { useEffect, useState } from "react";
import PWAInstallBanner from "./components/PWAInstallBanner";
import InAppBrowserBanner from "./components/InAppBrowserBanner";

function App() {

  useEffect(() => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('✅ Service worker registered', reg)
        })
        .catch((err) => {
          console.error('❌ Service worker registration failed', err)
        })
    })
  }
}, [])


  
  return (
    <>
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unlock" element={<UnlockPage />} />
        <Route path="/app" element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="/subscribe" element={<PrivateRoute><SubscribePage /></PrivateRoute>} />
        <Route path="/" element={<Navigate to="/app" />} />
      </Routes>
    </Router>
    <PWAInstallBanner />
    <InAppBrowserBanner />
    </>
  );
}

export default App;

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { useEffect, useState } from "react";
import { consoleMessageToCuriousUsers } from "./utilities/consoleMessageToCuriousUsers";
import SubscribeWrapper from "./SubscribeWrapper";
import { preloadStripe } from "./utilities/preloadStripe";
import { useAuth } from "./context/AuthContext";

const LoginPage = lazy(() => import("./pages/login/LoginPage"));
const SigninPage = lazy(() => import("./pages/login/SignInPage"));
const UnlockPage = lazy(() => import("./pages/unlock/Unlock"));
const PrivateRoute = lazy(() => import("./components/PrivateRoute"));
const HomePage = lazy(() => import("./pages/home/HomePage"));
const SubscribePage = lazy(() => import("./pages/subscribe/SubscribePage"));
const ReferrerDashboard = lazy(() => import("./pages/referrer-dashboard/ReferrerDashboard"));
const InAppBrowserBanner = lazy(() => import("./components/InAppBrowserBanner"));


function App() {

const {isAuthenticated} = useAuth();

useEffect(() => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => preloadStripe());
  } else {
    setTimeout(() => preloadStripe(), 1000);
  }
}, []);


  useEffect(() => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          //console.log('✅ Service worker registered', reg);
        })
        .catch((err) => {
          console.error('❌ Service worker registration failed')
        })
    })
  }
}, [])






setTimeout(() => {
  consoleMessageToCuriousUsers();
}, 3000);

const location = window.location;

useEffect(() => {
  const params = new URLSearchParams(location.search);
  const refCode = params.get('referral');
  if (refCode) {
    localStorage.setItem('dewlist_ref', refCode);
  }
}, []);
  
  return (
    <Suspense fallback={
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background-light dark:bg-background-dark">
    {/* Animated ripple blob */}
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 w-[300px] h-[300px] max-w-[50vw] max-h-[50vw]">
  <div className="absolute inset-0 bg-[#D4E3FF] dark:bg-[#4C6CA8] opacity-30 blur-[100px] rounded-full z-[1]" />

  <div className="absolute inset-0 border border-[#D4E3FF] dark:border-[#4C6CA8] rounded-full opacity-0 animate-[rippleWave_4s_linear_infinite]" />
  <div className="absolute inset-0 border border-[#D4E3FF] dark:border-[#4C6CA8] rounded-full opacity-0 animate-[rippleWave_4s_linear_infinite] [animation-delay:1.33s]" />
  <div className="absolute inset-0 border border-[#D4E3FF] dark:border-[#4C6CA8] rounded-full opacity-0 animate-[rippleWave_4s_linear_infinite] [animation-delay:2.66s]" />
</div>


    {/* Centered Loading Text */}
    <div className="relative z-10 text-[#4F5962] dark:text-white text-lg font-medium">
      Loading...
    </div>
  </div>
    }>
    <Router>
      <Routes>
        <Route path={`/login`} element={<LoginPage />} />
        <Route path={`/signin`} element={<SigninPage />} />
        <Route path="/unlock" element={<UnlockPage />} />
        <Route path="/app" element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route
  path="/subscribe"
  element={
    <PrivateRoute>
      <SubscribeWrapper />
    </PrivateRoute>
  }
/>
<Route path = "/referrer-dashboard" element = {<PrivateRoute><ReferrerDashboard/></PrivateRoute>}/>
        <Route path="/" element={isAuthenticated ? <Navigate to={`/app${location.search}`} /> : <Navigate to={`/login${location.search}`} />} />
      </Routes>
    </Router>
    <InAppBrowserBanner />
    </Suspense>
  );
}

export default App;

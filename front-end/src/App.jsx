import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/login/LoginPage";
import UnlockPage from "./pages/unlock/Unlock";
import PrivateRoute from "./components/PrivateRoute";
import HomePage from "./pages/home/HomePage";
import SubscribePage from "./pages/subscribe/SubscribePage";
import { useEffect, useState } from "react";

function App() {

  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallButton, setShowInstallButton] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallButton(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const result = await deferredPrompt.userChoice
    console.log(result.outcome) // 'accepted' or 'dismissed'
    setDeferredPrompt(null)
    setShowInstallButton(false)
  }

  
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
    {showInstallButton && (
  <div className="fixed bottom-4 right-4 max-w-sm w-[90vw] sm:w-auto bg-[#4C6CA8] text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-start gap-3">
    <div className="flex-1">
      <p className="font-semibold text-base">Install DewList</p>
      <p className="text-sm opacity-90">
        Install DewList for instant access — no tabs, no distractions. Just one task at a time, right from your home screen.
      </p>
      <button
        onClick={handleInstallClick}
        className="mt-2 text-sm bg-white text-[#4C6CA8] hover:bg-[#E0ECFC] transition px-3 py-1 rounded cursor-pointer"
      >
        Install App
      </button>
    </div>
    <button
      onClick={() => setShowInstallButton(false)}
      className="text-white hover:text-gray-200 text-xl leading-none cursor-pointer"
      aria-label="Close install banner"
    >
      &times;
    </button>
  </div>
)}
    </>
  );
}

export default App;

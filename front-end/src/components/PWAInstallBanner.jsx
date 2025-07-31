import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { AnimatePresence, motion } from 'framer-motion'
import { vibration } from '../utilities/vibration'
import { audio } from '../utilities/audio'

const INSTALL_DISMISSED_KEY = 'dewlist_install_dismissed_at'
const INSTALL_ACCEPTED_KEY = 'dewlist_installed_at'
const POSTINSTALL_DISMISSED_KEY = 'dewlist_postinstall_banner_dismissed_at'
const IOS_DISMISSED_KEY = 'dewlist_ios_banner_dismissed_at'
const isMobile = () => /Mobi|Android/i.test(navigator.userAgent)

const daysAgo = (key, days) => {
  const ts = localStorage.getItem(key)
  if (!ts) return true
  return (Date.now() - new Date(ts).getTime()) > days * 24 * 60 * 60 * 1000
}

const isIOS = () => {
  const ua = window.navigator.userAgent
  return /iPhone|iPad|iPod/.test(ua) && !window.MSStream
}

const isInStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [bannerType, setBannerType] = useState(null) // 'install' | 'postinstall' | 'ios'
  const {isFirstTimeUser, isMuted} = useAuth();

  useEffect(() => {
    // Don't show anything if already in standalone mode
    if (isInStandalone()) return
    // iOS flow
    if (isIOS()) {
      if (daysAgo(IOS_DISMISSED_KEY, 7)) {
        setBannerType('ios')
      }
      return
    }

    // Normal PWA flow
    const handler = (e) => {
    
      e.preventDefault()
      setDeferredPrompt(e)
      const dismissed = !daysAgo(INSTALL_DISMISSED_KEY, 7)
      const accepted = localStorage.getItem(INSTALL_ACCEPTED_KEY)
      const postDismissed = !daysAgo(POSTINSTALL_DISMISSED_KEY, 7)
      if (accepted && !postDismissed) {
        setBannerType('postinstall')
      } else if (!dismissed && !accepted) {
            setBannerType('install')
      } else {
        // nothing
      }
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallClick = async () => {
    vibration('button-press')
    audio('button-press', isMuted)
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const result = await deferredPrompt.userChoice
    if (result.outcome === 'accepted') {
      localStorage.setItem(INSTALL_ACCEPTED_KEY, new Date().toISOString())
    }
    setDeferredPrompt(null)
    setBannerType(null)
  }

  const handleDismiss = (key) => {
    vibration('button-press')
    audio('button-press', isMuted)
    localStorage.setItem(key, new Date().toISOString())
    setBannerType(null)
  } 

  return (
    <AnimatePresence>
    {bannerType && !isFirstTimeUser && (
      <motion.div 
    initial={{ opacity: 0, y: 150, transition: { duration: 0.2 } }}
    animate={{ opacity: 1, y: 0, transition: { duration: 0.2 } }}
    exit={{ opacity: 0, y: 150, transition: { duration: 0.2 } }}
    className="fixed bottom-4 right-4 max-w-sm w-[90vw] sm:w-auto bg-[#4C6CA8] text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-start gap-3">
      <div className="flex-1">
        {bannerType === 'install' && (
          <>
  <p className="font-semibold text-base cursor-default">Add DewList to your home screen?</p>
  <p className="text-sm opacity-90 cursor-default">
    No more tab-hunting or forgotten tasks. DewList stays put — just one tap away, one task at a time.
  </p>
  <button
    onClick={handleInstallClick}
    className="mt-2 text-sm bg-white text-[#4C6CA8] hover:bg-[#E0ECFC] transition px-3 py-1 rounded cursor-pointer"
  >
    Yes, make my life easier
  </button>
</>

        )}
        {bannerType === 'ios' && (
  <>
    <p className="font-semibold text-base cursor-default">
      Add DewList to your home screen?
    </p>
    <p className="text-sm opacity-90 cursor-default">
      Tap the <span className="font-semibold">Share</span> button at the bottom of Safari,
      then choose <span className="font-semibold">“Add to Home Screen.”</span>
    </p>
    <p className="text-sm opacity-70 mt-1 cursor-default">
      It’s the best way to use DewList — no tabs, just one tap.
    </p>
  </>
)}



        {bannerType === 'postinstall' && (
          <>
            <p className="font-semibold text-base cursor-default">Psst... DewList works better as an app</p>
            <p className="text-sm opacity-90 cursor-default">
                You already installed it — now tap it from your home screen for the full, tab-free, task-taming experience.
            </p>
            {isMobile() && (
            <button
                onClick={() => window.location.href = window.location.origin}
                className="mt-2 text-sm bg-white text-[#4C6CA8] hover:bg-[#E0ECFC] transition px-3 py-1 rounded cursor-pointer"
            >
                Open DewList App
            </button>
            )}

        </>

        )}
      </div>
      <button
        onClick={() =>
          handleDismiss(
            bannerType === 'install'
              ? INSTALL_DISMISSED_KEY
              : bannerType === 'postinstall'
              ? POSTINSTALL_DISMISSED_KEY
              : IOS_DISMISSED_KEY
          )
        }
        className="text-white hover:text-gray-200 text-xl leading-none cursor-pointer"
        aria-label="Close install banner"
      >
        &times;
      </button>
    </motion.div>)}
    </AnimatePresence>
  )
}

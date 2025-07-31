import { useEffect, useState } from 'react'
import { audio } from '../utilities/audio'
import { AnimatePresence, motion } from 'framer-motion'
import { vibration } from '../utilities/vibration'
import { useAuth } from '../context/AuthContext'

const INAPP_DISMISSED_KEY = 'dewlist_inapp_dismissed_at'

const isInAppBrowser = () => {
  const ua = navigator.userAgent || navigator.vendor || window.opera
  return /Instagram|FBAN|FBAV|Messenger|Line|Gmail|Snapchat|GSA|Line/i.test(ua)
}

const daysAgo = (key, days) => {
  const ts = localStorage.getItem(key)
  if (!ts) return true
  return (Date.now() - new Date(ts).getTime()) > days * 24 * 60 * 60 * 1000
}

export default function InAppBrowserBanner() {
  const [show, setShow] = useState(false)
  const { isMuted } = useAuth()

  useEffect(() => {
    if (isInAppBrowser() && daysAgo(INAPP_DISMISSED_KEY, 7)) {
      setShow(true)
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem(INAPP_DISMISSED_KEY, new Date().toISOString())
    setShow(false)
  }

  


  return (
    <AnimatePresence>
    {show && <motion.div 
    layout
    initial={{ opacity: 0, y: 150, transition: { duration: 0.2 } }}
    animate={{ opacity: 1, y: 0, transition: { duration: 0.2 } }}
    exit={{ opacity: 0, y: 150, transition: { duration: 0.2 } }}
    className="fixed bottom-4 right-4 max-w-sm w-[90vw] sm:w-auto bg-[#4C6CA8] text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-start gap-3">
      <div className="flex-1">
        <p className="font-semibold text-base cursor-default">Heads up — this isn’t a real browser</p>
        <p className="text-sm opacity-90 cursor-default">
          Looks like you're using DewList inside another app (like Instagram or Gmail). It works way better in your default browser — smoother, faster, and installable.
        </p>
        <p className="text-sm opacity-90 mt-1 cursor-default">
          Tap the <span className="font-bold">•••</span> or <span className="font-bold">Open in Browser</span> option to launch DewList in your main browser.
        </p>
      </div>
      <button
        onClick={() => { handleDismiss(); audio('button-press', isMuted); vibration('button-press'); }}
        className="text-white hover:text-gray-200 text-xl leading-none cursor-pointer"
        aria-label="Close in-app browser banner"
      >
        &times;
      </button>
    </motion.div>}
    </AnimatePresence>
  )
}

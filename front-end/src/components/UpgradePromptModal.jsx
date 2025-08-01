import React from 'react';
import { vibration } from '../utilities/vibration';
const dewListLogo = '/DewListGold.png';
import { AnimatePresence, motion } from 'framer-motion';
import { audio } from '../utilities/audio';
import { useAuth } from '../context/AuthContext';

export default function UpgradePromptModal({ isOpen, onClose, onUpgrade }) {
  if (!isOpen) return null;
  const { isMuted } = useAuth();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <AnimatePresence>
      <motion.div 
      layout
      key="modal"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl shadow-xl w-11/12 max-w-md p-6 space-y-4 text-center dark:bg-[#4F5962]">
      <img src={dewListLogo} alt="DewList Logo" className="w-16 h-16 mx-auto mb-5" />
        <h2 className="text-2xl font-bold text-yellow-500 dark:text-yellow-300 cursor-default border py-2 w-fit mx-auto px-4 rounded-full">Upgrade to Pro</h2>
        <p className="text-[#4F5962] dark:text-white text-base cursor-default flex gap-1 justify-center items-center">
          You’ve hit the free-tier limit. <span className="text-yellow-500 dark:text-yellow-300 border py-[2px] px-2 rounded-full text-xs">Pro</span> unlocks:
        </p>
        <ul className="text-left text-[#4F5962] dark:text-white text-sm pl-4 list-disc space-y-1 cursor-default">
          <li>Unlimited task lists</li>
          <li>Unlimited tasks per list</li>
          <li>Scheduled task list reset</li>
          <li>AI-powered task polishing</li>
          <li>AI-powered task breakdown</li>
          <li>AI-powered task list creation</li>
        </ul>
        <p className="font-semibold text-yellow-500 dark:text-yellow-300 cursor-default">Just $5/month or $30/year</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            className="cursor-pointer bg-[#4C6CA8] text-white py-2 px-4 rounded-xl hover:bg-opacity-90 transition hover:bg-[#3A5D91]"
            onClick={()=>{audio('button-press', isMuted) ;vibration('button-press'); onUpgrade()}}
          >
            Upgrade Now
          </button>
          <button
            className="text-[#91989E] hover:text-[#4F5962] dark:hover:text-white transition cursor-pointer"
            onClick={()=>{audio('close-modal', isMuted);vibration('button-press'); onClose()}}
          >
            Maybe Later
          </button>
        </div>
      </motion.div>
      </AnimatePresence>
    </div>
  );
}

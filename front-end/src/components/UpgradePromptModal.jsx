import React from 'react';
import { vibration } from '../utilities/vibration';
const dewListLogo = '/DewListGold.png';
import { AnimatePresence, motion } from 'framer-motion';
import { audio } from '../utilities/audio';
import { useAuth } from '../context/AuthContext';

export default function UpgradePromptModal({ isOpen, onClose, onUpgrade, reason }) {
  if (!isOpen) return null;
  const { isMuted } = useAuth();

  const isAIBlock = reason === 'ai';
  const tierName = isAIBlock ? 'Pro' : 'Focus';
  const price = isAIBlock ? '$8/month' : '$4/month';

  const features = isAIBlock
    ? [
        'AI-powered task list creation',
        'AI task polishing & breakdown',
        'Voice-to-task input',
        'Unlimited lists & tasks',
        'Scheduled task list resets',
      ]
    : [
        'One-task-at-a-time focus view',
        'Up to 3 task lists',
        'Upgrade to Pro for AI features',
      ];

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
        <h2 className="text-2xl font-bold text-yellow-500 dark:text-yellow-300 cursor-default border py-2 w-fit mx-auto px-4 rounded-full">Upgrade to {tierName}</h2>
        <p className="text-[#4F5962] dark:text-white text-base cursor-default">
          {isAIBlock ? 'AI features require a Pro subscription.' : "Unlock the full DewList experience."}
        </p>
        <ul className="text-left text-[#4F5962] dark:text-white text-sm pl-4 list-disc space-y-1 cursor-default">
          {features.map((f, i) => <li key={i}>{f}</li>)}
        </ul>
        <p className="font-semibold text-yellow-500 dark:text-yellow-300 cursor-default">Starting at {price}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            className="cursor-pointer bg-[#4C6CA8] text-white py-2 px-4 rounded-xl hover:bg-opacity-90 transition hover:bg-[#3A5D91]"
            onClick={()=>{audio('button-press', isMuted) ;vibration('button-press'); onUpgrade()}}
          >
            See Plans
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

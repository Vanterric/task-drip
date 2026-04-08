import React from 'react';
import { vibration } from '../utilities/vibration';
const dewListLogo = '/DewListGold.png';
import { AnimatePresence, motion } from 'framer-motion';
import { audio } from '../utilities/audio';
import { useAuth } from '../context/AuthContext';

// Compute the correct upgrade target based on WHY the modal opened AND what
// tier the user is currently on. The previous version of this modal only
// distinguished between 'ai' and "everything else", which broke for Focus
// users who hit the per-list task cap (still 5/list on Focus, only Pro is
// unlimited) — they were prompted to upgrade to Focus despite already being
// on Focus.
function resolveUpgradeTarget(reason, currentTier) {
  switch (reason) {
    case 'ai':
      // AI features only on Pro
      return 'pro';
    case 'task-limit':
      // Both Free (5/list) and Focus (5/list) hit this. Only Pro is unlimited.
      return 'pro';
    case 'list-limit':
      // Free → 1 list, Focus → 3 lists, Pro → unlimited
      return currentTier === 'focus' ? 'pro' : 'focus';
    case 'one-task-view':
      // Only Free is blocked from one-task view; Focus already has it
      return 'focus';
    case 'scheduled-resets':
      // Scheduled list resets are a Pro-only feature per the tier spec
      return 'pro';
    case 'go-pro':
      // CTA badge — always nudges to the highest tier regardless of current
      return 'pro';
    case 'limit': // legacy fallback for any old call sites
    default:
      return currentTier === 'focus' ? 'pro' : 'focus';
  }
}

const COPY = {
  pro: {
    headline: 'Upgrade to Pro',
    price: '$8/month',
    features: [
      'Unlimited tasks per list',
      'Unlimited task lists',
      'AI-powered task list creation',
      'AI task polishing & breakdown',
      'Voice-to-task input',
      'Scheduled task list resets',
    ],
  },
  focus: {
    headline: 'Upgrade to Focus',
    price: '$4/month',
    features: [
      'One-task-at-a-time focus view',
      'Up to 3 task lists',
      'Upgrade to Pro later for AI features',
    ],
  },
};

const REASON_INTRO = {
  'ai': 'AI features require a Pro subscription.',
  'task-limit': "You've reached the limit of 5 tasks per list. Upgrade to Pro for unlimited tasks and lists.",
  'list-limit-from-free': "You've reached the 1-list limit on Free. Upgrade to Focus for up to 3 lists.",
  'list-limit-from-focus': "You've reached the 3-list limit on Focus. Upgrade to Pro for unlimited lists.",
  'one-task-view': 'One-task-at-a-time focus view is a Focus tier feature.',
  'scheduled-resets': 'Scheduled task list resets are a Pro feature.',
  'go-pro': 'Unlock everything DewList can do.',
  'default-from-free': 'Unlock the full DewList experience.',
  'default-from-focus': 'Upgrade to Pro for AI features and unlimited tasks/lists.',
};

function resolveIntro(reason, currentTier) {
  if (reason === 'ai') return REASON_INTRO.ai;
  if (reason === 'task-limit') return REASON_INTRO['task-limit'];
  if (reason === 'one-task-view') return REASON_INTRO['one-task-view'];
  if (reason === 'scheduled-resets') return REASON_INTRO['scheduled-resets'];
  if (reason === 'go-pro') return REASON_INTRO['go-pro'];
  if (reason === 'list-limit') {
    return currentTier === 'focus' ? REASON_INTRO['list-limit-from-focus'] : REASON_INTRO['list-limit-from-free'];
  }
  return currentTier === 'focus' ? REASON_INTRO['default-from-focus'] : REASON_INTRO['default-from-free'];
}

export default function UpgradePromptModal({ isOpen, onClose, onUpgrade, reason }) {
  // Hooks must run before any early return per React rules-of-hooks. The original
  // file had this pattern reversed (isOpen check before useAuth) but only used
  // isMuted from the context, so the latent bug had limited impact. Fixing it as
  // an incidental because the new tier-aware logic now reads user.tier.
  const { isMuted, user } = useAuth();
  if (!isOpen) return null;

  const currentTier = user?.tier || 'free';
  const target = resolveUpgradeTarget(reason, currentTier);
  const copy = COPY[target];
  const intro = resolveIntro(reason, currentTier);

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
        <h2 className="text-2xl font-bold text-yellow-500 dark:text-yellow-300 cursor-default border py-2 w-fit mx-auto px-4 rounded-full">{copy.headline}</h2>
        <p className="text-[#4F5962] dark:text-white text-base cursor-default">
          {intro}
        </p>
        <ul className="text-left text-[#4F5962] dark:text-white text-sm pl-4 list-disc space-y-1 cursor-default">
          {copy.features.map((f, i) => <li key={i}>{f}</li>)}
        </ul>
        <p className="font-semibold text-yellow-500 dark:text-yellow-300 cursor-default">Starting at {copy.price}</p>
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

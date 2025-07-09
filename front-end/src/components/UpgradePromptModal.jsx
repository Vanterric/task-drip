import React from 'react';
import { vibration } from '../utilities/vibration';

export default function UpgradePromptModal({ isOpen, onClose, onUpgrade }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-11/12 max-w-md p-6 space-y-4 text-center dark:bg-[#4F5962]">
        <h2 className="text-2xl font-bold text-[#4F5962] dark:text-white cursor-default">Upgrade to Pro</h2>
        <p className="text-[#4F5962] dark:text-white text-base cursor-default">
          You’ve hit the free-tier limit. Pro unlocks:
        </p>
        <ul className="text-left text-[#4F5962] dark:text-white text-sm pl-4 list-disc space-y-1 cursor-default">
          <li>Unlimited task lists</li>
          <li>Unlimited tasks per list</li>
          <li>Scheduled task list reset</li>
          <li>AI-powered task breakdown</li>
        </ul>
        <p className="font-semibold text-[#4C6CA8] dark:text-[#90A9D6] cursor-default">Just $5/month or $30/year</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            className="cursor-pointer bg-[#4C6CA8] text-white py-2 px-4 rounded-xl hover:bg-opacity-90 transition hover:bg-[#3A5D91]"
            onClick={()=>{vibration('button-press'); onUpgrade()}}
          >
            Upgrade Now
          </button>
          <button
            className="text-[#91989E] hover:text-[#4F5962] dark:hover:text-white transition cursor-pointer"
            onClick={()=>{vibration('button-press'); onClose()}}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}

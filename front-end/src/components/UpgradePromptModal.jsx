import React from 'react';

export default function UpgradePromptModal({ isOpen, onClose, onUpgrade }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-11/12 max-w-md p-6 space-y-4 text-center">
        <h2 className="text-2xl font-bold text-[#4F5962]">Upgrade to Pro</h2>
        <p className="text-[#4F5962] text-base">
          You’ve hit the free-tier limit. Pro unlocks:
        </p>
        <ul className="text-left text-[#4F5962] text-sm pl-4 list-disc space-y-1">
          <li>Unlimited task lists</li>
          <li>Unlimited tasks per list</li>
          <li>AI-powered task breakdown</li>
        </ul>
        <p className="font-semibold text-[#4C6CA8]">Just $5/month or $30/year</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            className="cursor-pointer bg-[#4C6CA8] text-white py-2 px-4 rounded-xl hover:bg-opacity-90 transition hover:bg-[#3A5D91]"
            onClick={onUpgrade}
          >
            Upgrade Now
          </button>
          <button
            className="text-[#91989E] hover:text-[#4F5962] transition cursor-pointer"
            onClick={onClose}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}

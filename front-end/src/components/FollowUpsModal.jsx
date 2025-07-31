import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import VoiceCaptureButton from "./VoiceCaptureButton";
import { DotLoader } from "./DotLoader";
import { vibration } from "../utilities/vibration";
import { audio } from "../utilities/audio";

const FollowUpsModal = ({ onClose, followUpQuestions, followUpAnswers, setFollowUpAnswers, handleSubmit, loading }) => {
    const {user, isMuted} = useAuth();
    return (
    <AnimatePresence>
        <motion.div
        layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}>
      <div
        className="bg-background-card dark:bg-background-darkcard rounded-3xl shadow-xl p-6 max-w-md mx-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={()=>{audio('close-modal', isMuted); vibration('button-press'); onClose()}}
          className="absolute top-4 right-4 text-[#4F5962] dark:text-white hover:text-black transition"
        >
          <X className="w-5 h-5 cursor-pointer" />
        </button>

        <h2 className="text-xl font-bold text-[#4F5962] dark:text-white mb-1 cursor-default flex gap-2 justify-start items-center">AI Task List Creation <span className="text-yellow-500 dark:text-yellow-300 border text-xs py-[2px] px-2 rounded-full">Pro</span></h2>
        
        <div className="max-h-[calc(100vh-15rem)] overflow-y-auto">
        {followUpQuestions.map((question, index) => (
  <div key={index} className='relative my-2 flex flex-col gap-1'>
    <label className="text-sm">Q{index + 1}: {question}</label>
    <textarea
      disabled={loading}
      className="w-full border border-[#4F596254] dark:border-white rounded-lg p-3 text-sm text-[#4F5962] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4C6CA8] resize-none min-h-[100px] disabled:opacity-50"
      value={followUpAnswers[index] || ''}
      onChange={(e) =>
        setFollowUpAnswers((prev) => {
          const updated = [...prev];
          updated[index] = e.target.value;
          return updated;
        })
      }
      placeholder="Write your answer here..."
    ></textarea>
    {user.isPro && (
      <div className='absolute bottom-4 right-2'>
        <VoiceCaptureButton
          setState={(value) =>
            setFollowUpAnswers((prev) => {
              const updated = [...prev];
              updated[index] = value;
              return updated;
            })
          }
        />
      </div>
    )}
    
  </div>
))}
</div>
        <button
        disabled={loading}
        onClick={handleSubmit}
        onPointerDown={() => { audio('button-press', isMuted); }}
        className={`mt-4 px-6 py-3 w-full text-sm font-medium rounded-lg transition text-white ${
            loading
            ? 'bg-[#4C6CA8]/60 cursor-not-allowed'
            : 'bg-[#4C6CA8] hover:bg-[#3A5D91] cursor-pointer'
        }`}
        >
        {loading ? <span className="flex items-center justify-center gap-1">Generating <span className="mt-2"><DotLoader/></span></span> : 'Generate New Task List'}
        </button>
      </div>
      </motion.div>
      </AnimatePresence>
    )
}

export default FollowUpsModal
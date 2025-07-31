import { AnimatePresence, motion } from "framer-motion";
import { audio } from "../utilities/audio";
import { vibration } from "../utilities/vibration";
import { useAuth } from "../context/AuthContext";

export default function DeleteTaskListModal({ isOpen, onClose, onConfirm, listName }) {
    if (!isOpen) return null;
    const {isMuted} = useAuth();
  
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4 backdrop-blur-sm">
        <AnimatePresence>
        <motion.div 
        layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center dark:bg-[#4F5962]">
          <h2 className="text-lg font-semibold text-[#4F5962] dark:text-white cursor-default">Delete this list?</h2>
          <p className="text-sm text-text-info dark:text-text-darkinfo mt-2 cursor-default">
            This will delete <span className="font-semibold text-[#4F5962] dark:text-white">"{listName}"</span> and all its tasks.
          </p>
          <p className="text-sm text-[#D66565] mt-1 font-semibold cursor-default">
            This cannot be undone.
          </p>
  
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={()=>{audio('close-modal', isMuted); vibration('button-press'); onClose()}}
              className="cursor-pointer text-[#91989E] hover:border-[#4F5962] hover:text-[#4F5962] dark:hover:text-white dark:hover:border-white px-4 py-2 rounded-lg border border-[#91989E] transition"
            >
              Cancel
            </button>
            <button
              onPointerDown={() => { audio('button-press', isMuted); }}
              onClick={()=>{vibration('button-press'); onConfirm()}}
              className="cursor-pointer bg-[#D66565] text-white px-4 py-2 rounded-lg hover:bg-[#B94E4E] transition"
            >
              Delete
            </button>
          </div>
        </motion.div>
        </AnimatePresence>
      </div>
    );
  }
  
import { useState } from "react";
import { vibration } from "../utilities/vibration";
import Dropdown from "./Dropdown";
import { audio } from "../utilities/audio";
import {DotLoader} from "./DotLoader";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

export default function FeedbackModal({ onClose }) {
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackType, setFeedbackType] = useState("Feature Request");
  const [submitting, setSubmitting] = useState(false);
  const { isMuted } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    vibration("button-press");

    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/sendFeedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          type: feedbackType,
          message: feedbackText,
        }),
      });

      onClose();
    } catch (err) {
      console.error("Feedback submission failed", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm">
      <AnimatePresence>
      <motion.div 
      layout
      key="modal"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="bg-white dark:bg-[#4F5962] rounded-3xl shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4 text-[#4F5962] dark:text-white cursor-default">
          Got something to share?
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative">
          <Dropdown state={feedbackType} setState={setFeedbackType} options={["Feature Request", "Bug Report", "Kudos", "Press", "Other"]} />
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Tell us what’s on your mind..."
            className="w-full px-4 py-3 border border-[#4F596254] dark:border-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#90A9D6] h-28 resize-none bg-white dark:bg-[#4F5962] text-[#4F5962] dark:text-white"
          />

          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => {
                audio('close-modal', isMuted);
                vibration("button-press");
                onClose();
              }}
              className="text-sm text-[#91989E] dark:hover:text-white hover:text-[#4F5962] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              onPointerDown={() => { audio('button-press', isMuted); vibration("button-press"); }}
              className="bg-[#4C6CA8] text-white px-5 py-2 rounded-xl hover:bg-[#3A5D91] transition cursor-pointer w-30"
            >
              {submitting ? <span className="flex justify-center items-center gap-1">Sending <span className="mt-2"><DotLoader/></span></span> : "Send"}
            </button>
          </div>
        </form>
      </motion.div>
      </AnimatePresence>
    </div>
  );
}

import { useState } from "react";
import { vibration } from "../utilities/vibration";
import { Info } from "lucide-react";
import { useContext } from "react";
import { ColorContext } from "../context/ColorContext";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { safeParsePolished } from "../utilities/safeParsePolished";

export default function AddTaskModal({ isOpen, onClose, onSubmit, taskList, tasks }) {
  const [taskText, setTaskText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPolishItInfo, setShowPolishItInfo] = useState(false);
  const [polishItSelected, setPolishItSelected] = useState(false);
  const {token, user} = useAuth()
  const {colors} = useContext(ColorContext)
  const dailyPromptMap = {
  "Monday": "Happy Monday! What’s one small step you can take today to set a kind, steady tone for your week?",
  "Tuesday": "Hey, it’s Tuesday. Got something your brain's been quietly dodging? Take one tiny step towards it and clear a little mental bandwidth.",
  "Wednesday": "Midweek reset! What's one thing you could tackle today to help your future brain feel a little more steady handling the rest of the week?",
  "Thursday": "It’s Thursday! Got a mental tab you keep circling? Let's clear it and make space for the weekend.",
  "Friday": "Happy Friday! Big energy or low key - what's one thing you'd like to wrap up today?",
  "Saturday": "Hello, weekend. What’s one light, satisfying task that feels doable and good for *you* today?",
  "Sunday": "It’s Sunday. What’s one easy move you could make to help next week feel a little calmer and clearer?"
}


    const today = new Date();
    const dayOfWeek = today.toLocaleString('en-US', { weekday: 'long' });

  


  
  
    const handleSubmit = async (e) => {
    e.preventDefault();
    if (!taskText.trim()) return;
    vibration('button-press')
    setSubmitting(true);
    if(polishItSelected) {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/ai/polish`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ task: taskText, currentTaskList: taskList, currentTasks: tasks}),
        });
        if (response.ok) {
          const data = await response.json();
          const polished = safeParsePolished(data.polished);
          await onSubmit(polished);
        } else {
          console.error('Failed to polish task');
          await onSubmit({ content: taskText }); // Fallback to original text
        }
      } catch (error) {
        console.error('Error polishing task:', error);
        await onSubmit({ content: taskText }); // Fallback to original text
      }
    } else {
      await onSubmit({ content: taskText });
    }
    setTaskText("");
    setSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm">
      <AnimatePresence>
      <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}>
      <div className="bg-background-card dark:bg-background-darkcard rounded-3xl shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4 text-text-primary dark:text-text-darkprimary cursor-default">Add a new task</h2>
        <p className="text-sm text-text-primary dark:text-text-darkprimary mb-4 cursor-default">
          {dailyPromptMap[dayOfWeek]}
        </p>
        <form className="flex flex-col gap-4">
          <input
            type="text"
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
            placeholder="What's your next move?"
            className="w-full px-4 py-3 border border-text-secondary dark:border-text-darksecondary rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-focusring"
          />
          {showPolishItInfo && (
            <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            >
            <p className="text-xs text-text-info dark:text-text-darkinfo italic">
              Cleans up your task with better phrasing, added details, and smart suggestions.
            </p>
            </motion.div>
            )}
          <div className="flex items-center text-sm gap-2 text-text-primary dark:text-text-darkprimary select-none">
          <input
            type='checkbox'
            className="disabled:cursor-not-allowed disabled:bg-text-info  cursor-pointer appearance-none w-5 h-5 rounded-sm border shrink-0 border-text-secondary bg-white checked:bg-accent-primary checked:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-focusring transition-all duration-150 relative"
            checked={polishItSelected}
            onChange={() => setPolishItSelected(!polishItSelected)}
            disabled={!user.isPro}
            title={!user.isPro ? "Polish it is a Pro feature. Upgrade to unlock!" : "Polish it"}
            />
          Polish it <Info className="w-3 h-3 text-text-primary dark:text-white cursor-pointer" onClick={() => setShowPolishItInfo(!showPolishItInfo)} />
        </div>
          
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={()=>{vibration('button-press'); onClose()}}
              className="text-sm text-text-secondary dark:text-text-darksecondary dark:hover:text-text-darkprimary hover:text-text-primary transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-accent-primary text-text-darkprimary px-5 py-2 rounded-xl hover:bg-[#3A5D91] transition cursor-pointer"
              onClick={(e) => {
                handleSubmit(e);   
              }}
            >
              {submitting ? "Adding..." : "Add Task"}
            </button>
          </div>
        </form>
      </div>
      </motion.div>
      </AnimatePresence>
    </div>
  );
}

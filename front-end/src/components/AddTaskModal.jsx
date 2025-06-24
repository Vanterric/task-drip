import { useState } from "react";
import { vibration } from "../utilities/vibration";

export default function AddTaskModal({ isOpen, onClose, onSubmit }) {
  const [taskText, setTaskText] = useState("");
  const [submitting, setSubmitting] = useState(false);
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
    await onSubmit(taskText);
    setTaskText("");
    setSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#4F5962] rounded-3xl shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4 text-[#4F5962] dark:text-white cursor-default">Add a new task</h2>
        <p className="text-sm text-[#4F5962] dark:text-white mb-4 cursor-default">
          {dailyPromptMap[dayOfWeek]}
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
            placeholder="What's your next move?"
            className="w-full px-4 py-3 border border-[#4F596254] dark:border-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#90A9D6]"
          />

          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={()=>{vibration('button-press'); onClose()}}
              className="text-sm text-[#91989E] dark:hover:text-white hover:text-[#4F5962] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#4C6CA8] text-white px-5 py-2 rounded-xl hover:bg-[#3A5D91] transition cursor-pointer"
            >
              {submitting ? "Adding..." : "Add Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

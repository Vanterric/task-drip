import { useState } from "react";
import { vibration } from "../utilities/vibration";

export default function AddTaskModal({ isOpen, onClose, onSubmit }) {
  const [taskText, setTaskText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const dailyPromptMap = {
  "Monday": "Happy Monday! What’s one small step you can take today to set a kind tone for your week?",
  "Tuesday": "Hey, it’s Tuesday. What’s one thing that’s been floating around in your brain you’d feel better nudging forward?",
  "Wednesday": "Happy Hump Day! What’s one task that would make the rest of your week feel more manageable or smooth?",
  "Thursday": "It’s Thursday! Almost there! What’s one meaningful thing you’d like to make progress on before the week wraps up?",
  "Friday": "Happy Friday! What’s one thing you could close out today to give yourself a cleaner break heading into the weekend?",
  "Saturday": "Hello, weekend. What’s one light or satisfying task that feels doable and good for *you* today?",
  "Sunday": "It’s Sunday. What’s one low-effort move that could make next week feel calmer, clearer, or more grounded?"
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

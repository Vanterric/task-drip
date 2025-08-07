import { Stars, X } from 'lucide-react';
import { useState } from 'react';
import { vibration } from '../utilities/vibration';
import { handleUpdateIcon } from '../utilities/handleUpdateIcon';
import getRelevantIcon from '../utilities/getRelevantIcon';
import { audio } from '../utilities/audio';
import { DotLoader } from './DotLoader';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function FirstTimeUserTaskBreakdownModal({ isOpen, onClose, setActiveTaskList, setTasks, setTaskLists }) {
  if (!isOpen) return null;
  const [loading, setLoading] = useState(false);
  const {isMuted} = useAuth();
  const [goal, setGoal] = useState('');
  const dailyPromptMap = {
  "Monday": "Happy Monday! What’s one thing that would help you start the week on solid ground?",
  "Tuesday": "Hey, it’s Tuesday. What’s something that’s been floating in your brain because you’re not sure where to begin?",
  "Wednesday": "Happy hump day! What’s a task that feels messy, complex, or hard to untangle right now?",
  "Thursday": "It’s Thursday! Almost there. What’s one thing you’ve been circling around that needs some clarity or smaller steps?",
  "Friday": "Happy Friday! What’s something you’d like to wrap up before the weekend, but still feels a little foggy?",
  "Saturday": "Look at you being productive during the weekend! What’s something you’d like to make progress on, but you’re not sure how to get started?",
  "Sunday": "Sunday Funday! What’s coming up next week that feels too big or vague to plan for? Let’s get ahead of it together."
}


    const today = new Date();
    const dayOfWeek = today.toLocaleString('en-US', { weekday: 'long' });

  const handleSubmit = async () => {    

    if (!goal.trim()) return;
    vibration('button-press');
    setLoading(true);

    try {
      // 1. Ask AI to break down the task
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/ai/breakdown`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ goal }),
      });

      const { taskList } = await res.json();

      // 2. Create task list
      const listRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/tasklists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ name: taskList.title }),
      });

      const newTaskList = await listRes.json();

      if (!newTaskList._id) throw new Error('Failed to create task list');

      // 3. Add tasks to the list
      for (const task of taskList.tasks) {
        await fetch(`${import.meta.env.VITE_BACKEND_URL}/tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify({
            tasklistId: newTaskList._id,
            content: task.content,
          }),
        });
      }

      // 4. Update frontend state
      setActiveTaskList(newTaskList);
      setTaskLists((prev) => [...prev, newTaskList]);
      const taskRes = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/tasks?tasklistId=${newTaskList._id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );

      const savedTasks = await taskRes.json();
      setTasks(savedTasks);
      const newIcon = await getRelevantIcon(goal)
      if (newIcon) handleUpdateIcon(newTaskList._id, newIcon, localStorage.getItem('authToken'), setTaskLists);
      // 5. Mark user as no longer first-time
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/user/noLongerFirstTime`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      onClose();
    } catch (err) {
      console.error('Error handling first-time AI task breakdown:', err);
      alert('Something went wrong generating your task list.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={() => { vibration('button-press'); audio('close-modal', isMuted); onClose(); }}
    >
      <AnimatePresence>
      <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
        className="bg-white dark:bg-[#4F5962] w-full max-w-lg rounded-xl shadow-xl p-6 relative mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={() => {
            audio('close-modal', isMuted);
            vibration('button-press');
            onClose();
          }}
          className="absolute top-4 right-4 text-[#4F5962] dark:text-white hover:text-black transition"
        >
          <X className="w-5 h-5 cursor-pointer" />
        </button>

        <h2 className="text-xl font-bold text-[#4F5962] dark:text-white mb-1 cursor-default">
            Welcome to DewList!
            </h2>
            <p className="text-sm text-[#4F5962] dark:text-white mb-4 cursor-default">
            {dailyPromptMap[dayOfWeek]} <br/> <br />
            Tell us, and we’ll turn it into a simple, doable task list!<br /><br />
            <i>Normally this is a Pro-only feature, but your first one's on us </i>🎁 <br/> <br/>
            <i>If you like it, consider upgrading to Pro! You'll be able to create new task lists with a text description by clicking the <span className='text-[#4C6CA8] whitespace-nowrap dark:text-[#AAB8C2]'>"<Stars className='inline h-4'/>"</span> button on the bottom left of the screen.</i>
            </p>
        <textarea
          disabled={loading}
          className="w-full border border-[#4F596254] dark:border-white rounded-lg p-3 text-sm text-[#4F5962] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4C6CA8] resize-none min-h-[100px] disabled:opacity-50"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="e.g. Clean my apartment"
        ></textarea>

        <button
          disabled={loading}
          onClick={handleSubmit}
          onPointerDown = {() => { audio('button-press', isMuted); }}
          className={`mt-4 px-6 py-3 w-full text-sm font-medium rounded-lg transition text-white ${
            loading
              ? 'bg-[#4C6CA8]/60 cursor-not-allowed'
              : 'bg-[#4C6CA8] hover:bg-[#3A5D91] cursor-pointer'
          }`}
        >
          {loading ? <span className="flex items-center justify-center gap-1">Generating <span className="mt-2"><DotLoader/></span></span> : "Let's do it!"}
        </button>
      </motion.div>
      </AnimatePresence>
    </div>
  );
}

import { X } from 'lucide-react';
import { useState } from 'react';
import { vibration } from '../utilities/vibration';
import getRelevantIcon from '../utilities/getRelevantIcon';
import { handleUpdateIcon } from '../utilities/handleUpdateIcon';
import { safeParsePolished } from '../utilities/safeParsePolished';
import VoiceCaptureButton from './VoiceCaptureButton';
import { useAuth } from '../context/AuthContext';
import { DotLoader } from './DotLoader';

export default function AITaskBreakdownModal({ isOpen, onClose, setActiveTaskList, setTasks, setTaskLists, setFinalTask, token, taskLists }) {
  if (!isOpen) return null;
  const [loading, setLoading] = useState(false);
  const [goal, setGoal] = useState('');
  const { user } = useAuth();
  const dailyPromptMap = {
  "Monday": "Happy Monday! What's one thing you could do today to start the week feeling grounded and clear?",
  "Tuesday": "Hey, it’s Tuesday. What's cluttering your head because it's missing a start cue?",
  "Wednesday": "Midweek check-in! What’s a task that feels a little tangled or tricky right now?",
  "Thursday": "It’s Thursday! Almost there. What’s one thing you’ve been circling around that needs some clarity or smaller steps?",
  "Friday": "Happy Friday! What’s something you’d like to wrap up before the weekend, but still feels a little foggy?",
  "Saturday": "Weekend Vibes! Been holding onto an idea or side project? Let's break it down into bite-sized tasks!",
  "Sunday": "Sunday Funday! What's feeling big or blurry next week? Let's untangle it together!"
}




    const today = new Date();
    const dayOfWeek = today.toLocaleString('en-US', { weekday: 'long' });

  const handleSubmit = async () => {
    if (!goal.trim()) return;
    vibration('button-press')
    setLoading(true);
    try {
      // 1. Send goal to AI
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/ai/breakdown`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ goal }),
      });
  
      const { taskList } = await res.json();
      const polishedTaskList = safeParsePolished(taskList);

  
      // 2. Create new task list
      const listRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/tasklists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ name: polishedTaskList.title, creationPrompt:goal, order: taskLists.length}),
      });
  
      const newTaskList = await listRes.json();
  
      if (!newTaskList._id) {
        throw new Error('Failed to create task list');
      }
  
      // 3. Create tasks in that list
      for (const task of polishedTaskList.tasks) {
        await fetch(`${import.meta.env.VITE_BACKEND_URL}/tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify({
            tasklistId: newTaskList._id,
            content: task.content,
            description: task.description || '',
            dewDate: new Date(`${task.dewDate}T12:00:00`) || null,
            timeEstimate: task.timeEstimate || null,
            order: task.order || 0, 
          }),
        });
      }
  
      // 4. Set the new list as active
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
      const newIcon = await getRelevantIcon(goal)
      if (newIcon) handleUpdateIcon(newTaskList._id, newIcon, token, setTaskLists);
      setFinalTask(savedTasks[savedTasks.length - 1]);
      setTasks(savedTasks);
      
      onClose();
    } catch (err) {
      console.error('Error handling AI task breakdown:', err);
      alert('Something went wrong generating your task list.');
    } finally{
        setLoading(false);
    }
  };
  

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#4F5962] w-full max-w-lg rounded-xl shadow-xl p-6 relative mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={()=>{vibration('button-press'); onClose()}}
          className="absolute top-4 right-4 text-[#4F5962] dark:text-white hover:text-black transition"
        >
          <X className="w-5 h-5 cursor-pointer" />
        </button>

        <h2 className="text-xl font-bold text-[#4F5962] dark:text-white mb-1 cursor-default flex gap-2 justify-start items-center">AI Task List Creation <span className="text-yellow-500 dark:text-yellow-300 border text-xs py-[2px] px-2 rounded-full">Pro</span></h2>
        <p className="text-sm text-[#4F5962] dark:text-white mb-4 cursor-default">
          {dailyPromptMap[dayOfWeek]}
        </p>
        <div className='relative'>
        <textarea
        disabled={loading}
        className="w-full border border-[#4F596254] dark:border-white rounded-lg p-3 text-sm text-[#4F5962] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4C6CA8] resize-none min-h-[100px] disabled:opacity-50"
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        placeholder="e.g. Plan my startup launch"
        ></textarea>
        <div className='absolute bottom-4 right-2'>
        {user.isPro && <VoiceCaptureButton setState={setGoal} />}
        </div>
        </div>
        <button
        disabled={loading}
        onClick={handleSubmit}
        className={`mt-4 px-6 py-3 w-full text-sm font-medium rounded-lg transition text-white ${
            loading
            ? 'bg-[#4C6CA8]/60 cursor-not-allowed'
            : 'bg-[#4C6CA8] hover:bg-[#3A5D91] cursor-pointer'
        }`}
        >
        {loading ? <span className="flex items-center justify-center gap-1">Generating <span className="mt-2"><DotLoader/></span></span> : 'Generate New Task List'}
        </button>
      </div>
    </div>
  );
}

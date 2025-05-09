import { X } from 'lucide-react';
import { useState } from 'react';
import { vibration } from '../utilities/vibration';

export default function AITaskBreakdownModal({ isOpen, onClose, setActiveTaskList, setTasks, setTaskLists }) {
  if (!isOpen) return null;
  const [loading, setLoading] = useState(false);
  const [goal, setGoal] = useState('');

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
  
      const { taskList } = await res.json(); // from AI backend: { title, tasks: [...] }
  
      // 2. Create new task list
      const listRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/tasklists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ name: taskList.title }),
      });
  
      const newTaskList = await listRes.json();
  
      if (!newTaskList._id) {
        throw new Error('Failed to create task list');
      }
  
      // 3. Create tasks in that list
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

        <h2 className="text-xl font-bold text-[#4F5962] dark:text-white mb-1 cursor-default">AI Task Breakdown</h2>
        <p className="text-sm text-[#4F5962] dark:text-white mb-4 cursor-default">
          Describe your goals and have AI break it down into a task list.
        </p>

        <textarea
        disabled={loading}
        className="w-full border border-[#4F596254] dark:border-white rounded-lg p-3 text-sm text-[#4F5962] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4C6CA8] resize-none min-h-[100px] disabled:opacity-50"
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        placeholder="e.g. Plan my startup launch"
        ></textarea>

        <button
        disabled={loading}
        onClick={handleSubmit}
        className={`mt-4 px-6 py-3 w-full text-sm font-medium rounded-lg transition text-white ${
            loading
            ? 'bg-[#4C6CA8]/60 cursor-not-allowed'
            : 'bg-[#4C6CA8] hover:bg-[#3A5D91] cursor-pointer'
        }`}
        >
        {loading ? 'Generating...' : 'Generate Tasks with AI'}
        </button>
      </div>
    </div>
  );
}

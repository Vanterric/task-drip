import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import AddTaskModal from "../../components/AddTaskModal";
import Sidebar from "../../components/Sidebar";

import { Menu } from "lucide-react"; // optional icon lib, or use emoji

export default function HomePage() {
  const { token } = useAuth();
  const [activeTaskList, setActiveTaskList] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [taskLists, setTaskLists] = useState([]);

  

  useEffect(() => {
    const fetchData = async () => {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
  
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/tasklists`, { headers });
        const lists = await res.json();
  
        if (lists.length === 0) return setLoading(false);
  
        setTaskLists(lists);
        setActiveTaskList(lists[0]); // pick the first list
  
        const resTasks = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/tasks?tasklistId=${lists[0]._id}`,
          { headers }
        );
        const taskData = await resTasks.json();
        setTasks(taskData);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
  
    if (token) fetchData();
  }, [token]);
  

  const handleComplete = async (taskId) => {
    const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
    await fetch(`${import.meta.env.VITE_BACKEND_URL}/tasks/${taskId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ isComplete: true }),
    });

    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, isComplete: true } : t))
    );
  };

  const handleSkip = (taskId) => {
    const index = tasks.findIndex((t) => t._id === taskId);
    const reordered = [...tasks];
    const [skipped] = reordered.splice(index, 1);
    reordered.push(skipped);
    setTasks(reordered);
  };

  const nextTask = tasks.find((t) => !t.isComplete);
  const completedCount = tasks.filter((t) => t.isComplete).length;

  return (
    <div className="min-h-screen bg-[#FAECE5] flex flex-col relative text-[#4F5962]">
      {/* Masthead */}
      <div className="flex items-center justify-between px-4 py-4">
      <button className="p-2 rounded-full bg-white shadow-md" onClick={() => setShowSidebar(true)}>
  <Menu size={24} className="text-[#4F5962]" />
</button>

        <h1 className="text-xl font-bold truncate max-w-[60%]">
  {activeTaskList ? activeTaskList.name : "Task Drip"}
</h1>

        <div className="w-10" /> {/* placeholder to balance flex space */}
      </div>

      <div className="flex-grow flex flex-col items-center justify-center px-4">
        {loading ? (
          <p className="text-lg text-[#91989E]">Loading tasks...</p>
        ) : !activeTaskList || tasks.length === 0 ? (
            <p className="text-lg text-[#91989E]">
              { !activeTaskList ? "No task list yet. Add one to get started." : "No tasks in this list yet. Try adding one." }
            </p>
        ) : nextTask ? (
          <div className="w-full max-w-md text-center space-y-6">
            <div className="bg-white rounded-3xl shadow-lg p-6 text-xl font-semibold">
              {nextTask.content}
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => handleComplete(nextTask._id)}
                className="bg-[#6DBF67] text-white px-6 py-3 rounded-xl hover:bg-[#58a754] transition"
              >
                ✅ Done
              </button>
              <button
                onClick={() => handleSkip(nextTask._id)}
                className="bg-[#4E81AF] text-white px-6 py-3 rounded-xl hover:bg-[#3A6892] transition"
              >
                🔁 Skip
              </button>
            </div>

            <p className="text-sm text-[#91989E]">
              {completedCount} of {tasks.length} completed
            </p>
          </div>
        ) : (
          <div className="text-center text-[#6DBF67] text-lg font-medium">
            🎉 All tasks complete! Chill time.
          </div>
        )}
      </div>

      <button
  className="fixed bottom-6 right-6 bg-[#874B9E] text-white px-6 py-4 rounded-full text-lg shadow-lg hover:bg-[#723d85] transition"
  onClick={() => setShowAddModal(true)}
>
  ➕ Add Task
</button>

<AddTaskModal
  isOpen={showAddModal}
  onClose={() => setShowAddModal(false)}
  onSubmit={async (text) => {
    let activeList = activeTaskList;
    const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
    // Step 1: Create a task list if one doesn’t exist
    if (!activeList) {
      const listRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/tasklists`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name: "My First List" }),
      });
  
      activeList = await listRes.json();
      setTaskList(activeList);
    }
  
    // Step 2: Create the task using the newly created or existing list
    const taskRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/tasks`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        tasklistId: activeList._id,
        content: text,
      }),
    });
  
    const newTask = await taskRes.json();
    setTasks((prev) => [...prev, newTask]);
  }}
  
/>
<Sidebar
token={token}
  isOpen={showSidebar}
  onClose={() => setShowSidebar(false)}
  taskLists={taskLists}
  setTaskLists={setTaskLists}
  setActiveTaskList={setActiveTaskList}
  activeTaskList={activeTaskList}
  setTasks={setTasks}
  onSelectList={async (list) => {
    setActiveTaskList(list);

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/tasks?tasklistId=${list._id}`,
      { headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }}
    );
    const taskData = await res.json();
    setTasks(taskData);
  }}
  onAddTaskList={async (name) => {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/tasklists`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });

    const newList = await res.json();
    setTaskLists((prev) => [...prev, newList]);
    setActiveTaskList(newList);
    setTasks([]);
  }}
/>



    </div>
  );
}
import { useState, useEffect } from "react";
import { vibration } from "../utilities/vibration";

export default function EditTaskListModal({
  isOpen,
  onClose,
  list,
  token,
  onSave, // callback to refetch or update state
}) {
  const [listName, setListName] = useState(list?.name || "");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletedTaskIds, setDeletedTaskIds] = useState([]);

  useEffect(() => {
    if (!isOpen || !list?._id) return;

    const fetchTasks = async () => {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/tasks?tasklistId=${list._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await res.json();
      setTasks(data);
      setLoading(false);
    };

    setListName(list.name);
    fetchTasks();
  }, [isOpen, list]);

  const updateTaskContent = (id, newContent) => {
    setTasks((prev) =>
      prev.map((task) => (task._id === id ? { ...task, content: newContent } : task))
    );
  };

  const handleSave = async () => {
    // 1. Update list name
    vibration('button-press')
await fetch(`${import.meta.env.VITE_BACKEND_URL}/tasklists/${list._id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: listName }),
  });
  
  // 2. Update modified tasks
  await Promise.all(
    tasks.map((task) =>
      fetch(`${import.meta.env.VITE_BACKEND_URL}/tasks/${task._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: task.content }),
      })
    )
  );
  
  // 3. Delete removed tasks
  await Promise.all(
    deletedTaskIds.map((taskId) =>
      fetch(`${import.meta.env.VITE_BACKEND_URL}/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
    )
  );
  
  onSave();
  onClose();  
  };

  const handleDeleteTask = (taskId) => {
    setDeletedTaskIds((prev) => [...prev, taskId]);
    setTasks((prev) => prev.filter((task) => task._id !== taskId));
  };
  

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#4F5962] rounded-2xl shadow-xl max-w-lg w-full p-6">
        <h2 className="text-lg font-bold text-[#4F5962] dark:text-white mb-4">Edit Task List</h2>

        <label className="text-sm text-[#91989E] block mb-1">List Name</label>
        <input
          className="w-full px-4 py-2 mb-4 border border-[#4F596240] dark:border-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#90A9D6]"
          value={listName}
          onChange={(e) => setListName(e.target.value)}
        />

        <label className="text-sm text-[#91989E] block mb-1">Tasks</label>
        <div className="max-h-64 overflow-y-auto space-y-2">
            {loading ? (
                <p className="text-[#91989E]">Loading tasks...</p>
            ) : (
                tasks.map((task) => (
                <div key={task._id} className="flex items-center space gap-1 ">
                    <input
                    className="w-full px-3 py-2 border border-[#E0ECFC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#90A9D6] m-1"
                    value={task.content}
                    onChange={(e) => updateTaskContent(task._id, e.target.value)}
                    />
                    <button
                    className="text-[#DF7C52] hover:text-red-600 font-bold text-lg cursor-pointer"
                    onClick={() => {vibration('button-press'); handleDeleteTask(task._id)}}
                    title="Delete task"
                    >
                    &minus;
                    </button>
                </div>
                ))
            )}
        </div>


        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={ ()=>{vibration('button-press'); onClose(); setDeletedTaskIds([])}}
            className="text-[#91989E] px-4 py-2 rounded-lg  cursor-pointer dark:hover:text-white hover:text-[#4F5962] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-[#4C6CA8] text-white px-4 py-2 rounded-lg hover:bg-[#3A5D91] cursor-pointer transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

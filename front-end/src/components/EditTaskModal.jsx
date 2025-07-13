import { useState, useEffect } from "react";
import { vibration } from "../utilities/vibration";
import { useAuth } from "../context/AuthContext";

export default function EditTaskModal({ isOpen, onClose, onSubmit, task, setTasks }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dewDate, setDewDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const {token} = useAuth()


  function fromDateInputStringToLocalLateNight(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 23, 59); // 11:59 PM local time
}
function toLocalDateInputString(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}


  useEffect(() => {
    if (task) {
      setTitle(task.content || "");
      setDescription(task.description || "");
      setDewDate(task.dewDate ? toLocalDateInputString(task.dewDate) : "");
    }
  }, [task]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    const dewDateObj = dewDate ? fromDateInputStringToLocalLateNight(dewDate) : null;
    if (!title.trim()) return;
    vibration("button-press");
    setSubmitting(true);
    await onSubmit({
      ...task,
      content: title,
      description,
      dewDate: dewDateObj ? dewDateObj.toISOString() : null,
    });
    setSubmitting(false);
    onClose();
  };

  const handleDeleteTask = async () => {
  vibration("button-press");
  await fetch(`${import.meta.env.VITE_BACKEND_URL}/tasks/${task._id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  setTasks((prev) => prev.filter((t) => t._id !== task._id));
  setShowConfirmDelete(false);
  onClose(); // or pass back some delete signal via onDelete?
};


  


  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#4F5962] rounded-3xl shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[#4F5962] dark:text-white cursor-default ">
          Edit Task
        </h2>
        <div className="text-[#D66565] hover:text-[#B94E4E] text-sm cursor-pointer transition" onClick={() => {
              vibration("button-press");
              setShowConfirmDelete(true);
            }}>
                Delete Task
            </div>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="text-[#91989E] dark:text-white block">
            Task Title
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                className="w-full mt-1 px-4 py-3 border border-[#4F596254] dark:border-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#90A9D6]"
            />
            </label>

        <label className="text-[#91989E] dark:text-white block">
            Task Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Task description (optional)"
            className="w-full mt-1 px-4 py-3 border border-[#4F596254] dark:border-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#90A9D6] resize-none min-h-[100px]"
          />
        </label>
        <label className="text-[#91989E] dark:text-white block">
          Task Dew Date
          <input
            type="date"
            value={dewDate}
            onChange={(e) => setDewDate(e.target.value)}
            className="w-full mt-1 px-4 py-3 border border-[#4F596254] dark:border-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#90A9D6] "
          />
        </label>
        <div className="flex items-center justify-end mt-2">
            
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => {
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
              className="bg-[#4C6CA8] text-white px-5 py-2 rounded-xl hover:bg-[#3A5D91] transition cursor-pointer"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
          </div>
        </form>
      </div>
      {showConfirmDelete && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="bg-white dark:bg-[#4F5962] p-6 rounded-3xl shadow-xl max-w-sm w-full mx-4 text-center">
      <h3 className="text-lg font-semibold text-[#4F5962] dark:text-white">
        Delete this task?
      </h3>
      <p className="text-sm text-[#91989E] dark:text-white mt-2">
        This action is <span className="font-semibold text-[#D66565]">irreversible</span>.
      </p>
      <div className="flex gap-4 justify-center mt-6">
        <button
          onClick={() => setShowConfirmDelete(false)}
          className="text-sm text-[#91989E] hover:text-[#4F5962] dark:hover:text-white transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={handleDeleteTask}
          className="bg-[#D66565] text-white px-5 py-2 rounded-xl hover:bg-red-600 transition cursor-pointer"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}

import { useState, useEffect } from "react";
import { vibration } from "../utilities/vibration";
import { useAuth } from "../context/AuthContext";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { unsubscribeFromPush } from "../utilities/unsubscribeFromPush";
import { subscribeToPush } from "../utilities/subscribeToPush";
import { getDeviceLabel } from "../utilities/getDeviceLabel";
import { DotLoader } from "./DotLoader";

export default function EditTaskModal({ isOpen, onClose, onSubmit, task, setTasks, taskList, taskLists }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dewDate, setDewDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const {token, user} = useAuth()
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedTaskList, setSelectedTaskList] = useState(taskList?._id || "");
  const [timeEstimate, setTimeEstimate] = useState(task?.timeEstimate ?? "");
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);

  function fromDateInputStringToUTCNoon(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function toLocalDateInputString(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

useEffect(() => {
  setSelectedTaskList(taskList?._id)
}, [isOpen, taskList])

useEffect(() => {
  setTimeEstimate(task?.timeEstimate ?? "")
}, [isOpen, task])


  useEffect(() => {
    if (task) {
      setTitle(task.content || "");
      setDescription(task.description || "");
      setDewDate(task.dewDate ? toLocalDateInputString(task.dewDate) : "");
      setIsNotificationsEnabled(task.notifyOnDewDate || false);
    }
  }, [task]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    const dewDateObj = dewDate ? fromDateInputStringToUTCNoon(dewDate) : null;
    if (!title.trim()) return;
    vibration("button-press");
    setSubmitting(true);
    if (isNotificationsEnabled) {
          const permission = await Notification.requestPermission();
    
          if (permission === 'granted') {
            const device = getDeviceLabel();
            const success = await subscribeToPush(device, 'dewDate',task.content ,null, task._id);
            if (!success) console.warn("Failed to subscribe for DewDate™ notifications");
          } else {
            console.warn("Notification permission was denied or dismissed.");
            setIsNotificationsEnabled(false);
          }
        }
        else{
          await unsubscribeFromPush('dewDate', null, task._id).catch(err => {
            console.error("Failed to unsubscribe from DewDate™ notifications:", err);
          });
        }
    await onSubmit({
      ...task,
      content: title,
      description,
      dewDate: dewDateObj ? dewDateObj.toISOString() : null,
      tasklistId: selectedTaskList,
      timeEstimate: timeEstimate ? parseInt(timeEstimate) : null,
      notifyOnDewDate: isNotificationsEnabled,
    });
    setSubmitting(false);
    if (selectedTaskList !== taskList?._id) {
      setTasks((prev) => prev.filter((t) => t._id !== task._id));
    }
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
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm ">
      <AnimatePresence>
      <motion.div
      layout
      key="modal"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="bg-white dark:bg-[#4F5962] rounded-3xl shadow-xl p-6 w-full max-w-md mx-4 ">
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-h-[80vh] overflow-hidden">
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
        
        <div className="flex items-center gap-1 justify-start text-xs mt-2  select-none" >
          <div className="cursor-pointer" onClick={() => {vibration("button-press"); setShowAdvanced(!showAdvanced);}}>Advanced</div> <span className="text-yellow-500 dark:text-yellow-300 text-[10px] border px-[8px] rounded-full py-[2px]">Pro</span> <ChevronDown  onClick={() => {vibration("button-press"); setShowAdvanced(!showAdvanced);}} className={`cursor-pointer w-5 h-5 transition ${!showAdvanced ? "transform rotate-[-90deg]" : ""}`} />
        </div>
        <motion.div layout className={`relative ${showAdvanced ? 'overflow-y-auto' : ''}`}>
        <AnimatePresence initial={false}>
        
        <motion.div
        key='advanced-options'
        className="flex flex-col gap-4 mb-2"
        initial={{ opacity: 0, y: -20 }}
        animate={showAdvanced ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: -20, height: 0 }}
  
        exit={{ opacity: 0, y: -10, position: "absolute" }}
        transition={{ duration: 0.2 }}>

        <label className="text-[#91989E] dark:text-white block">
          Task List
          <select
            value={selectedTaskList}
            onChange={(e) => setSelectedTaskList(e.target.value)}
            disabled={!user.isPro}
            className="mt-1 w-full disabled:opacity-50 px-4 py-3 border border-[#4F596254] dark:border-white rounded-xl bg-white dark:bg-[#4F5962] focus:outline-none focus:ring-2 focus:ring-[#90A9D6] text-[#4F5962] dark:text-white"
          >
            {taskLists && taskLists.map((list) => (
              <option key={list._id} value={list._id}>{list.name}</option>
            ))}
          </select>
        </label>

          <label className="text-[#91989E] dark:text-white block">
          Time Estimate (in minutes)
          <input
            type="number"
            placeholder="No Time Estimate Set"
            value={timeEstimate}
            onChange={(e) => setTimeEstimate(e.target.value)}
            disabled={!user.isPro}
            className="w-full disabled:opacity-50 mt-1 px-4 py-3 border border-[#4F596254] dark:border-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#90A9D6] "
          />
        </label>
          <label className="text-[#91989E] dark:text-white block">
          DewDate™
          <input
            type="date"
            value={dewDate}
            onChange={(e) => setDewDate(e.target.value)}
            disabled={!user.isPro}
            className="w-full disabled:opacity-50 mt-1 px-4 py-3 border border-[#4F596254] dark:border-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#90A9D6] "
          />
        </label>

        <div className="flex flex-col gap-1 ml-1">
            <label htmlFor="get-notifications" className="text-sm text-[#4F5962] dark:text-white cursor-default">
              Get a notification?
            </label>
            <p className="text-xs text-[#91989E] dark:text-[#B0B0B0]">
              You’ll receive a notification on this device the day before this task's DewDate™.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="get-notifications"
                checked={isNotificationsEnabled && dewDate && user.isPro}
                disabled={!user.isPro || !dewDate}
                onChange={(e) => {
                  vibration('button-press');
                  setIsNotificationsEnabled(e.target.checked);
                }}
                title={`${dewDate ? "Get a notification one day before your DewDate™" : "Set a DewDate™ first to enable notifications"}`}
                className="disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer appearance-none w-5 h-5 rounded-sm border border-[#4F5962] bg-white checked:bg-[#4C6CA8] checked:border-[#4C6CA8] focus:outline-none focus:ring-2 focus:ring-[#90A9D6] transition-all duration-150 relative"
              />
              <label htmlFor="get-notifications" className="text-sm text-[#4F5962] dark:text-white cursor-pointer">
                Yes, notify me on this device.
              </label>
              </div>
          </div>

          
        </motion.div>
        </AnimatePresence>
        </motion.div>
        <div className="flex items-center justify-end">
            
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => {
                vibration("button-press");
                onClose();
              }}
              className="text-sm text-[#91989E] dark:hover:text-white hover:text-[#4F5962] transition cursor-pointer z-10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#4C6CA8] text-white px-4 py-2 rounded-xl hover:bg-[#3A5D91] cursor-pointer transition w-37 z-10"
            >
              {submitting ? <span className="flex justify-center items-center gap-1">Saving <span className="mt-2"><DotLoader/></span></span> : "Save Changes"}
            </button>
          </div>
          </div>
        </form>
      </motion.div>
      </AnimatePresence>
      {showConfirmDelete && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="bg-white dark:bg-[#4F5962] p-6 rounded-3xl shadow-xl max-w-sm w-full mx-4 text-center">
      <h3 className="text-lg font-semibold text-[#4F5962] dark:text-white">
        Delete this task?
      </h3>
      <p className="text-sm text-text-info dark:text-text-darkinfo mt-2">
        This will delete <span className="font-semibold text-text-primary dark:text-text-darkprimary">"{task.content}"</span>.<br/>
        <span className="font-semibold text-[#D66565]">This cannot be undone.</span>
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

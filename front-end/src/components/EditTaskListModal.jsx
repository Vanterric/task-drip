import { useState, useEffect } from "react";
import { vibration } from "../utilities/vibration";
import { GripVertical, ChevronDown, ChevronRight } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {DotLoader} from "./DotLoader";

export default function EditTaskListModal({
  isOpen,
  onClose,
  list,
  token,
  onSave,
}) {
  const [listName, setListName] = useState(list?.name || "");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletedTaskIds, setDeletedTaskIds] = useState([]);
  const [showTodo, setShowTodo] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [saving, setSaving] = useState(false);

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
    vibration("button-press");
    setSaving(true);
    await fetch(`${import.meta.env.VITE_BACKEND_URL}/tasklists/${list._id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: listName }),
    });
    await Promise.all(
      tasks.map((task, index) =>
        fetch(`${import.meta.env.VITE_BACKEND_URL}/tasks/${task._id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: task.content, isComplete: task.isComplete, order: index, }),
        })
      )
    );
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
    const updatedTasks = tasks.filter((task) => !deletedTaskIds.includes(task._id));
    onSave(updatedTasks);
    setSaving(false);
    onClose();
  };

  const handleDeleteTask = (taskId) => {
    setDeletedTaskIds((prev) => [...prev, taskId]);
    setTasks((prev) => prev.filter((task) => task._id !== taskId));
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const sourceId = source.droppableId;
    const destId = destination.droppableId;

    // Separate tasks by completion
    const todoTasks = tasks.filter((t) => !t.isComplete);
    const completedTasks = tasks.filter((t) => t.isComplete);

    // Reorder within the same list
    if (sourceId === destId) {
      const list = sourceId === "completed" ? completedTasks : todoTasks;
      const [moved] = list.splice(source.index, 1);
      list.splice(destination.index, 0, moved);
    } else {
      // Move between lists
      const sourceList = sourceId === "completed" ? completedTasks : todoTasks;
      const destList = destId === "completed" ? completedTasks : todoTasks;
      const [moved] = sourceList.splice(source.index, 1);
      moved.isComplete = destId === "completed";
      destList.splice(destination.index, 0, moved);
    }

    // Merge back for final tasks order: always show To-Dew first, then Completed
    setTasks([...todoTasks, ...completedTasks]);
  };

  const renderTask = (task, index) => (
    <Draggable key={task._id} draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`flex items-center gap-1 bg-white dark:bg-[#4F5962] p-2 rounded-lg  ${snapshot.isDragging ? "shadow-md" : ""}`}
        >
          <GripVertical className="cursor-grab active:cursor-grabbing opacity-80w-4 h-6 opacity-40 hover:opacity-80 cursor-grab active:cursor-grabbing transition-opacity duration-200" />
          <input
            className="w-full px-3 py-2 border border-[#E0ECFC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#90A9D6]"
            value={task.content}
            onChange={(e) => updateTaskContent(task._id, e.target.value)}
          />
          <button
            className="text-[#D66565] hover:text-[#B94E4E] font-bold text-lg cursor-pointer transition"
            onClick={() => {
              vibration("button-press");
              handleDeleteTask(task._id);
            }}
            title="Delete task"
          >
            &minus;
          </button>
        </div>
      )}
    </Draggable>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#4F5962] rounded-2xl shadow-xl max-w-lg w-full p-6">
        <h2 className="text-lg font-bold text-[#4F5962] dark:text-white mb-4 cursor-default">Edit Task List</h2>

        <label className="text-sm text-[#91989E] block mb-1">List Name</label>
        <input
          className="w-full px-4 py-2 mb-4 border border-[#4F596240] dark:border-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#90A9D6]"
          value={listName}
          onChange={(e) => setListName(e.target.value)}
        />

        <label className="text-sm text-[#91989E] block mb-1">Tasks</label>
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="max-h-64 overflow-y-auto space-y-4">
            {/* To-Dew Section */}
            <div>
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowTodo(!showTodo)}>
                {showTodo ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <h3 className="text-sm font-semibold text-[#4F5962] dark:text-white">To-Dew</h3>
              </div>
              {showTodo && (
                <Droppable droppableId="todo">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-2 pt-2"
                    >
                      {tasks.filter((t) => !t.isComplete).length > 0 ? tasks.filter((t) => !t.isComplete).map(renderTask) : <div className="h-10 border border-dashed border-[#ccc] rounded p-2 text-sm text-[#aaa] flex items-center justify-center">
                          Drop here to mark as To-Dew
                        </div>}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              )}
            </div>

            {/* Completed Section */}
            <div>
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowCompleted(!showCompleted)}>
                {showCompleted ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <h3 className="text-sm font-semibold text-[#4F5962] dark:text-white">Completed</h3>
              </div>
              {showCompleted && (
                <Droppable droppableId="completed">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-2 pt-2"
                    >
                      {tasks.filter((t) => t.isComplete).length > 0 ? tasks.filter((t) => t.isComplete).map(renderTask) : <div className="h-10 border border-dashed border-[#ccc] rounded p-2 text-sm text-[#aaa] flex items-center justify-center">
                          Drop here to mark as Completed
                        </div>}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              )}
            </div>
          </div>
        </DragDropContext>

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={() => {
              vibration("button-press");
              onClose();
              setDeletedTaskIds([]);
            }}
            className="text-[#91989E] px-4 py-2 rounded-lg cursor-pointer dark:hover:text-white hover:text-[#4F5962] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-[#4C6CA8] text-white px-4 py-2 rounded-xl hover:bg-[#3A5D91] cursor-pointer transition w-37"
          >
           {saving ? <span className="flex justify-center items-center gap-1">Saving <span className="mt-2"><DotLoader /></span></span> : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

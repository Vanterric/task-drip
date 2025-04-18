import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import DeleteTaskListModal from "./DeleteTaskListModal";
import EditTaskListModal from "./EditTaskListModal";
import { useRef, useEffect } from "react";
import { LogOut, Pencil, Plus, Trash2 } from "lucide-react";


export default function Sidebar({ isOpen, onClose, taskLists = [], onSelectList, onAddTaskList, token, setTaskLists, setActiveTaskList, activeTaskList, setTasks }) {
  const { logout } = useAuth();
  const [showInput, setShowInput] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [activeKebab, setActiveKebab] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [listToDelete, setListToDelete] = useState(null);
  const [listToEdit, setListToEdit] = useState(null);
  const panelRef = useRef(null);
let startX = 0;
let currentX = 0;
let touchingSidebar = false;

useEffect(() => {
  const panel = panelRef.current;
  if (!panel) return;

  let startX = 0;
  let currentX = 0;
  let touchingSidebar = false;
  let hasMovedEnoughToTrigger = false;

  const movementThreshold = 15; // 🧠 minimum movement before we even start sliding

  const handleTouchStart = (e) => {
    if (!isOpen) return;
    startX = e.touches[0].clientX;
    touchingSidebar = true;
    hasMovedEnoughToTrigger = false;
    panel.style.transition = ""; // remove transition for drag
  };

  const handleTouchMove = (e) => {
    if (!touchingSidebar) return;

    currentX = e.touches[0].clientX;
    const deltaX = currentX - startX;

    // Ignore slight wiggles
    if (!hasMovedEnoughToTrigger && Math.abs(deltaX) < movementThreshold) {
      return;
    }

    hasMovedEnoughToTrigger = true;
    e.preventDefault(); // stop horizontal page scroll
    const translateX = Math.min(0, deltaX);
    panel.style.transform = `translateX(${translateX}px)`;
  };

  const handleTouchEnd = () => {
    if (!touchingSidebar) return;
    touchingSidebar = false;

    const diff = currentX - startX;

    if (hasMovedEnoughToTrigger && diff < -60) {
      onClose(); // intentional swipe
    } else {
      // snap back
      panel.style.transition = "transform 0.2s ease-out";
      panel.style.transform = "translateX(0)";
      setTimeout(() => {
        panel.style.transition = "";
      }, 200);
    }
  };

  panel.addEventListener("touchstart", handleTouchStart, { passive: true });
  panel.addEventListener("touchmove", handleTouchMove, { passive: false });
  panel.addEventListener("touchend", handleTouchEnd, { passive: true });

  return () => {
    panel.removeEventListener("touchstart", handleTouchStart);
    panel.removeEventListener("touchmove", handleTouchMove);
    panel.removeEventListener("touchend", handleTouchEnd);
  };
}, [isOpen, onClose]);


useEffect(() => {
  const panel = panelRef.current;
  if (isOpen && panel) {
    panel.style.transform = "translateX(0)";
  }
}, [isOpen]);


  

  const handleAdd = async () => {
    if (!newListName.trim()) return;
    await onAddTaskList(newListName);
    setNewListName("");
    setShowInput(false);
  };

  const refetchTaskListsOrUpdateUI = async () => {
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
  
      // Fetch all lists
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/tasklists`, { headers });
      const updatedLists = await res.json();
      setTaskLists(updatedLists);
  
      // If the current active list still exists, keep it active
      const stillExists = updatedLists.find((l) => l._id === activeTaskList?._id);
  
      if (stillExists) {
        setActiveTaskList(stillExists);
  
        // Refresh tasks for the current active list
        const taskRes = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/tasks?tasklistId=${stillExists._id}`,
          { headers }
        );
        const updatedTasks = await taskRes.json();
        setTasks(updatedTasks);
      } else {
        // Fallback: set first available list as active
        setActiveTaskList(updatedLists[0] || null);
  
        if (updatedLists[0]) {
          const fallbackTaskRes = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/tasks?tasklistId=${updatedLists[0]._id}`,
            { headers }
          );
          const fallbackTasks = await fallbackTaskRes.json();
          setTasks(fallbackTasks);
        } else {
          setTasks([]);
        }
      }
    } catch (err) {
      console.error("Error refetching task lists or tasks:", err);
    }
  };
  

  return (
    <div>
    <div className="fixed inset-0 z-50 flex pointer-events-none">
     <div
    className={`fixed inset-0 transition-opacity duration-300 ${
      isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
    }`}
    style={{
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      pointerEvents: isOpen ? 'auto' : 'none',
    }}
    onClick={(e) => {
      console.log('ghost click');
      onClose();
      setActiveKebab(null);
    }}
  />

    {/* SLIDING PANEL */}
    <div
    ref={panelRef}
    onClick={(e) => {
      e.stopPropagation(); // 💥 prevents backdrop click
      setActiveKebab(null);
    }}
    className={`relative z-50 w-72 bg-white h-full shadow-lg flex flex-col transform transition-transform duration-300 ease-in-out ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}
    style={{ pointerEvents: 'auto', touchAction: "none"  }}
  >
        <div className="p-4 border-b text-xl font-bold text-[#4F5962]">
          Task Lists
        </div>

        {/* Scrollable task list */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          {taskLists.map((list) => (
            <div key={list._id} className="flex justify-between items-center w-full">
            <button
              onClick={() => {
                onSelectList(list);
                onClose();
              }}
              className="cursor-pointer text-left w-full px-3 py-2 rounded-lg hover:bg-[rgba(76,108,168,0.15)] text-[#4F5962]"
            >
              {list.name}
            </button>
          
            <button
              onClick={(e) => {e.stopPropagation();setActiveKebab(list._id)}}
              className="text-[#91989E] px-2 cursor-pointer hover:text-[#4F5962]"
            >
              ⋮
            </button>
          
            {activeKebab === list._id && (
              <div className="absolute right-4 mt-10 w-32 bg-white shadow-lg rounded-xl text-sm text-[#4F5962] z-50">
                  <button
                    className="cursor-pointer w-full flex items-center gap-2 text-left px-4 py-2 hover:bg-[rgba(76,108,168,0.15)] text-[#4C6CA8] transition rounded"
                    onClick={() => {
                      setShowEditModal(true);
                      setListToEdit(list);
                      setActiveKebab(null);
                    }}
                  >
                    <Pencil className="w-4 h-4 text-[#4C6CA8]" />
                    Edit List
                  </button>

                <button
                  className="cursor-pointer w-full flex items-center gap-2 text-left px-4 py-2 text-[#D66565] hover:bg-[rgba(214,101,101,0.15)] transition rounded"
                  onClick={() => {
                    setListToDelete(list);
                    setShowDeleteModal(true);
                    setActiveKebab(null);
                  }}
                >
                  <Trash2 className="w-4 h-4 text-[#D66565]" />
                  Delete List
                </button>
              </div>
            )}
          </div>
          
          ))}

          {showInput ? (
            <div className="mt-4 space-y-2">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="New list name"
                className="w-full px-3 py-2 rounded-lg border border-[#4F596254] focus:outline-none focus:ring-2 focus:ring-[#90A9D6]"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  className="bg-[#4C6CA8] text-white px-4 py-1 rounded hover:bg-[#3A5D91] cursor-pointer"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowInput(false);
                    setNewListName("");
                  }}
                  className="text-sm text-[#91989E] hover:text-[#4F5962] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowInput(true)}
              className="mt-4 flex items-center gap-2 text-sm text-[#4C6CA8] font-medium px-3 py-2 rounded-full hover:bg-[#F6F8FA] transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#4C6CA8]" />
              Add New Task List
            </button>

          )}
        </div>

        {/* Sticky logout */}
        <div className="p-4 border-t">
          <button
            className="cursor-pointer w-full flex justify-center items-center gap-2 text-[#D66565] hover:text-[#B94E4E] text-sm font-medium py-2 rounded transition"
            onClick={logout}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

    </div>
    <DeleteTaskListModal
  isOpen={showDeleteModal}
  onClose={() => {
    setShowDeleteModal(false);
    setListToDelete(null);
  }}
  listName={listToDelete?.name}
  onConfirm={async () => {
    await fetch(`${import.meta.env.VITE_BACKEND_URL}/tasklists/${listToDelete._id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    setTaskLists((prev) => prev.filter((l) => l._id !== listToDelete._id));
    const updatedLists = taskLists.filter((l) => l._id !== listToDelete._id);
setTaskLists(updatedLists);

// If the deleted list was active, pick the first remaining list (if any)
if (activeTaskList?._id === listToDelete._id) {
  setActiveTaskList(updatedLists[0] || null);

  // Optional: fetch tasks for the new list
  if (updatedLists[0]) {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/tasks?tasklistId=${updatedLists[0]._id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const newTasks = await res.json();
    setTasks(newTasks);
  } else {
    setTasks([]);
  }
}

    setShowDeleteModal(false);
    setListToDelete(null);
  }}
/>
<EditTaskListModal
  isOpen={showEditModal}
  onClose={() => setShowEditModal(false)}
  list={listToEdit}
  token={token}
  onSave={refetchTaskListsOrUpdateUI}
/>
    </div>
  );
}

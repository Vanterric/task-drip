import { useAuth } from "../context/AuthContext";
import { useContext, useState } from "react";
import { useNavigate } from 'react-router-dom';
import DeleteTaskListModal from "./DeleteTaskListModal";
import EditTaskListModal from "./EditTaskListModal";
import { useRef, useEffect } from "react";
import { ChartArea, Cog, Edit, Edit3, LogOut, LucideCalendarCog, Moon, Pencil, Plus, Settings, Sun, Trash2, Volume, Volume2, VolumeOff, VolumeX } from "lucide-react";
import { ThemeContext } from "../context/ThemeContext";
import { vibration } from "../utilities/vibration";
const dewListIcon = "/DewList_Icon.png";
const dewListGold = "/DewListGold.png";
import FeedbackModal from "./FeedbackModal";
import LucideIcon from "./LucideIcon";
import IconPickerModal from "./IconPickerModal";
import { handleUpdateIcon } from "../utilities/handleUpdateIcon";
import ResetScheduleModal from "./ResetScheduleModal";
import { subscribeToPush } from "../utilities/subscribeToPush";
import SettingsModal from "./SettingsModal";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { motion, useAnimation } from "framer-motion";
import { unsubscribeFromPush } from "../utilities/unsubscribeFromPush";
import { getDeviceLabel } from "../utilities/getDeviceLabel";
import { refetchTaskListsOrUpdateUI } from "../utilities/refetchTaskListsOrUpdateUI";
import { audio, isMuted, setIsMuted } from "../utilities/audio";
import { DotLoader } from "./DotLoader";


export default function Sidebar({ isOpen, onClose, taskLists = [], onSelectList, onAddTaskList, token, setTaskLists, setActiveTaskList, activeTaskList, setTasks, setShowUpgradeModal, setUpgradeReason, setFinalTask, handleCancelBreakdown }) {
  const { logout } = useAuth();
  const [showInput, setShowInput] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [activeKebab, setActiveKebab] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [listToDelete, setListToDelete] = useState(null);
  const [listToEdit, setListToEdit] = useState(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const panelRef = useRef(null);
  const { isDarkMode, setIsDarkMode } = useContext(ThemeContext);
  const { user } = useAuth();
  const [isIconPickerModalOpen, setIsIconPickerModalOpen] = useState(false);
  const [isResetScheduleModalOpen, setIsResetScheduleModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false); 
  const [draggedId, setDraggedId] = useState(null);
  const controls = useAnimation();
  const navigate = useNavigate();
  const [addingTask, setAddingTask] = useState(false);
  const [muteToggle, setMuteToggle] = useState(isMuted);
useEffect(() => {
  if (isOpen) {
    controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 25 } });
  } else {
    controls.start({ x: -288, transition: { type: "tween", duration: 0.2 } });
  }
}, [isOpen]);

useEffect(() => {
  setIsMuted(muteToggle);
}, [muteToggle]);


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
      audio('slide', isMuted);
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
    audio('button-press', isMuted);
    vibration('button-press')
    setAddingTask(true)
    await onAddTaskList(newListName);
    setNewListName("");
    setShowInput(false);
    audio('close-modal', isMuted);
    setAddingTask(false);
  };

  

  const handleSetResetSchedule = async (taskListId, isNotificationsEnabled, resetSchedule, taskListLabel = '') => {
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/tasklists/${taskListId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ resetSchedule }),
      });
      if (!res.ok) {
        throw new Error("Failed to set reset schedule");
      }
      const updatedList = await res.json();
      setTaskLists((prev) =>
        prev.map((list) => (list._id === updatedList._id ? updatedList : list))
      );
      if (activeTaskList?._id === updatedList._id) {
        setActiveTaskList(updatedList);
      }
      if (isNotificationsEnabled) {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        const device = getDeviceLabel();
        const success = await subscribeToPush(device, 'reset', taskListLabel, taskListId);
        if (!success) console.warn("Failed to subscribe for reset notifications");
      } else {
        console.warn("Notification permission was denied or dismissed.");
      }
    }

      refetchTaskListsOrUpdateUI({ token, activeTaskList, setTaskLists, setActiveTaskList, setTasks });
    } catch (error) {
      console.error("Error setting reset schedule:", error);
    }
  }

  const handleClearResetSchedule = async (taskListId) => {
  try {
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/tasklists/${taskListId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        resetSchedule: {
          number: null,
          cadence: null,
          startDate: null,
          lastReset: null,
        },
      }),
    });

    if (!res.ok) throw new Error("Failed to clear reset schedule");

    const updatedList = await res.json();
    setTaskLists((prev) =>
      prev.map((list) => (list._id === updatedList._id ? updatedList : list))
    );

    if (activeTaskList?._id === updatedList._id) {
      setActiveTaskList(updatedList);
    }

    await unsubscribeFromPush('reset', taskListId, null, user);
    refetchTaskListsOrUpdateUI({ token, activeTaskList, setTaskLists, setActiveTaskList, setTasks });
    setIsResetScheduleModalOpen(false);
  } catch (error) {
    console.error("Error clearing reset schedule:", error);
  }
};



  

  const handleListReorder = ({ source, destination }) => {
    setDraggedId(null)
  if (!destination) return;
  const updated = Array.from(taskLists);
  const [moved] = updated.splice(source.index, 1);
  updated.splice(destination.index, 0, moved);

  setTaskLists(updated);

  // Save new order immediately
  updated.forEach((list, index) => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/tasklists/${list._id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...list, order: index }),
    });
  });
};





  

  return (
    <div>
    <div className="fixed inset-0 z-50 flex pointer-events-none">
     <div
    className={`fixed inset-0 transition-opacity duration-300 ${
      isOpen ? 'opacity-100 backdrop-blur-sm' : 'opacity-0 pointer-events-none'
    }`}
    style={{
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      pointerEvents: isOpen ? 'auto' : 'none',
    }}
    onClick={(e) => {
      audio('slide', isMuted);
      onClose();
      setActiveKebab(null);
    }}
  />

    {/* SLIDING PANEL */}
    <motion.div
  ref={panelRef}
  onClick={(e) => {
    e.stopPropagation();
    setActiveKebab(null);
  }}
  className="relative z-50 w-72 pl-4 -ml-4 bg-white dark:bg-[#4F5962] h-full shadow-lg flex flex-col"
  style={{
    pointerEvents: 'auto',
    touchAction: 'none'
  }}
  drag="x"
  dragDirectionLock
  dragConstraints={{ left: -280, right: 0 }}
  dragElastic={{ left: 0.2, right: 0 }} 
  onDrag={(event, info) => {
    if (info.point.x > 0) {
      controls.start({
        x: 0,
        transition: { type: "tween", duration: 0.01 }
      });
    }
  }}
  onDragEnd={(e, info) => {
    if (info.offset.x < -60) {
      onClose();
    } else {
      controls.start({
        x: 0,
        transition: {
          type: "spring",
          stiffness: 150,
          damping: 25
        }
      });
    }
  }}
  animate={controls}
  initial={{ x: -288 }}
>
        <div className={`p-4 border-b border-[rgba(79,89,98,0.2)] dark:border-[rgba(255,255,255,0.2)] text-xl font-bold dark:text-white text-[#4F5962] flex items-center justify-between transition`}>
          <div className="flex gap-2 items-center cursor-default"><img alt='DewList Logo' loading="lazy" src = {user?.tier !== 'free' ? dewListGold : dewListIcon} className="h-8 w-8 cursor-default"/>{user?.tier !== 'free' ? <div className='cursor-default transition dark:border-yellow-300 border-yellow-500 border py-1 px-3 text-[12px] text-yellow-500 dark:text-yellow-300 rounded-full'>DewList {user?.tier === 'pro' ? 'Pro' : 'Focus'}</div> : <div onClick={()=>{audio('open-modal', isMuted);vibration('button-press');setUpgradeReason('go-pro');setShowUpgradeModal(true); onClose()}} className=' cursor-pointer transition dark:border-white border-[##4F5962] border py-1 px-3 text-[12px] text-[#4F5962] dark:text-white rounded-full'>Go Pro</div>}</div>

          <button onClick={() => {vibration('button-press'); setMuteToggle(!muteToggle); setTimeout(()=>audio('button-press', muteToggle), 0);}} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition cursor-pointer">
            {!muteToggle ? (
              <Volume2 className="w-5 h-5 dark:text-text-darkprimary text-text-primary" />
            ) : (
              <VolumeX className="w-5 h-5 dark:text-text-darkprimary text-text-primary" />
            )}
          </button>
        </div>
        {user.isReferrer ? 
        <div className={`pt-6 pl-4 gap-3 dark:text-white text-[#4F5962] flex items-center justify-start transition`}>
          <ChartArea className="w-5 h-5"/>
          <div className="text-sm hover:text-[#3A5D91] dark:hover:text-[#D4E3FF] cursor-pointer transition" onPointerDown={() => {audio('button-press', isMuted);vibration('button-press');}} onClick={()=>navigate(`/referrer-dashboard`)}>Referrer Dashboard</div>
        </div>
        :
        null}
        {showInput ? (
            <div className="mt-4 space-y-2 px-4">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="New list name"
                className="w-full text-sm px-3 py-2 rounded-lg border border-[#4F596254] focus:outline-none focus:ring-2 focus:ring-[#90A9D6] dark:border-white"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  className="bg-[#4C6CA8] text-sm text-white px-4 py-1 w-25 rounded-lg hover:bg-[#3A5D91] cursor-pointer"
                >
                  {addingTask ? <span className="flex justify-center items-center gap-1">Adding<span className="mt-2"><DotLoader/></span></span> : "Add"}
                </button>
                <button
                  onClick={() => {
                    audio('button-press', isMuted);
                    vibration('button-press');
                    setShowInput(false);
                    setNewListName("");
                  }}
                  className="text-sm text-[#91989E] hover:text-[#4F5962] cursor-pointer transition dark:hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              
              className="mt-5 flex pl-4 items-center gap-3 text-sm dark:text-white text-[#4F5962] rounded-full transition"
            >
              <Edit className="w-5 h-5 " />
              <div className="cursor-pointer hover:text-[#3A5D91] dark:hover:text-[#D4E3FF]" onClick={() => {vibration('button-press'); audio('button-press', isMuted); setShowInput(true)}}>
                Add New Task List
              </div>
            </button>

          )}
        {/* Scrollable task list */}
        <label htmlFor="tasklists" className="pl-4 pt-4 text-[#91989E]">Task Lists</label>
        <DragDropContext onDragEnd={handleListReorder} >
          <Droppable droppableId="taskLists" direction="vertical">
            {(provided) => (
        <div ref={provided.innerRef} {...provided.droppableProps} className="flex-1 overflow-y-auto px-4 pb-2 space-y-2">
          {taskLists.map((list) => (
            <Draggable key={list._id} draggableId={list._id} index={taskLists.indexOf(list)} >
          {(provided, snapshot) => {
            const isSelected = draggedId === list._id;
            return(
            <div 
            onPointerDown={() => setDraggedId(list._id)} 
            onPointerUp={() => setDraggedId(null)}
            ref={provided.innerRef} 
            {...provided.draggableProps} 
            {...provided.dragHandleProps} 
            className={`flex justify-between items-center w-full bg-white dark:bg-[#4F5962] rounded-lg ${isSelected ? 'shadow-lg' : ''}`}
            >
              <div className="cursor-pointer" onClick={() => {audio('open-modal', isMuted);setListToEdit(list);setIsIconPickerModalOpen(true); vibration('button-press')}}>
                <LucideIcon icon = {list.icon} size={20} />
                </div>
            <div
              onClick={() => {
                setTimeout(() => onClose(), 300);
                onSelectList(list);
              }}
              className="cursor-pointer text-sm text-left w-full px-3 py-2 rounded-lg hover:bg-[rgba(76,108,168,0.25)] text-[#4F5962] dark:text-white transition overflow-hidden text-ellipsis whitespace-nowrap"
            >
              {list.name}
            </div>
            <div className="relative">
            <button
              onClick={(e) => {e.stopPropagation();audio('button-press', isMuted);vibration('button-press');setActiveKebab(list._id)}}
              className="text-[#91989E] px-2 cursor-pointer hover:text-[#4F5962] dark:hover:text-white transition"
            >
              ⋮
            </button>
          
            {activeKebab === list._id && (
              <div className="absolute right-4 mt-[-30px] w-36 bg-white shadow-lg rounded-xl text-sm dark:bg-[#4F5962] z-50">
                  <button
                    className="cursor-pointer w-full flex items-center gap-2 text-left px-4 py-2 hover:bg-[rgba(76,108,168,0.15)] dark:text-[#90A9D6] text-[#4C6CA8] transition rounded"
                    onClick={() => {
                      vibration('button-press');
                      audio('open-modal', isMuted);
                      setShowEditModal(true);
                      setListToEdit(list);
                      setActiveKebab(null);
                    }}
                  >
                    <Pencil className="w-4 h-4 text-[#4C6CA8] dark:text-[#90A9D6]" />
                    Edit List
                  </button>
                  <button
                    className="cursor-pointer w-full flex items-center gap-2 text-left px-4 py-2 hover:bg-[rgba(76,108,168,0.15)] dark:text-[#90A9D6] text-[#4C6CA8] transition rounded"
                    onClick={() => {
                      vibration('button-press');
                      audio('open-modal', isMuted);
                      if (user?.tier === 'pro') {
                        setIsResetScheduleModalOpen(true);
                        setListToEdit(list);
                        setActiveKebab(null);
                      } else {
                        setUpgradeReason('scheduled-resets');
                        setShowUpgradeModal(true);
                        onClose();
                      }
                    }}
                  >
                    <LucideCalendarCog className="w-4 h-4 text-[#4C6CA8] dark:text-[#90A9D6]" />
                    Schedule
                  </button>

                <button
                  className="cursor-pointer w-full flex items-center gap-2 text-left px-4 py-2 text-[#D66565] hover:bg-[rgba(214,101,101,0.15)] transition rounded"
                  onClick={() => {
                    audio('open-modal', isMuted);
                    vibration('button-press');
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
          </div>
          )}}
            </Draggable>
          
          ))}
          {provided.placeholder}
          
        </div>
            )}
        </Droppable>
        </DragDropContext>
        {/* sticky settings */}
          <div onClick={()=>{audio('open-modal', isMuted);vibration('button-press'); setIsSettingsModalOpen(true)}} className="p-4 flex items-center justify-start gap-2 text-[#91989E] text-xs cursor-pointer hover:text-[#4F5962] dark:hover:text-white transition w-fit">
           <Settings className="w-5 h-5" />
            Settings
          </div>
        {/* Sticky logout */}
        <div className="p-4 border-t border-[rgba(79,89,98,0.2)] dark:border-[rgba(255,255,255,0.2)]">
          <button
            className="cursor-pointer w-full flex justify-center items-center gap-2 text-[#D66565] hover:text-[#B94E4E] text-sm font-medium py-2 rounded transition"
            
          >
            <LogOut className="w-4 h-4" />
            <div onClick={()=>{audio('button-press', isMuted);vibration('button-press'); setTimeout(()=>logout(), 200);}} className="cursor-pointer">
            Logout
            </div>
          </button>
          <div className="mt-4 text-xs text-[#91989E] flex justify-center space-x-2 ">
            <a target="blank" href="https://docs.google.com/document/d/1GQj9gn08KF13Wp9hGQL5dqdGIScAZgcbqiUuOO7_qaw/edit?usp=sharing" className="m1-4 hover:text-[#4F5962] dark:hover:text-white transition cursor-pointer">Privacy Policy</a>
            <a target="blank" href="https://docs.google.com/document/d/1lHYt0nikDrIXuEd7WNDzlv4GINUaVICziyxYykSXAfM/edit?usp=sharing" className="ml-4 hover:text-[#4F5962] dark:hover:text-white transition cursor-pointer">Terms and Conditions</a>
          </div>
          <div onClick={()=>{setIsFeedbackModalOpen(true);audio('open-modal', isMuted); vibration('button-press');}} className="m1-4 hover:text-[#4F5962] dark:hover:text-white transition cursor-pointer mt-4 text-xs text-[#91989E] flex justify-center space-x-2 text-center">Got thoughts? We want to hear them! DewList only adds what real people ask for.</div>
        </div>
      </motion.div>

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
    handleCancelBreakdown();
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
  onClose={() => {setShowEditModal(false)}}
  list={listToEdit}
  token={token}
  onSave={(taskData)=>{refetchTaskListsOrUpdateUI({ token, activeTaskList, setTaskLists, setActiveTaskList, setTasks }); 
        const incompleteTasks = taskData.filter(t => !t.isComplete);
        setActiveTaskList(listToEdit)
        setFinalTask(incompleteTasks[incompleteTasks.length -1])
        setTasks(taskData);}}
/>
<SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
{isResetScheduleModalOpen ? <ResetScheduleModal handleClearResetSchedule={handleClearResetSchedule} onClose={()=>setIsResetScheduleModalOpen(false)} onSubmit={handleSetResetSchedule} taskList = {listToEdit}/> : null}
{isIconPickerModalOpen ? <IconPickerModal listName={listToEdit.name} onSubmit={(listId, icon)=>{handleUpdateIcon(listId, icon, token, setTaskLists);}} onClose={()=>setIsIconPickerModalOpen(false)} listId={listToEdit._id} currentIcon = {listToEdit.icon}/>:null}

{isFeedbackModalOpen ? <FeedbackModal onClose={()=>setIsFeedbackModalOpen(false)}/>:null}
    </div>
  );
}

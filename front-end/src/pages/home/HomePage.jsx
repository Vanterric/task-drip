import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import AddTaskModal from "../../components/AddTaskModal";
import Sidebar from "../../components/Sidebar";
import DewListIcon from "../../assets/DewList_Icon.png";
import { AlarmClock, CheckCircle, Clock, LayoutPanelTop, List, Menu, Plus, RefreshCw, Sparkles } from "lucide-react"; // optional icon lib, or use emoji
import UpgradePromptModal from "../../components/UpgradePromptModal";
import ProgressBar from "../../components/ProgressBar";
import TaskDripBadge from "../../components/TaskDripBadge";
import AITaskBreakdownModal from "../../components/AITaskBreakdownModal";
import { vibration } from "../../utilities/vibration";
import FirstTimeUserTaskBreakdownModal from "../../components/FirstTimeUserTaskBreakDownModal";
import PWAInstallBanner from "../../components/PWAInstallBanner";
import PushNotificationBanner from "../../components/PushNotificationBanner";
import { setLastActiveAt } from "../../utilities/setLastActiveAt";
import getRelevantIcon from "../../utilities/getRelevantIcon";
import { handleUpdateIcon } from "../../utilities/handleUpdateIcon";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";


export default function HomePage() {
  const { token, user, wasDowngraded, setWasDowngraded, isFirstTimeUser, isFirst100User, setIsFirstTimeUser, setIsFirst100User, isSubscribedToPushNotifications, setIsSubscribedToPushNotifications } = useAuth();
  const [activeTaskList, setActiveTaskList] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [taskLists, setTaskLists] = useState([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showFirstTimeModal, setShowFirstTimeModal] = useState(false);
  const [finalTask, setFinalTask] = useState(null);
  const [skippedThroughEntireTaskList, setSkippedThroughEntireTaskList] = useState(false);
  const [isSkippedThroughAlertShown, setIsSkippedThroughAlertShown] = useState(false);
  const [viewType, setViewType] = useState('one-task'); // 'one-task' or 'list'
  const [draggedId, setDraggedId] = useState(null);
  

  

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
        
        setFinalTask(lists[0][-1])
        const resTasks = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/tasks?tasklistId=${lists[0]._id}`,
          { headers }
        );
        const taskData = await resTasks.json();
       const incompleteTasks = taskData.filter(t => !t.isComplete);
        setFinalTask(incompleteTasks[incompleteTasks.length -1])
        setTasks(taskData);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
  
    if (token) fetchData();
  }, [token]);

  useEffect(() => {
  const dismissed = localStorage.getItem('firstHundredBannerDismissed');
  if (dismissed === 'true') {
    setIsFirst100User(false);
  }
}, [isFirst100User, setIsFirst100User]);


  const closeFirstHundredBanner = () => {
  localStorage.setItem('firstHundredBannerDismissed', 'true');
  setIsFirst100User(false);
};

useEffect(() => {
  const checkFirstTime = async () => {
    if (isFirstTimeUser) {
      setShowFirstTimeModal(true);
    }
  };
  checkFirstTime();
}, [user]);

  const handleComplete = async (taskId) => {
    setLastActiveAt(user);
    const currentCompleteStatus = tasks.find(t => t._id === taskId).isComplete;
    vibration('button-press')
    const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
    await fetch(`${import.meta.env.VITE_BACKEND_URL}/tasks/${taskId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ isComplete: !currentCompleteStatus }),
    });
    vibration('task-completion')
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, isComplete: !currentCompleteStatus } : t))
    );
  };

  const handleSkip = (taskId) => {
    setLastActiveAt(user);
    vibration('button-press')
    if (finalTask && taskId === finalTask._id && !isSkippedThroughAlertShown) {
      setIsSkippedThroughAlertShown(true);
      return
    }
    if (isSkippedThroughAlertShown) {
      setIsSkippedThroughAlertShown(false);

    }    
    const index = tasks.findIndex((t) => t._id === taskId);
    const reordered = [...tasks];
    const [skipped] = reordered.splice(index, 1);
    reordered.push(skipped);
    setTasks(reordered);
  };

  const nextTask = tasks.find((t) => !t.isComplete);
  const completedCount = tasks.filter((t) => t.isComplete).length;

  function formatResetSchedule({ number, cadence, startDate }) {
  const date = new Date(startDate);
  const isSingle = number === 1;

  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  const weekday = date.toLocaleDateString(undefined, { weekday: 'long' });
  const month = date.toLocaleDateString(undefined, { month: 'long' });

  // Calculate ordinal week index
  const dayOfMonth = date.getDate();
  const weekOfMonth = Math.ceil(dayOfMonth / 7);

  const ordinal = ['1st', '2nd', '3rd', '4th', '5th'][weekOfMonth - 1] || `${weekOfMonth}th`;

  if (cadence === 'days') {
    return isSingle
      ? `Resets every day at ${time}`
      : `Resets every ${number} days at ${time}`;
  }

  if (cadence === 'weeks') {
    return isSingle
      ? `Resets every week on ${weekday}`
      : `Resets every ${number} weeks on ${weekday}`;
  }

  if (cadence === 'months') {
    return isSingle
      ? `Resets every month on the ${ordinal} ${weekday}`
      : `Resets every ${number} months on the ${ordinal} ${weekday}`;
  }

  if (cadence === 'years') {
    return isSingle
      ? `Resets every year on the ${ordinal} ${weekday} of ${month}`
      : `Resets every ${number} years on the ${ordinal} ${weekday} of ${month}`;
  }

  return '';
}

const handleTaskReorder = ({ source, destination }) => {
  setDraggedId(null);
  if (!destination) return;

  const updated = Array.from(tasks);
  const [moved] = updated.splice(source.index, 1);
  updated.splice(destination.index, 0, moved);

  setTasks(updated);

  // Save all task orders, regardless of change
  updated.forEach((task, index) => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/tasks/${task._id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...task, order: index }),
    });
  });
};


  return (
    <div className="min-h-screen bg-[#FAECE5] flex flex-col relative text-[#4F5962] dark:text-white dark:bg-[#212732] transition">
      {wasDowngraded && (
        <div className="bg-[#D4E3FF] text-[#4F5962] px-8 py-2 text-sm text-center relative z-11 rounded-lg shadow-md cursor-default">
          Your Pro subscription has ended. You’ve been downgraded to Free. <div className="font-semibold cursor-pointer inline-block" onClick={()=>setShowUpgradeModal(true)}>Upgrade to Pro</div> to unlock unlimited task lists and tasks.
          <button
            onClick={() => setWasDowngraded(!wasDowngraded)}
            className="absolute right-4 top-2 text-[#4F5962] hover:text-[#3A5D91] cursor-pointer"
          >
            ×
          </button>
        </div>
      )}
      {isFirst100User && (
        <div className="bg-[#D4E3FF] text-[#4F5962] px-8 py-2 text-sm text-center relative z-11 rounded-lg shadow-md cursor-default">
          🎉 Whoa, look at you! You're one of the first 100 people to try DewList. 
          To say thanks, we’ve unlocked a whole month of Pro for you — unlimited tasks, lists, and AI-powered breakdowns.
          Go wild (but like… one task at a time 😉)
          <button
            onClick={() => closeFirstHundredBanner()}
            className="absolute right-4 top-2 text-[#4F5962] hover:text-[#3A5D91] cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Masthead */}
      <div className="flex items-center justify-between px-4 py-4 max-[500px]:px-2 max-[500px]:py-2 absolute top-0 left-0 right-0 z-10 backdrop-blur-md">
  {/* TaskDrip branding + hamburger */}
  <div className="flex items-center justify-between px-4 py-4 w-full">
  {/* Left: Branding */}
  <div className="flex items-center space-x-2">
    <button
      className={`p-2  ${!activeTaskList ? 'glow-pulse' : ''} rounded-full bg-white dark:bg-[#4F5962] shadow-md hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#90A9D6] transition cursor-pointer`}
      onClick={() => {vibration('button-press'); setShowSidebar(true)}}
    >
      <Menu size={24}  />
    </button>
    <div className="flex items-center  font-semibold text-base tracking-wide">
      <div className="max-[400px]:hidden cursor-default">DewList</div>
      <img className="h-5 w-5 ml-2 max-[400px]:ml-0" alt="DewList Logo" src={DewListIcon}/>
    </div>
  </div>

  {/* Right: Active task list name */}
  <div className="flex-grow flex flex-col items-end justify-start max-w-[calc(100%-150px)] max-[400px]:max-w-[calc(100%-100px)]">
  <h1 className="text-2xl font-bold text-right truncate cursor-default max-w-[100%] max-[400px]:text-xl">
    {activeTaskList ? activeTaskList.name : ''}
  </h1>
  {activeTaskList?.resetSchedule && activeTaskList?.resetSchedule?.number && (
    <div className="ml-4 text-sm text-[#91989E] dark:text-[#A1A8B0] cursor-default text-right">
      {activeTaskList.resetSchedule.startDate && (
        <span className="ml-2 text-xs text-[#4BAF8E] dark:text-[#A1A8B0]">
          {formatResetSchedule(activeTaskList.resetSchedule)}
        </span>
      )}
      </div>
  )}
  </div>
</div>
</div>
  
      
      {viewType === "one-task" ? 
      /* One-Task View */
      (<div className="flex-grow flex flex-col items-center justify-center px-4">
        {loading ? (
          <p className="text-lg text-[#91989E]">Loading tasks...</p>
        ) : isSkippedThroughAlertShown && nextTask ? (
        <div className="w-full max-w-md text-center space-y-6">
        <div className="bg-[#F6DFD3] dark:bg-[#2D3545] rounded-3xl shadow-[inset_0_4px_8px_rgba(0,0,0,0.2)] p-6 text-xl font-semibold transition cursor-default">
          <p>End of List</p><p>Click skip to start over</p>
          </div> 
          <div className="flex gap-4 justify-center">
            <button
            onClick={() => handleComplete(nextTask._id)}
            className="cursor-pointer group flex items-center gap-2 bg-[#4BAF8E] text-white px-6 py-3 rounded-xl shadow-md hover:bg-[#3B8F75] hover:scale-105 active:scale-100 transition-all duration-200 ease-in-out"
          >
            <CheckCircle className="w-5 h-5 text-white transition-transform duration-200 group-hover:scale-110 group-hover:rotate-[10deg]" />
            Done
          </button>

              <button
                onClick={() => handleSkip(nextTask._id)}
                className="cursor-pointer group flex items-center gap-2 bg-[#4C6CA8] text-white px-6 py-3 rounded-xl shadow-md hover:bg-[#3A5D91] hover:scale-105 active:scale-100 transition-all duration-200 ease-in-out"
              >
                <RefreshCw className="w-5 h-5 text-white transition-transform duration-200 group-hover:rotate-180" />
                Skip
              </button>

            </div>

            <ProgressBar completedCount={completedCount} tasks={tasks} />
          </div>)
        : !activeTaskList || tasks.length === 0 ? (
          <p className="text-lg text-[#91989E] text-center cursor-default">
          {!activeTaskList
            ? "No lists yet. Tap the menu to create one."
            : "No tasks here yet. Tap Add Task to add your first."}
        </p>
        
        ) : nextTask ? (
          <div className="w-full max-w-md text-center space-y-6">
            <div className="bg-white dark:bg-[#4F5962] rounded-3xl shadow-lg p-6 text-xl font-semibold transition cursor-default">
              {nextTask.content}
              {/* <hr className="border-gray-300 dark:border-[#A1A8B0] w-full mt-6" />
              <div className="text-sm mt-5 font-normal">Example Description of Task</div>
              <div className="flex items-center justify-between text-xs gap-2 font-normal mt-5 mb-[-.5rem]">
              <div className = 'cursor-pointer'>Edit</div>
              <div className="flex gap-1 item-center justify-center"><AlarmClock className="h-4 w-4"/>6/25/2025</div>
              </div> */}
            </div>
            <div className="flex gap-4 justify-center">
            <button
            onClick={() => handleComplete(nextTask._id)}
            className="cursor-pointer group flex items-center gap-2 bg-[#4BAF8E] text-white px-6 py-3 rounded-xl shadow-md hover:bg-[#3B8F75] hover:scale-105 active:scale-100 transition-all duration-200 ease-in-out"
          >
            <CheckCircle className="w-5 h-5 text-white transition-transform duration-200 group-hover:scale-110 group-hover:rotate-[10deg]" />
            Done
          </button>

              <button
                onClick={() => handleSkip(nextTask._id)}
                className="cursor-pointer group flex items-center gap-2 bg-[#4C6CA8] text-white px-6 py-3 rounded-xl shadow-md hover:bg-[#3A5D91] hover:scale-105 active:scale-100 transition-all duration-200 ease-in-out"
              >
                <RefreshCw className="w-5 h-5 text-white transition-transform duration-200 group-hover:rotate-180" />
                Skip
              </button>

            </div>

            <ProgressBar completedCount={completedCount} tasks={tasks} />
          </div>
        ) : (<div>

              <div className="flex flex-col items-center justify-center mt-6 space-y-4">
                <TaskDripBadge />

                <div className="text-center text-[#4BAF8E] text-xl font-semibold tracking-wide cursor-default">
  All tasks complete! Chill Time.
</div>



              </div>


          <ProgressBar completedCount={completedCount} tasks={tasks} />
          </div>
        )}
      </div>) : 
      /* List View */
      (
        <div className="max-[500px]:mt-20 mt-25">
          {tasks.length > 0 && tasks.every((task) => task.isComplete) && (
            <div className="flex flex-col items-center justify-center mt-6 space-y-4 mb-2">
              <TaskDripBadge />
              <div className="text-center text-[#4BAF8E] text-xl font-semibold tracking-wide cursor-default">
                All tasks complete! Chill Time.
              </div>
            </div>
          )}
        <DragDropContext onDragEnd={handleTaskReorder} >
          

  <Droppable droppableId="taskListArea">
    {(provided) => (
      <div
        {...provided.droppableProps}
        ref={provided.innerRef}
        className={`flex-grow flex flex-col items-start px-3 w-full max-w-4xl mx-auto overflow-y-auto pb-20 ${tasks.length > 0 && tasks.every((task) => task.isComplete) ? 'max-[500px]:max-h-[calc(100vh-270px)] max-h-[calc(100vh-290px)]' : 'max-[500px]:max-h-[calc(100vh-85px)] max-h-[calc(100vh-100px)]' }`}
      >
        
        {tasks.map((task, index) => (
          <Draggable key={task._id} draggableId={task._id} index={index}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                className={`flex flex-row gap-5 mt-5 p-4 justify-start items-start rounded-lg shadow-md bg-white dark:bg-[#4F5962] w-full cursor-default ${task.isComplete ? 'opacity-50 line-through' : ''}  relative`}
              >
                <input
                  type="checkbox"
                  checked={task.isComplete}
                  onChange={() => handleComplete(task._id)}
                  className="cursor-pointer appearance-none w-5 h-5 mt-1 rounded-sm border shrink-0 border-[#4F5962] bg-white checked:bg-[#4C6CA8] checked:border-[#4C6CA8] focus:outline-none focus:ring-2 focus:ring-[#90A9D6] transition-all duration-150 relative"
                />
                {task.content}
              </div>
            )}
          </Draggable>
        ))}
        {provided.placeholder}
      </div>
    )}
  </Droppable>
</DragDropContext>
</div>
      )}

      <div className="flex justify-between items-center px-2 py-2 fixed bottom-0 left-0 right-0 z-10 max-w-fit gap-4 mx-auto backdrop-blur-md dark:bg-white/10 bg-white/50 border-t border-white/20 shadow-md rounded-full mb-2">
<button
  className= {`cursor-pointer group flex items-center gap-2 bg-[#4C6CA8] text-white px-4 py-4 rounded-full text-lg shadow-xl hover:bg-[#3A5D91] hover:scale-105 transition-all duration-200 ease-in-out active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#90A9D6]`}
  onClick={() => {vibration('button-press'); if (user.isPro) {setShowAIModal(true)} else {setShowUpgradeModal(true)}}}
>
<Sparkles className="w-5 h-5 text-white transition-transform duration-200 group-hover:rotate-12 group-hover:scale-110" />
</button>
      <button
  className= {`${activeTaskList && tasks.length === 0 ? 'glow-pulse' : ''} cursor-pointer group flex items-center gap-2 bg-[#4C6CA8] text-white px-6 py-3 rounded-full text-lg shadow-xl hover:bg-[#3A5D91] hover:scale-105 transition-all duration-200 ease-in-out active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#90A9D6]`}
  onClick={() => {
    vibration('button-press');
    if (tasks.length >= 5 && !user.isPro) {
      setShowUpgradeModal(true);
      return;
    }
    setShowAddModal(true);
  }}
>
  <Plus className="w-5 h-5 text-white transition-transform duration-200 group-hover:rotate-90" />
  Add Task
</button>
<button
  className= {`cursor-pointer group flex items-center gap-2 bg-[#4C6CA8] text-white px-4 py-4 rounded-full text-lg shadow-xl hover:bg-[#3A5D91] hover:scale-105 transition-all duration-200 ease-in-out active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#90A9D6]`}
  onClick={() => {vibration('button-press'); 
  const resetTaskDetails = async (list)=>{
    setActiveTaskList(list);

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/tasks?tasklistId=${list._id}`,
      { headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }}
    );
    const taskData = await res.json();
        const incompleteTasks = taskData.filter(t => !t.isComplete);
        setFinalTask(incompleteTasks[incompleteTasks.length -1])
        setTasks(taskData);
    setIsSkippedThroughAlertShown(false);
    setTasks(taskData);
  }
  resetTaskDetails({...activeTaskList});
  setViewType(viewType === 'one-task' ? 'list' : 'one-task');}}
>
<div className="relative w-5 h-5 group">
  <List
    className={`absolute top-0 left-0 w-5 h-5 text-white transition-all duration-300 ease-in-out
      ${viewType === 'one-task' ? 'opacity-100 scale-100 rotate-0 group-hover:rotate-[-12deg] group-hover:scale-110' : 'opacity-0 scale-90 rotate-6'}
    `}
  />
  <LayoutPanelTop
    className={`absolute top-0 left-0 w-5 h-5 text-white transition-all duration-300 ease-in-out
      ${viewType !== 'one-task' ? 'opacity-100 scale-100 rotate-0 group-hover:rotate-[-12deg] group-hover:scale-110' : 'opacity-0 scale-90 -rotate-6'}
    `}
  />
</div>


</button>
</div>


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
      setActiveTaskList(activeList);
    }
  
    // Step 2: Create the task using the newly created or existing list
    const taskRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/tasks`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        tasklistId: activeList._id,
        content: text,
        order: tasks.length + 1, // append to end
      }),
    });
  
    const newTask = await taskRes.json();
    setFinalTask(newTask)
    setTasks((prev) => [...prev, newTask]);
  }}
  
/>
<UpgradePromptModal
  isOpen={showUpgradeModal}
  onClose={() => setShowUpgradeModal(false)}
  onUpgrade={() => {
    setShowUpgradeModal(false);
    // 🔁 send to Stripe Checkout
    window.location.href = '/subscribe'; // or whatever your route is
  }}
/>
<AITaskBreakdownModal token={token} isOpen={showAIModal} onClose={() => setShowAIModal(false)} setActiveTaskList={setActiveTaskList} setTasks={setTasks} setTaskLists={setTaskLists} setFinalTask = {setFinalTask}/>
  <FirstTimeUserTaskBreakdownModal isOpen={showFirstTimeModal} onClose={() => setShowFirstTimeModal(false)} setActiveTaskList={setActiveTaskList} setTasks={setTasks} setTaskLists={setTaskLists}/>
<Sidebar
setShowUpgradeModal={setShowUpgradeModal}
token={token}
  isOpen={showSidebar}
  onClose={() => setShowSidebar(false)}
  taskLists={taskLists}
  setTaskLists={setTaskLists}
  setActiveTaskList={setActiveTaskList}
  activeTaskList={activeTaskList}
  setTasks={setTasks}
  setFinalTask={setFinalTask}
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
        const incompleteTasks = taskData.filter(t => !t.isComplete);
        setFinalTask(incompleteTasks[incompleteTasks.length -1])
        setTasks(taskData);
    setIsSkippedThroughAlertShown(false);
    setTasks(taskData);
  }}
  onAddTaskList={async (name) => {
    if (!user.isPro && taskLists.length >= 3) {
      setShowUpgradeModal(true)
      setShowSidebar(false)
      return;
    }
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/tasklists`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, order: taskLists.length + 1 }),
    });

    const newList = await res.json();
    setTaskLists((prev) => [...prev, newList]);
    setActiveTaskList(newList);
    const newIcon = await getRelevantIcon(name)
    if (newIcon) handleUpdateIcon(newList._id, newIcon, token, setTaskLists);
    setTasks([]);
  }}
/>

<PWAInstallBanner />
<PushNotificationBanner isSubscribedToPushNotifications={isSubscribedToPushNotifications} setIsSubscribedToPushNotifications={setIsSubscribedToPushNotifications}/>
    </div>
  );
}
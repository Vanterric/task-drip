import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import AddTaskModal from "../../components/AddTaskModal";
import Sidebar from "../../components/Sidebar";
import DewListIcon from "../../assets/DewList_Icon.png";
import { CheckCircle, Menu, Plus, RefreshCw, Sparkles } from "lucide-react"; // optional icon lib, or use emoji
import UpgradePromptModal from "../../components/UpgradePromptModal";
import ProgressBar from "../../components/ProgressBar";
import TaskDripBadge from "../../components/TaskDripBadge";
import AITaskBreakdownModal from "../../components/AITaskBreakdownModal";
import { vibration } from "../../utilities/vibration";
import FirstTimeUserTaskBreakdownModal from "../../components/FirstTimeUserTaskBreakDownModal";
import PWAInstallBanner from "../../components/PWAInstallBanner";
import PushNotificationBanner from "../../components/PushNotificationBanner";

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


  console.log("Frontend VAPID Public Key:", import.meta.env.VITE_VAPID_PUBLIC_KEY);


  const handleComplete = async (taskId) => {
    vibration('button-press')
    const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
    await fetch(`${import.meta.env.VITE_BACKEND_URL}/tasks/${taskId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ isComplete: true }),
    });
    vibration('task-completion')
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, isComplete: true } : t))
    );
  };

  const handleSkip = (taskId) => {
    vibration('button-press')
    const index = tasks.findIndex((t) => t._id === taskId);
    const reordered = [...tasks];
    const [skipped] = reordered.splice(index, 1);
    reordered.push(skipped);
    setTasks(reordered);
  };

  const nextTask = tasks.find((t) => !t.isComplete);
  const completedCount = tasks.filter((t) => t.isComplete).length;

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
      <div className="flex items-center justify-between px-4 py-4 max-[500px]:px-2 max-[500px]:py-2 absolute top-0 left-0 right-0 z-10 ">
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
  <h1 className="text-2xl font-bold text-right truncate max-w-[60%] cursor-default">
    {activeTaskList ? activeTaskList.name : ''}
  </h1>
</div>
</div>


      <div className="flex-grow flex flex-col items-center justify-center px-4">
        {loading ? (
          <p className="text-lg text-[#91989E]">Loading tasks...</p>
        ) : !activeTaskList || tasks.length === 0 ? (
          <p className="text-lg text-[#91989E] text-center cursor-default">
          {!activeTaskList
            ? "No lists yet. Tap the menu to create one."
            : "No tasks here yet. Tap Add Task to add your first."}
        </p>
        
        ) : nextTask ? (
          <div className="w-full max-w-md text-center space-y-6">
            <div className="bg-white dark:bg-[#4F5962] rounded-3xl shadow-lg p-6 text-xl font-semibold transition cursor-default">
              {nextTask.content}
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
      </div>

      <button
  className= {`${activeTaskList && tasks.length === 0 ? 'glow-pulse' : ''} cursor-pointer group fixed bottom-6 right-6 flex items-center gap-2 bg-[#4C6CA8] text-white px-6 py-4 rounded-full text-lg shadow-xl hover:bg-[#3A5D91] hover:scale-105 transition-all duration-200 ease-in-out active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#90A9D6]`}
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
{user?.isPro ? <button
  className= {`cursor-pointer group fixed bottom-6 left-6 flex items-center gap-2 bg-[#4C6CA8] text-white px-4 py-4 rounded-full text-lg shadow-xl hover:bg-[#3A5D91] hover:scale-105 transition-all duration-200 ease-in-out active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#90A9D6]`}
  onClick={() => {vibration('button-press'); setShowAIModal(true)}}
>
<Sparkles className="w-5 h-5 text-white transition-transform duration-200 group-hover:rotate-12 group-hover:scale-110" />
</button> : null}


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
      }),
    });
  
    const newTask = await taskRes.json();
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
<AITaskBreakdownModal isOpen={showAIModal} onClose={() => setShowAIModal(false)} setActiveTaskList={setActiveTaskList} setTasks={setTasks} setTaskLists={setTaskLists}/>
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
      body: JSON.stringify({ name }),
    });

    const newList = await res.json();
    setTaskLists((prev) => [...prev, newList]);
    setActiveTaskList(newList);
    setTasks([]);
  }}
/>

<PWAInstallBanner />
<PushNotificationBanner isSubscribedToPushNotifications={isSubscribedToPushNotifications} setIsSubscribedToPushNotifications={setIsSubscribedToPushNotifications}/>
    </div>
  );
}
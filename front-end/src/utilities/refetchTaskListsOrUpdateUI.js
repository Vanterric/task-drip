import { useAuth } from "../context/AuthContext";

export const refetchTaskListsOrUpdateUI = async ({ token,  activeTaskList, setTaskLists, setActiveTaskList, setTasks }) => {
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
export const handleUpdateIcon = async (listId, icon, token, setTaskLists) => {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/tasklists/${listId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ icon }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error?.error || "Failed to update icon");
    }

    const updatedList = await response.json();
    setTaskLists((prev ) => prev.map((list => list._id === listId ? {...list, icon:icon}: list)))
    return updatedList;
  } catch (err) {
    console.error("Icon update failed:", err.message);
    throw err;
  }
};
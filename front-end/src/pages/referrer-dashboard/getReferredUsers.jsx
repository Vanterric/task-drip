const getReferredUsers = async (referrer) => {
    try {
    const url = new URL(`${import.meta.env.VITE_BACKEND_URL}/getReferredUsers`);
    url.searchParams.set('referrer', referrer);

    const res = await fetch(url);

    if (!res.ok) {
      console.warn(`🛑 User Fetch Failed`);
      return null;
    }

    const data = await res.json();
    return data.users;

  } catch (err) {
    console.error('🚨 getReferredUsers error:', err);
    return null;
  }
}
export default getReferredUsers;
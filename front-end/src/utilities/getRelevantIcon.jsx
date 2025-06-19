const getRelevantIcon = async (prompt) => {
  if (!prompt || prompt.length < 2) return null;

  try {
    const url = new URL(`${import.meta.env.VITE_BACKEND_URL}/icon`);
    url.searchParams.set('prompt', prompt);

    const res = await fetch(url);

    if (!res.ok) {
      console.warn(`🛑 Icon fetch failed: ${res.status}`);
      return null;
    }

    const data = await res.json();
    return data?.icon?.name || null;

  } catch (err) {
    console.error('🚨 getRelevantIcon error:', err);
    return null;
  }
};
export default getRelevantIcon;
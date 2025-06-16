export const setLastActiveAt = (user) => {
  if (!user || !user.id) return;

  fetch(`${import.meta.env.VITE_BACKEND_URL}/user/setLastActiveAt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
    body: JSON.stringify({ user }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to update last active time');
      }
      return response.json();
    })
    .then((data) => {
      console.log('Last active time updated:', data);
    })
    .catch((error) => {
      console.error('Error updating last active time:', error);
    });
}